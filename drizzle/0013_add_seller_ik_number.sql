-- Add Institutionskennzeichen (IK number) to seller settings.
-- Required on invoices to health insurances (Pflegedienst billing).
ALTER TABLE `seller_settings` ADD `ik_number` text;
