-- Amplia foto_url de VARCHAR(500) para TEXT para suportar base64 data URLs
ALTER TABLE usuarios ALTER COLUMN foto_url TYPE TEXT;
