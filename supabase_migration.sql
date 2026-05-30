-- Run this in your Supabase project → SQL Editor

CREATE TABLE IF NOT EXISTS documents (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  analysis    JSONB       NOT NULL,
  verification JSONB,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents(user_id, uploaded_at DESC);

-- Row-level security: users only see their own documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON documents FOR DELETE USING (auth.uid() = user_id);

-- Notes column (run separately if table already exists)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS notes TEXT;
