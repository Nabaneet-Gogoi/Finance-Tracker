import React, { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import { BrowserRouter, Routes as ReactRoutes, Route, Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { PieChart, LineChart, BarChart } from 'recharts';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Wallet, PlusCircle, CreditCard, PieChartIcon, BarChartIcon, LineChartIcon, Receipt, Search, Download, Bell, Menu, X, LogOut, Sun, Moon, FileText } from 'lucide-react';
import { Auth } from './components/Auth';
import { ExpenseForm } from './components/ExpenseForm';
import { BudgetList } from './components/BudgetList';
import { TransactionList } from './components/TransactionList';
import { Dashboard } from './components/Dashboard';
import { Reports } from './components/Reports';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

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

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

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

  const NavLinks = () => (
    <>
      <RouterLink
        to="/"
        className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md"
        onClick={() => setIsMenuOpen(false)}
      >
        Dashboard
      </RouterLink>
      <RouterLink
        to="/expenses"
        className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md"
        onClick={() => setIsMenuOpen(false)}
      >
        Expenses
      </RouterLink>
      <RouterLink
        to="/budget"
        className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md"
        onClick={() => setIsMenuOpen(false)}
      >
        Budget
      </RouterLink>
      <RouterLink
        to="/reports"
        className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md"
        onClick={() => setIsMenuOpen(false)}
      >
        <FileText className="mr-3 h-5 w-5" />
        Reports
      </RouterLink>
    </>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Wallet className="h-8 w-8 text-blue-500" />
              <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">FinanceTracker</span>
            </div>

            <div className="hidden md:flex md:items-center md:space-x-4">
              <NavLinks />
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button
                onClick={() => {
                  supabase.auth.signOut();
                  navigate('/');
                }}
                className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <span className="flex items-center">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </span>
              </button>
            </div>

            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-800 shadow-lg absolute w-full">
            <div className="flex flex-col space-y-2">
              <NavLinks />
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md flex items-center"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="h-5 w-5 mr-2" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="h-5 w-5 mr-2" />
                    Dark Mode
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  supabase.auth.signOut();
                  navigate('/');
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <span className="flex items-center justify-center">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ReactRoutes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/expenses" element={
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add Expense</h2>
                <ExpenseForm onSubmit={handleExpenseSubmit} categories={categories} />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">All Expenses</h2>
                <TransactionList 
                  expenses={expenses} 
                  onUpdate={fetchExpenses}
                  categories={categories}
                />
              </div>
            </div>
          } />
          <Route path="/budget" element={
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Budget Management</h2>
              <BudgetList />
            </div>
          } />
          <Route path="/reports" element={<Reports expenses={expenses} categories={categories} />} />
        </ReactRoutes>
      </main>
    </div>
  );
}

export default App;