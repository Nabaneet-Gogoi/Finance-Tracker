import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface RawExpenseData {
  amount: number;
  date: string;
  categories: {
    name: string;
  } | null;
}

interface Expense {
  amount: number;
  date: string;
  categories: {
    name: string;
  };
}

interface CategoryTotal {
  name: string;
  value: number;
  fill: string;
}

const CATEGORY_COLORS = {
  'Food & Dining': '#E63946',     // Dark red
  'Transportation': '#1D3557',    // Dark blue
  'Shopping': '#2A9D8F',         // Dark teal
  'Entertainment': '#6A4C93',    // Dark purple
  'Bills & Utilities': '#F4A261', // Dark orange
  'Health': '#9B2226',          // Deep red
  'Education': '#023E8A',        // Navy blue
  'Other': '#264653',           // Dark slate
  'default': '#495057'          // Dark gray
};

export function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSpent, setTotalSpent] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [dailyTotals, setDailyTotals] = useState<{ date: string; amount: number }[]>([]);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('No user found');

      const startDate = startOfMonth(new Date());
      const endDate = endOfMonth(new Date());

      const { data, error } = await supabase
        .from('expenses')
        .select('amount, date, categories(name)')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString()) as { data: RawExpenseData[] | null; error: any };

      if (error) throw error;

      const formattedExpenses: Expense[] = (data || []).map(item => ({
        amount: Number(item.amount),
        date: item.date,
        categories: {
          name: item.categories?.name || 'Uncategorized'
        }
      }));

      setExpenses(formattedExpenses);
      calculateStats(formattedExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (expensesData: Expense[]) => {
    // Calculate total spent
    const total = expensesData.reduce((sum, expense) => sum + expense.amount, 0);
    setTotalSpent(total);

    // Calculate category totals
    const categoryMap = new Map<string, number>();
    expensesData.forEach(expense => {
      const categoryName = expense.categories.name;
      categoryMap.set(
        categoryName,
        (categoryMap.get(categoryName) || 0) + expense.amount
      );
    });
    
    const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
      fill: CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.default
    }));
    setCategoryTotals(categoryData);

    // Calculate daily totals
    const dailyMap = new Map<string, number>();
    const dateRange = eachDayOfInterval({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date())
    });

    dateRange.forEach(date => {
      dailyMap.set(format(date, 'yyyy-MM-dd'), 0);
    });

    expensesData.forEach(expense => {
      const date = format(parseISO(expense.date), 'yyyy-MM-dd');
      dailyMap.set(date, (dailyMap.get(date) || 0) + expense.amount);
    });

    const dailyData = Array.from(dailyMap.entries()).map(([date, amount]) => ({
      date: format(parseISO(date), 'MMM dd'),
      amount
    }));
    setDailyTotals(dailyData);
  };

  if (loading) return <div className="text-center py-4 text-gray-700 dark:text-gray-300">Loading dashboard...</div>;
  if (error) return <div className="text-red-600 dark:text-red-400">{error}</div>;

  return (
    <div className="space-y-6 [--tooltip-bg:theme(colors.white)] [--tooltip-color:theme(colors.gray.900)] dark:[--tooltip-bg:theme(colors.gray.800)] dark:[--tooltip-color:theme(colors.white)]">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Spent</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ${totalSpent.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Most Spent On</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {categoryTotals[0]?.name || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded">
              <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Daily Average</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ${(totalSpent / dailyTotals.length).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spending Trend */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Spending Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTotals}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--tooltip-bg, #fff)',
                    border: 'none',
                    borderRadius: '0.375rem',
                    color: 'var(--tooltip-color, #000)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ color: 'inherit' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3B82F6"
                  name="Spending"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Category Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryTotals}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#3B82F6"
                  label
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--tooltip-bg, #fff)',
                    border: 'none',
                    borderRadius: '0.375rem',
                    color: 'var(--tooltip-color, #000)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ color: 'inherit' }}
                />
                <Legend formatter={(value) => <span className="text-gray-900 dark:text-gray-100">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}