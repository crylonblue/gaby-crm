-- GoBD: enforce unique invoice numbers at the database level.
-- SQLite treats NULL as distinct, so invoices without a number yet are not affected.
-- NOTE: if this fails, duplicate invoice_number values already exist. Find them with:
--   SELECT invoice_number, COUNT(*) c FROM invoices
--   WHERE invoice_number IS NOT NULL GROUP BY invoice_number HAVING c > 1;
CREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);
