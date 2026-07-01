-- Allow disabling the XRechnung (XML) e-invoice globally.
-- Some health insurances (e.g. Barmer) occasionally reject the XML, so the seller
-- can turn it off. Default is on (1) to preserve the existing behaviour.
ALTER TABLE `seller_settings` ADD `include_xrechnung` integer DEFAULT 1 NOT NULL;
