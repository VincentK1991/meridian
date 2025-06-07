# add new column

ALTER TABLE users ADD COLUMN preferences TEXT;

# schema change

ALTER TABLE users ALTER COLUMN created_at SET DEFAULT NOW();

# add constraints

ALTER TABLE users ADD CONSTRAINT unique_email UNIQUE(email);