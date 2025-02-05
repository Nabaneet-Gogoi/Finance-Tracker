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
}

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
        .lte('date', endDate.toISOString());

      if (error) throw error;

      const formattedExpenses: Expense[] = (data as RawExpenseData[] || []).map(item => ({
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
      value
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

  if (loading) return <div className="text-center py-4">Loading dashboard...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Spent</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${totalSpent.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Most Spent On</p>
              <p className="text-2xl font-semibold text-gray-900">
                {categoryTotals[0]?.name || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Daily Average</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${(totalSpent / dailyTotals.length).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spending Trend */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Spending Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTotals}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3B82F6"
                  name="Spending"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Category Distribution</h3>
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
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
} 