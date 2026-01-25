import { zugferd } from "node-zugferd";
import { EN16931 } from "node-zugferd/profile/en16931";
import type { Invoice } from "./schema";
import { mapUnitToZugferdCode } from "./units";

/**
 * Maps invoice data to ZUGFeRD/XRechnung format
 * This function is shared between PDF embedding and XML-only generation
 * 
 * XRechnung BR-DE Rules implemented:
 * - BR-DE-1: Payment Instructions (BG-16) - Always include payment means
 * - BR-DE-2: Seller Contact (BG-6) - Contact name, phone, email
 * - BR-DE-15: Buyer Reference (BT-10) - Required reference
 */
function mapInvoiceToZugferdData(invoice: Invoice) {
  // Group items by VAT rate and calculate totals per rate
  const vatGroups = new Map<number, { basisAmount: number; taxAmount: number }>();
  
  let netTotalUnrounded = 0;
  let taxTotalUnrounded = 0;
  
  for (const item of invoice.items) {
    const itemNet = item.quantity * item.unitPrice;
    // Ensure vatRate is a number - use item's vatRate if available, otherwise fall back to invoice taxRate
    const itemVatRate = typeof item.vatRate === 'number' && !isNaN(item.vatRate)
      ? item.vatRate
      : (invoice.taxRate || 19);
    const itemTax = itemNet * (itemVatRate / 100);
    
    netTotalUnrounded += itemNet;
    taxTotalUnrounded += itemTax;
    
    // Group by VAT rate
    const existing = vatGroups.get(itemVatRate) || { basisAmount: 0, taxAmount: 0 };
    vatGroups.set(itemVatRate, {
      basisAmount: existing.basisAmount + itemNet,
      taxAmount: existing.taxAmount + itemTax,
    });
  }
  
  const grossTotalUnrounded = netTotalUnrounded + taxTotalUnrounded;
  
  // Round to 2 decimal places for ZUGFeRD compliance
  const netTotal = parseFloat((Math.round(netTotalUnrounded * 100) / 100).toFixed(2));
  const taxAmount = parseFloat((Math.round(taxTotalUnrounded * 100) / 100).toFixed(2));
  const grossTotal = parseFloat((Math.round(grossTotalUnrounded * 100) / 100).toFixed(2));
  
  // Build VAT breakdown array from groups
  const vatBreakdown = Array.from(vatGroups.entries()).map(([rate, amounts]) => ({
    calculatedAmount: parseFloat((Math.round(amounts.taxAmount * 100) / 100).toFixed(2)),
    typeCode: "VAT" as const,
    basisAmount: parseFloat((Math.round(amounts.basisAmount * 100) / 100).toFixed(2)),
    // Use category "S" for standard rate, "Z" for zero rate, "E" for exempt
    categoryCode: (rate === 0 ? "Z" : "S") as "S" | "Z" | "E",
    rateApplicablePercent: rate,
  }));

  // Ensure VAT ID has country prefix (required by ZUGFeRD)
  const sellerVatId = invoice.seller.vatId
    ? invoice.seller.vatId.startsWith(invoice.seller.address.country)
      ? invoice.seller.vatId
      : `${invoice.seller.address.country}${invoice.seller.vatId}`
    : undefined;

  // BR-CO-26: At least one of seller identifier (BT-29), legal registration (BT-30), or VAT ID (BT-31) required
  // Build legal registration if registerNumber is provided (BT-30)
  const sellerLegalRegistration = invoice.seller.registerNumber
    ? {
        identifier: invoice.seller.registerNumber,
        // Scheme 0002 = Handelsregister (German commercial register)
        schemeIdentifier: "0002" as const,
      }
    : undefined;

  // BR-DE-15: Buyer Reference - Use provided reference or fallback to invoice number
  const buyerReference = invoice.buyerReference || invoice.invoiceNumber;

  // BR-DE-2: Seller Contact - Build contact object if any contact info exists
  // Field names must match node-zugferd EN16931 schema:
  // - name (not personName)
  // - phoneNumber (not telephoneUniversalCommunication)
  // - emailAddress (not emailURIUniversalCommunication)
  const sellerContact = invoice.seller.contact && 
    (invoice.seller.contact.name || invoice.seller.contact.phone || invoice.seller.contact.email)
    ? {
        name: invoice.seller.contact.name || undefined,
        phoneNumber: invoice.seller.contact.phone || undefined,
        emailAddress: invoice.seller.contact.email || undefined,
      }
    : undefined;

  // BR-DE-1: Payment Instructions - Always required for XRechnung
  // Field name must be "paymentInstruction" (not "paymentMeans")
  // Type code 58 = SEPA Credit Transfer (standard for German invoices)
  // Type code 30 = Credit Transfer (non-SEPA)
  // IBAN goes in transfers array with paymentAccountIdentifier
  const paymentInstruction = {
    typeCode: "58" as const, // SEPA Credit Transfer
    ...(invoice.bankDetails?.iban && {
      transfers: [{
        paymentAccountIdentifier: invoice.bankDetails.iban.replace(/\s/g, ""),
      }],
    }),
  };

  // Seller electronic address (PEPPOL-EN16931-R020)
  // Use contact email or fall back to a placeholder
  // schemeIdentifier "EM" = Email address
  const sellerElectronicAddress = invoice.seller.contact?.email
    ? { value: invoice.seller.contact.email, schemeIdentifier: "EM" as const }
    : undefined;

  // Buyer electronic address (PEPPOL-EN16931-R010)
  // Use customer email from additionalInfo or undefined
  const buyerEmail = invoice.customer.additionalInfo?.find(info => info.includes('@'));
  const buyerElectronicAddress = buyerEmail
    ? { value: buyerEmail, schemeIdentifier: "EM" as const }
    : undefined;

  // Map invoice data to ZUGFeRD EN16931 format (XRechnung standard)
  return {
    netTotal,
    taxAmount,
    grossTotal,
    zugferdData: {
      // PEPPOL-EN16931-R001: Business process type
      businessProcessType: "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0",
      // BR-DE-21: XRechnung specification identifier
      specificationIdentifier: "urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0",
      number: invoice.invoiceNumber,
      issueDate: invoice.invoiceDate,
      typeCode: "380", // Commercial invoice (ZUGFeRD type code)
      currency: invoice.currency,
      transaction: {
        tradeAgreement: {
          // BR-DE-15: Buyer Reference (required)
          buyerReference,
          seller: {
            name: invoice.seller.name,
            // BR-DE-2: Seller Contact (required for XRechnung)
            // Field name must be "tradeContact" (not "definedTradeContact")
            tradeContact: sellerContact,
            // Postal address field names must match node-zugferd schema:
            // - postCode (not postcode)
            // - line1 (not lineOne)
            postalAddress: {
              countryCode: invoice.seller.address.country as any,
              postCode: invoice.seller.address.postalCode,
              line1: `${invoice.seller.address.street} ${invoice.seller.address.streetNumber}`,
              city: invoice.seller.address.city,
            },
            // PEPPOL-EN16931-R020: Seller electronic address
            electronicAddress: sellerElectronicAddress,
            // BR-CO-26: Legal registration (BT-30) - Handelsregisternummer
            legalRegistration: sellerLegalRegistration,
            // Tax registration (BT-31 VAT ID, local tax number)
            taxRegistration:
              sellerVatId || invoice.seller.taxNumber
                ? {
                    vatIdentifier: sellerVatId,
                    localIdentifier: invoice.seller.taxNumber
                      ? invoice.seller.taxNumber
                      : undefined,
                  }
                : undefined,
          },
          buyer: {
            name: invoice.customer.name,
            postalAddress: {
              countryCode: invoice.customer.address.country as any,
              postCode: invoice.customer.address.postalCode,
              line1: `${invoice.customer.address.street} ${invoice.customer.address.streetNumber}`,
              city: invoice.customer.address.city,
            },
            // PEPPOL-EN16931-R010: Buyer electronic address
            electronicAddress: buyerElectronicAddress,
          },
        },
        tradeDelivery: {}, // Required but can be empty for EN16931 profile
        tradeSettlement: {
          currencyCode: invoice.currency as any,
          // VAT breakdown per rate (supports multiple VAT rates)
          vatBreakdown,
          // BR-DE-1: Payment Instructions (always required)
          paymentInstruction,
          paymentTerms: grossTotal > 0
            ? {
                dueDate: (() => {
                  const invoiceDate = new Date(invoice.invoiceDate);
                  invoiceDate.setDate(invoiceDate.getDate() + 14);
                  return invoiceDate.toISOString().split("T")[0];
                })(),
              }
            : undefined,
          monetarySummation: {
            lineTotalAmount: netTotal,
            taxBasisTotalAmount: netTotal,
            taxTotal: {
              amount: taxAmount,
              currencyCode: invoice.currency as any,
            },
            grandTotalAmount: grossTotal,
            duePayableAmount: grossTotal,
          },
        },
        line: invoice.items.map((item, index) => {
          const itemTotalUnrounded = item.quantity * item.unitPrice;
          const itemTotal = parseFloat((Math.round(itemTotalUnrounded * 100) / 100).toFixed(2));
          // Ensure vatRate is a number - use item's vatRate if available, otherwise fall back to invoice taxRate
          const itemVatRate = typeof item.vatRate === 'number' && !isNaN(item.vatRate)
            ? item.vatRate
            : (invoice.taxRate || 19);

          return {
            identifier: `LINE-${index + 1}`,
            tradeProduct: {
              name: item.description,
            },
            tradeAgreement: {
              netTradePrice: {
                chargeAmount: itemTotal,
                basisQuantity: {
                  amount: item.quantity,
                  unitMeasureCode: mapUnitToZugferdCode(item.unit),
                },
              },
            },
            tradeDelivery: {
              billedQuantity: {
                amount: item.quantity,
                unitMeasureCode: mapUnitToZugferdCode(item.unit),
              },
            },
        tradeSettlement: {
          tradeTax: {
            typeCode: "VAT" as const,
            // Use "Z" for zero rate, "S" for standard rate
            categoryCode: (itemVatRate === 0 ? "Z" : "S") as "S" | "Z",
            rateApplicablePercent: itemVatRate,
          },
              monetarySummation: {
                lineTotalAmount: itemTotal,
              },
            },
          };
        }),
      },
      note: invoice.note ? [{ content: invoice.note }] : undefined,
    },
  };
}

