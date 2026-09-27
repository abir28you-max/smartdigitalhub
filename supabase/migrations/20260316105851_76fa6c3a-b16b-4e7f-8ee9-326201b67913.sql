UPDATE products SET 
  name = TRIM(name),
  slug = LOWER(TRIM(BOTH '-' FROM REGEXP_REPLACE(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')))
WHERE slug IS NULL OR slug = '' OR slug ~ '-$' OR slug ~ '^-' OR name != TRIM(name);