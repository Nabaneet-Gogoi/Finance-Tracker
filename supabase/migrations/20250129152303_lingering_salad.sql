/*
  # Initial Schema for Finance Tracker

  1. New Tables
    - users (managed by Supabase Auth)
    - categories
      - id (uuid, primary key)
      - name (text)
      - color (text)
      - user_id (uuid, foreign key)
    - expenses
      - id (uuid, primary key)
      - amount (numeric)
      - description (text)
      - date (timestamp)
      - category_id (uuid, foreign key)
      - payment_method (text)
      - user_id (uuid, foreign key)
    - budgets
      - id (uuid, primary key)
      - amount (numeric)
      - category_id (uuid, foreign key)
      - user_id (uuid, foreign key)
      - month (date)
    - receipts
      - id (uuid, primary key)
      - expense_id (uuid, foreign key)
      - url (text)
      - uploaded_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Categories Table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, user_id)
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own categories"
  ON categories
  USING (auth.uid() = user_id);

-- Expenses Table
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric NOT NULL CHECK (amount > 0),
  description text,
  date timestamptz DEFAULT now(),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  payment_method text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own expenses"
  ON expenses
  USING (auth.uid() = user_id);

-- Budgets Table
CREATE TABLE budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric NOT NULL CHECK (amount > 0),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  month date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category_id, user_id, month)
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own budgets"
  ON budgets
  USING (auth.uid() = user_id);

-- Receipts Table
CREATE TABLE receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid REFERENCES expenses(id) ON DELETE CASCADE,
  url text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage receipts for their expenses"
  ON receipts
  USING (
    EXISTS (
      SELECT 1 FROM expenses
      WHERE expenses.id = receipts.expense_id
      AND expenses.user_id = auth.uid()
    )
  );