import type { Invoice as DbInvoice, SellerSettings } from "@/db/schema";
import type { Invoice, Seller, BankDetails, Address, InvoiceItem } from "../../lib/schema";
import { getSellerSettings } from "./actions/seller.actions";

/**
 * Gets seller/company information from database
 * Falls back to environment variables or defaults if not configured
 */
export async function getSellerInfo(): Promise<Seller> {
  const settings = await getSellerSettings();
  
  if (settings) {
    return {
      name: settings.name || "Ihr Unternehmen",
      subHeadline: settings.subHeadline,
      address: {
        street: settings.street || "",
        streetNumber: settings.streetNumber || "",
        postalCode: settings.postalCode || "",
        city: settings.city || "",
        country: (settings.country || "DE") as "DE",
      },
      phoneNumber: settings.phoneNumber,
      email: settings.email,
      taxNumber: settings.taxNumber,
      vatId: settings.vatId,
      contact: settings.contactName || settings.contactPhone || settings.contactEmail
        ? {
            name: settings.contactName,
            phone: settings.contactPhone,
            email: settings.contactEmail,
          }
        : undefined,
      court: settings.court,
      registerNumber: settings.registerNumber,
      managingDirector: settings.managingDirector,
    };
  }

  // Fallback to environment variables
  return {
    name: process.env.SELLER_NAME || "Ihr Unternehmen",
    address: {
      street: process.env.SELLER_STREET || "",
      streetNumber: process.env.SELLER_STREET_NUMBER || "",
      postalCode: process.env.SELLER_POSTAL_CODE || "",
      city: process.env.SELLER_CITY || "",
      country: (process.env.SELLER_COUNTRY || "DE") as "DE",
    },
    phoneNumber: process.env.SELLER_PHONE,
    email: process.env.SELLER_EMAIL,
    taxNumber: process.env.SELLER_TAX_NUMBER,
    vatId: process.env.SELLER_VAT_ID,
    contact: process.env.SELLER_CONTACT_NAME || process.env.SELLER_CONTACT_PHONE || process.env.SELLER_CONTACT_EMAIL
      ? {
          name: process.env.SELLER_CONTACT_NAME,
          phone: process.env.SELLER_CONTACT_PHONE,
          email: process.env.SELLER_CONTACT_EMAIL,
        }
      : undefined,
    court: process.env.SELLER_COURT,
    registerNumber: process.env.SELLER_REGISTER_NUMBER,
    managingDirector: process.env.SELLER_MANAGING_DIRECTOR,
  };
}

/**
 * Gets bank details from database
 * Falls back to environment variables if not configured
 */
export async function getBankDetails(): Promise<BankDetails | undefined> {
  const settings = await getSellerSettings();
  
  if (settings && settings.iban && settings.bankName) {
    return {
      iban: settings.iban,
      bankName: settings.bankName,
      bic: settings.bic,
    };
  }

  // Fallback to environment variables
  const iban = process.env.SELLER_IBAN;
  const bankName = process.env.SELLER_BANK_NAME;

  if (!iban || !bankName) {
    return undefined;
  }

  return {
    iban,
    bankName,
    bic: process.env.SELLER_BIC,
  };
}

/**
 * Gets logo URL from database
 * Falls back to environment variable if not configured
 */
export async function getLogoUrl(): Promise<string | undefined> {
  const settings = await getSellerSettings();
  return settings?.logoUrl || process.env.SELLER_LOGO_URL;
}

/**
 * Gets invoice greeting text from database
 * Falls back to default greeting if not configured
 */
export async function getInvoiceGreeting(language: 'de' | 'en' = 'de'): Promise<string> {
  const settings = await getSellerSettings();
  if (settings?.invoiceGreeting) {
    return settings.invoiceGreeting;
  }
  // Default greeting
  return language === 'de' ? 'Sehr geehrte Damen und Herren,' : 'Dear Sir or Madam,';
}

/**
 * Generates an invoice number in format: YYYY-MM-XXXX
 * Where XXXX is a sequential number based on existing invoices for that month
 * 
 * This function:
 * 1. Queries all invoices for the given month
 * 2. Extracts sequence numbers from existing invoice numbers
 * 3. Finds the maximum sequence number
 * 4. Increments it to generate the next number
 * 
 * If no invoices exist for the month, it starts at 0001
 */
