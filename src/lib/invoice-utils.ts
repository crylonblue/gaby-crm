import type { Invoice, NewInvoice } from "@/db/schema";

/**
 * Calculates the gross amount (including VAT) for an invoice
 * Uses lineItemsJson if available, otherwise falls back to hours/km calculation
 */
export function calculateInvoiceGrossAmount(invoice: Invoice | NewInvoice): number {
  // If lineItemsJson is available, use it for accurate calculation
  if ('lineItemsJson' in invoice && invoice.lineItemsJson) {
    try {
      const lineItems = JSON.parse(invoice.lineItemsJson);
      
      const netTotal = lineItems.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.unitPrice);
      }, 0);
      
      const vatTotal = lineItems.reduce((sum: number, item: any) => {
        const itemNet = item.quantity * item.unitPrice;
        const vatRate = typeof item.vatRate === 'number' && !isNaN(item.vatRate) 
          ? item.vatRate 
          : 19;
        return sum + (itemNet * (vatRate / 100));
      }, 0);
      
      return netTotal + vatTotal;
    } catch (error) {
      console.error("Error parsing lineItemsJson for amount calculation:", error);
      // Fall through to legacy calculation
    }
  }
  
  // Fallback to legacy hours/km calculation with 19% VAT
  const hours = 'hours' in invoice ? invoice.hours : 0;
  const ratePerHour = 'ratePerHour' in invoice ? invoice.ratePerHour : 0;
  const km = 'km' in invoice ? invoice.km : 0;
  const ratePerKm = 'ratePerKm' in invoice ? invoice.ratePerKm : 0;
  
  return ((hours * ratePerHour) + (km * ratePerKm)) * 1.19;
}
