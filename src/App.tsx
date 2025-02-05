import React, { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { PieChart, LineChart, BarChart } from 'recharts';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Wallet, PlusCircle, CreditCard, PieChartIcon, BarChartIcon, LineChartIcon, Receipt, Search, Download, Bell } from 'lucide-react';
import { Auth } from './components/Auth';
import { ExpenseForm } from './components/ExpenseForm';
import { BudgetList } from './components/BudgetList';
import { TransactionList } from './components/TransactionList';
import { Dashboard } from './components/Dashboard';

interface Category {
  id: string;
  name: string;
  color: string;
  user_id?: string;
}

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  category_id: string;
  date: string;
  description: string;
  payment_method: string;
  category: {
    name: string;
  };
}

interface ExpenseFormData {
  amount: number;
  category_id: string;
  date: string;
  description: string;
  payment_method: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Food & Dining', color: '#FF6B6B' },
  { id: '2', name: 'Transportation', color: '#4ECDC4' },
  { id: '3', name: 'Shopping', color: '#45B7D1' },
  { id: '4', name: 'Entertainment', color: '#96CEB4' },
  { id: '5', name: 'Bills & Utilities', color: '#FFEEAD' },
  { id: '6', name: 'Health', color: '#D4A5A5' },
  { id: '7', name: 'Education', color: '#9B9B9B' },
  { id: '8', name: 'Other', color: '#A8E6CF' },
];

function App(): ReactElement {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState('month');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session) {
      fetchCategories();
      fetchExpenses();
    }
  }, [session]);

  const fetchCategories = async () => {
    try {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        await createDefaultCategories();
      } else {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const createDefaultCategories = async () => {
    try {
      if (!session?.user?.id) return;

      const { error } = await supabase.from('categories').insert(
        DEFAULT_CATEGORIES.map(category => ({
          ...category,
          user_id: session.user.id
        }))
      );
      if (error) throw error;
      await fetchCategories();
    } catch (error) {
      console.error('Error creating default categories:', error);
    }
  };

  const handleExpenseSubmit = async (data: ExpenseFormData) => {
    try {
      if (!session?.user?.id) return;

      const { error } = await supabase
        .from('expenses')
        .insert([{
          ...data,
          user_id: session.user.id
        }]);

      if (error) throw error;
      fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('expenses')
        .select('*, categories(*)')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      
      const formattedData = (data || []).map(expense => ({
        id: expense.id,
        user_id: expense.user_id,
        amount: expense.amount,
        category_id: expense.category_id,
        date: expense.date,
        description: expense.description,
        payment_method: expense.payment_method || 'Other',
        category: {
          name: expense.categories?.name || 'Uncategorized'
        }
      }));
      
      setExpenses(formattedData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Wallet className="h-8 w-8 text-blue-500" />
              <span className="ml-2 text-xl font-semibold">FinanceTracker</span>
              <div className="ml-10 flex space-x-4">
                <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900">Dashboard</Link>
                <Link to="/expenses" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900">Expenses</Link>
                <Link to="/budget" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900">Budget</Link>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => {
                  supabase.auth.signOut();
                  navigate('/');
                }}
                className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/expenses" element={
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Add Expense</h2>
                <ExpenseForm onSubmit={handleExpenseSubmit} categories={categories} />
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">All Expenses</h2>
                <TransactionList expenses={expenses} />
              </div>
            </div>
          } />
          <Route path="/budget" element={
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Budget Management</h2>
              <BudgetList />
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;