export async function generateInvoiceNumber(date: string): Promise<string> {
  const { db } = await import("@/db");
  const { invoices } = await import("@/db/schema");
  const { like, isNotNull } = await import("drizzle-orm");
  
  // Parse date - handle both ISO string and YYYY-MM-DD format
  const dateStr = date.includes("T") ? date.split("T")[0] : date;
  const [year, month] = dateStr.split("-");
  
  if (!year || !month) {
    throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
  }
  
  // Pattern to match invoice numbers for this month: YYYY-MM-XXXX
  const monthPattern = `${year}-${month}-%`;
  
  // Get all invoice numbers for this month
  const existingInvoices = await db
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(
      like(invoices.invoiceNumber, monthPattern)
    );
  
  // Extract sequence numbers and find the maximum
  // Support formats: YYYY-MM-XXXX or YYYY-MM-XXX or YYYY-MM-XX etc.
  let maxSequence = 0;
  const sequenceRegex = /^\d{4}-\d{2}-(\d+)$/;
  
  for (const invoice of existingInvoices) {
    if (!invoice.invoiceNumber) continue;
    
    const match = invoice.invoiceNumber.match(sequenceRegex);
    if (match && match[1]) {
      const sequence = parseInt(match[1], 10);
      if (!isNaN(sequence) && sequence > maxSequence) {
        maxSequence = sequence;
      }
    }
  }
  
  // Increment for the next invoice (starts at 1 if no invoices exist)
  const nextSequence = maxSequence + 1;
  
  // Format with leading zeros (4 digits)
  const sequenceStr = String(nextSequence).padStart(4, '0');
  
  return `${year}-${month}-${sequenceStr}`;
}

/**
 * Maps database invoice to PDF generator Invoice type
 */
export async function mapDbInvoiceToInvoice(dbInvoice: DbInvoice, invoiceNumber: string): Promise<Invoice> {
  const seller = await getSellerInfo();
  const bankDetails = await getBankDetails();
  const logoUrl = await getLogoUrl();

  // Build invoice items - prefer lineItemsJson if available, otherwise fall back to hours/km
  const items: InvoiceItem[] = [];
  
  if (dbInvoice.lineItemsJson) {
    try {
      const lineItems = JSON.parse(dbInvoice.lineItemsJson);
      items.push(...lineItems.map((item: any) => {
        // Ensure vatRate is a number and has a default value
        let vatRate = 19; // Default to 19%
        
        if (typeof item.vatRate === 'number' && !isNaN(item.vatRate)) {
          vatRate = item.vatRate;
        } else if (item.vatRate !== undefined && item.vatRate !== null) {
          const parsed = parseFloat(String(item.vatRate));
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
            vatRate = parsed;
          }
        }
        
        return {
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          vatRate: vatRate,
        };
      }));
    } catch (error) {
      console.error("Error parsing lineItemsJson:", error);
      // Fall through to legacy format
    }
  }

  // Fallback to legacy hours/km format if no line items from JSON
  if (items.length === 0) {
    // Add hours item
    if (dbInvoice.hours > 0) {
      items.push({
        description: dbInvoice.description,
        quantity: dbInvoice.hours,
        unit: "hour",
        unitPrice: dbInvoice.ratePerHour,
        vatRate: 19, // 19% VAT
      });
    }

    // Add km item if present
    if (dbInvoice.km > 0) {
      items.push({
        description: "Fahrtkosten",
        quantity: dbInvoice.km,
        unit: "km",
        unitPrice: dbInvoice.ratePerKm,
        vatRate: 19, // 19% VAT
      });
    }

    // If still no items, create a default item
    if (items.length === 0) {
      items.push({
        description: dbInvoice.description,
        quantity: 1,
        unit: "piece",
        unitPrice: 0,
        vatRate: 19,
      });
    }
  }

  // Format date as YYYY-MM-DD
  const invoiceDate = dbInvoice.date.includes("T") 
    ? dbInvoice.date.split("T")[0] 
    : dbInvoice.date;

  return {
    invoiceNumber,
    invoiceDate,
    serviceDate: invoiceDate, // Use invoice date as service date
    seller,
    customer: {
      name: `${dbInvoice.firstName} ${dbInvoice.lastName}`,
      address: {
        street: dbInvoice.street || "",
        streetNumber: dbInvoice.houseNumber || "",
        postalCode: dbInvoice.postalCode || "",
        city: dbInvoice.city || "",
        country: "DE" as "DE",
      },
      phoneNumber: undefined, // Not stored in invoice snapshot
      insuranceNumber: dbInvoice.insuranceNumber || undefined,
      additionalInfo: dbInvoice.invoiceEmail ? [dbInvoice.invoiceEmail] : undefined,
    },
    items,
    taxRate: 19, // 19% VAT
    currency: "EUR",
    logoUrl,
    bankDetails,
    buyerReference: invoiceNumber, // Use invoice number as buyer reference
  };
}