/**
 * Generates ZUGFeRD XML from invoice data and embeds it into a PDF
 * @param invoice - The invoice data
 * @param pdfBuffer - The PDF buffer generated by pdf-lib
 * @returns PDF buffer with embedded ZUGFeRD XML (PDF/A-3b compliant)
 */
/**
 * Generates XRechnung/ZUGFeRD XML from invoice data (without PDF)
 * @param invoice - The invoice data
 * @returns XRechnung XML string (EN16931 compliant)
 */
export async function generateXRechnungXML(invoice: Invoice): Promise<string> {
  // Initialize ZUGFeRD invoicer with EN16931 profile (XRechnung standard)
  const invoicer = zugferd({
    profile: EN16931,
    strict: false, // Disable XSD schema validation to avoid Java dependency
  });

  // Map invoice data to ZUGFeRD format
  const { zugferdData } = mapInvoiceToZugferdData(invoice);

  // Create ZUGFeRD invoice
  const zugferdInvoice = invoicer.create(zugferdData as any);

  // Generate XML string
  const xmlString = await zugferdInvoice.toXML();

  return xmlString;
}

/**
 * Generates ZUGFeRD XML from invoice data and embeds it into a PDF
 * @param invoice - The invoice data
 * @param pdfBuffer - The PDF buffer generated by pdf-lib
 * @returns PDF buffer with embedded ZUGFeRD XML (PDF/A-3b compliant)
 */
