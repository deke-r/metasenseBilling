-- SQL Queries to update database schema for Invoice enhancements
-- Execute these queries manually in your MySQL database

-- 1. Add GST column to clients table
ALTER TABLE clients 
ADD COLUMN gst VARCHAR(50) NULL AFTER address;

-- 2. Add IFSC Code and Branch columns to company_settings table
ALTER TABLE company_settings 
ADD COLUMN ifsc_code VARCHAR(20) NULL AFTER account_number,
ADD COLUMN branch VARCHAR(100) NULL AFTER ifsc_code;

-- 3. Add Registered Address and Office Address columns to company_settings table
-- (Replacing the single seller_address with two separate fields)
ALTER TABLE company_settings 
ADD COLUMN regd_address VARCHAR(255) NULL AFTER seller_name,
ADD COLUMN offc_address VARCHAR(255) NULL AFTER regd_address;

-- 4. Optional: If you want to migrate existing seller_address data to regd_address
-- Uncomment the following line if you have existing data in seller_address
-- UPDATE company_settings SET regd_address = seller_address WHERE regd_address IS NULL;

-- 5. Optional: Drop the old seller_address column if you no longer need it
-- Uncomment the following line only after you've migrated the data
-- ALTER TABLE company_settings DROP COLUMN seller_address;

-- Verify the changes
DESCRIBE clients;
DESCRIBE company_settings;
