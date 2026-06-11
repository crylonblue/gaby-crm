-- Add VAT handling mode to seller settings.
-- The business is a self-employed Seniorenassistenz whose services are exempt from
-- VAT under § 4 Nr. 16 UStG, so the default mode is 'exempt_16' (0% USt, no tax shown).
--   'standard'         -> regelbesteuert (19%/7% USt ausgewiesen)
--   'kleinunternehmer' -> § 19 UStG (kein USt-Ausweis)
--   'exempt_16'        -> steuerfrei nach § 4 Nr. 16 UStG
ALTER TABLE `seller_settings` ADD `tax_mode` text DEFAULT 'exempt_16' NOT NULL;
--> statement-breakpoint
ALTER TABLE `seller_settings` ADD `tax_exemption_reason` text;
