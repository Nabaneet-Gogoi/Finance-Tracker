import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PlusCircle, Edit2, Trash2, AlertCircle } from 'lucide-react';

interface Budget {
  id: string;
  name: string;
  amount: number;
  category_id: string;
  user_id: string;
  period: 'monthly' | 'yearly';
}

interface Category {
  id: string;
  name: string;
}

interface BudgetWithSpending extends Budget {
  spent: number;
  category: Category;
  percentage: number;
}

export function BudgetList() {
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  
  // Form states
  const [newBudget, setNewBudget] = useState({
    name: '',
    amount: '',
    category_id: '',
    period: 'monthly'
  });

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    }
  };

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('No user found');

      // Fetch budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*, categories(id, name)')
        .eq('user_id', user.id);

      if (budgetsError) throw budgetsError;

      // Calculate spending for each budget
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

      const budgetsWithSpending = await Promise.all(
        (budgetsData || []).map(async (budget) => {
          const { data: expenses, error: expensesError } = await supabase
            .from('expenses')
            .select('amount')
            .eq('category_id', budget.category_id)
            .eq('user_id', user.id)
            .gte('date', budget.period === 'monthly' ? startOfMonth : startOfYear);

          if (expensesError) throw expensesError;

          const spent = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
          const percentage = (spent / budget.amount) * 100;

          return {
            ...budget,
            spent,
            percentage,
            category: budget.categories
          };
        })
      );

      setBudgets(budgetsWithSpending);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      setError('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('No user found');

      // Log the data being sent
      const budgetData = {
        name: newBudget.name.trim(),
        amount: parseFloat(newBudget.amount),
        category_id: newBudget.category_id,
        period: newBudget.period,
        user_id: user.id
      };
      
      console.log('Sending budget data:', budgetData);

      const { error } = await supabase
        .from('budgets')
        .insert([budgetData]);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to add budget: ${error.message}`);
      }

      setNewBudget({ name: '', amount: '', category_id: '', period: 'monthly' });
      setIsAddingBudget(false);
      fetchBudgets();
    } catch (error) {
      console.error('Error details:', error);
      setError(error instanceof Error ? error.message : 'Failed to add budget');
    }
  };

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .update({
          name: editingBudget.name,
          amount: editingBudget.amount,
          category_id: editingBudget.category_id,
          period: editingBudget.period
        })
        .eq('id', editingBudget.id);

      if (error) throw error;

      setEditingBudget(null);
      fetchBudgets();
    } catch (error) {
      console.error('Error updating budget:', error);
      setError('Failed to update budget');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
      setError('Failed to delete budget');
    }
  };

  if (loading) return <div className="text-center py-4 text-gray-700 dark:text-gray-300">Loading budgets...</div>;
  if (error) return (
    <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-md p-4 flex items-center">
      <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
      <span className="text-red-700 dark:text-red-300">{error}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Add Budget Button */}
      {!isAddingBudget && !editingBudget && (
        <button
          onClick={() => setIsAddingBudget(true)}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Add Budget
        </button>
      )}

      {/* Add Budget Form */}
      {isAddingBudget && (
        <form onSubmit={handleAddBudget} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add New Budget</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <input
              type="text"
              required
              value={newBudget.name}
              onChange={(e) => setNewBudget({ ...newBudget, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={newBudget.amount}
              onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <select
              required
              value={newBudget.category_id}
              onChange={(e) => setNewBudget({ ...newBudget, category_id: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Period</label>
            <select
              required
              value={newBudget.period}
              onChange={(e) => setNewBudget({ ...newBudget, period: e.target.value as 'monthly' | 'yearly' })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAddingBudget(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Add Budget
            </button>
          </div>
        </form>
      )}

      {/* Edit Budget Form */}
      {editingBudget && (
        <form onSubmit={handleUpdateBudget} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Edit Budget</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <input
              type="text"
              required
              value={editingBudget.name}
              onChange={(e) => setEditingBudget({ ...editingBudget, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={editingBudget.amount}
              onChange={(e) => setEditingBudget({ ...editingBudget, amount: parseFloat(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <select
              required
              value={editingBudget.category_id}
              onChange={(e) => setEditingBudget({ ...editingBudget, category_id: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Period</label>
            <select
              required
              value={editingBudget.period}
              onChange={(e) => setEditingBudget({ ...editingBudget, period: e.target.value as 'monthly' | 'yearly' })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setEditingBudget(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Update Budget
            </button>
          </div>
        </form>
      )}

      {/* Budget List */}
      <div className="space-y-4">
        {budgets.map((budget) => (
          <div key={budget.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{budget.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {budget.category.name} • {budget.period}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingBudget(budget)}
                  className="p-1 text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteBudget(budget.id)}
                  className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                <span className="text-gray-900 dark:text-white">
                  ${budget.spent.toFixed(2)} of ${budget.amount.toFixed(2)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    budget.percentage >= 100
                      ? 'bg-red-600 dark:bg-red-500'
                      : budget.percentage >= 80
                      ? 'bg-yellow-400 dark:bg-yellow-500'
                      : 'bg-green-600 dark:bg-green-500'
                  }`}
                  style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                ></div>
              </div>
              {budget.percentage >= 80 && (
                <p className={`text-sm mt-1 ${budget.percentage >= 100 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                  {budget.percentage >= 100
                    ? 'Budget exceeded!'
                    : 'Approaching budget limit'}
                </p>
              )}
            </div>
          </div>
        ))}

        {budgets.length === 0 && !isAddingBudget && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No budgets set up yet. Add your first budget to start tracking!</p>
          </div>
        )}
      </div>
    </div>
  );
} 