export async function embedZugferdIntoPDF(
  invoice: Invoice,
  pdfBuffer: Uint8Array
): Promise<Uint8Array> {
  // Initialize ZUGFeRD invoicer with EN16931 profile (EU standard, more comprehensive)
  // Set strict: false to skip XSD validation (requires Java/xsd-schema-validator)
  // The XML structure is still validated by the library's schema validation
  const invoicer = zugferd({
    profile: EN16931,
    strict: false, // Disable XSD schema validation to avoid Java dependency
  });

  // Map invoice data to ZUGFeRD format (reuse shared function)
  const { zugferdData } = mapInvoiceToZugferdData(invoice);

  // Create ZUGFeRD invoice
  // Using 'as any' to work around strict typing in beta library
  const zugferdInvoice = invoicer.create(zugferdData as any);
  
  // Debug: Try to extract XML to verify values
  try {
    const xmlString = await zugferdInvoice.toXML();
    // Extract all monetary values from XML for verification
    const grandTotalMatch = xmlString.match(/<ram:GrandTotalAmount[^>]*>([^<]+)<\/ram:GrandTotalAmount>/);
    const taxTotalMatch = xmlString.match(/<ram:TaxTotalAmount[^>]*>([^<]+)<\/ram:TaxTotalAmount>/);
    const lineTotalMatch = xmlString.match(/<ram:LineTotalAmount[^>]*>([^<]+)<\/ram:LineTotalAmount>/);
    const taxBasisMatch = xmlString.match(/<ram:TaxBasisTotalAmount[^>]*>([^<]+)<\/ram:TaxBasisTotalAmount>/);
    
    console.log("ZUGFeRD XML extracted values:", {
      grandTotalAmount: grandTotalMatch ? grandTotalMatch[1] : "NOT FOUND",
      taxTotalAmount: taxTotalMatch ? taxTotalMatch[1] : "NOT FOUND",
      lineTotalAmount: lineTotalMatch ? lineTotalMatch[1] : "NOT FOUND",
      taxBasisTotalAmount: taxBasisMatch ? taxBasisMatch[1] : "NOT FOUND",
    });
    
    // Also check for any amount that might be 56.29
    const allAmounts = xmlString.match(/<ram:[^>]*Amount[^>]*>([^<]+)<\/ram:[^>]*>/g);
    if (allAmounts) {
      console.log("All amounts in XML:", allAmounts.slice(0, 10)); // First 10 amounts
    }
  } catch (e) {
    // Ignore if XML extraction fails
    console.log("Could not extract XML for debugging:", e);
  }

  // Embed ZUGFeRD XML into PDF and convert to PDF/A-3b using node-zugferd
  // Note: node-zugferd's embedInPdf handles PDF/A-3b conversion internally
  // However, there are known issues with XMP metadata encoding in the beta version
  // The PDF will contain ZUGFeRD XML and attempt PDF/A-3b compliance
  const pdfA = await zugferdInvoice.embedInPdf(pdfBuffer, {
    metadata: {
      title: `Rechnung ${invoice.invoiceNumber}`,
      author: invoice.seller.name,
      subject: `Invoice ${invoice.invoiceNumber}`,
      creator: invoice.seller.name,
      producer: "Invoice API",
      keywords: ["Invoice", "Rechnung", invoice.invoiceNumber, "ZUGFeRD", "EN16931"],
      createDate: new Date(invoice.invoiceDate),
      modifyDate: new Date(),
    },
  });

  return pdfA;
}


