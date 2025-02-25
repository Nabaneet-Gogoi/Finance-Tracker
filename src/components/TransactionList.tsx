import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Receipt, Tag, Edit2, Trash2, X, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  category_id: string;
  payment_method: string;
  category: {
    name: string;
  };
}

interface TransactionListProps {
  expenses: Transaction[];
  onUpdate?: () => void;
  categories: Array<{ id: string; name: string; }>;
}

interface EditExpenseData {
  amount: number;
  description: string;
  category_id: string;
  payment_method: string;
  date: string;
}

const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Digital Wallet',
  'Bank Transfer'
];

export function TransactionList({ expenses, onUpdate, categories }: TransactionListProps) {
  const [editingExpense, setEditingExpense] = useState<Transaction | null>(null);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [editFormData, setEditFormData] = useState<EditExpenseData>({
    amount: 0,
    description: '',
    category_id: '',
    payment_method: '',
    date: ''
  });

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedExpenses(new Set());
  };

  const toggleExpenseSelection = (id: string) => {
    const newSelected = new Set(selectedExpenses);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedExpenses(newSelected);
  };

  const selectAllInGroup = (dateExpenses: Transaction[]) => {
    const newSelected = new Set(selectedExpenses);
    dateExpenses.forEach(expense => {
      newSelected.add(expense.id);
    });
    setSelectedExpenses(newSelected);
  };

  const deselectAllInGroup = (dateExpenses: Transaction[]) => {
    const newSelected = new Set(selectedExpenses);
    dateExpenses.forEach(expense => {
      newSelected.delete(expense.id);
    });
    setSelectedExpenses(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedExpenses.size === 0) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedExpenses.size} expense${selectedExpenses.size > 1 ? 's' : ''}?`)) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .in('id', Array.from(selectedExpenses));

      if (error) throw error;
      setSelectedExpenses(new Set());
      setIsSelectionMode(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting expenses:', error);
      alert('Failed to delete expenses. Please try again.');
    }
  };

  const handleEdit = (expense: Transaction) => {
    setEditingExpense(expense);
    setEditFormData({
      amount: expense.amount,
      description: expense.description,
      category_id: expense.category_id,
      payment_method: expense.payment_method,
      date: expense.date
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          amount: editFormData.amount,
          description: editFormData.description,
          category_id: editFormData.category_id,
          payment_method: editFormData.payment_method,
          date: editFormData.date
        })
        .eq('id', editingExpense.id);

      if (error) throw error;
      setEditingExpense(null);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Failed to update expense. Please try again.');
    }
  };

  // Group transactions by date
  const groupedExpenses = expenses.reduce((groups, expense) => {
    const date = format(parseISO(expense.date), 'MMM d, yyyy');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(expense);
    return groups;
  }, {} as Record<string, Transaction[]>);

  // Calculate total amount
  const totalAmount = expenses.reduce((acc, expense) => acc + expense.amount, 0);

  return (
    <div className="space-y-8">
      {expenses.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No transactions</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding a new expense.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <button
              onClick={toggleSelectionMode}
              className="flex items-center px-4 py-2 text-sm font-medium rounded-md
                       border-2 border-gray-300 dark:border-gray-600
                       text-gray-700 dark:text-gray-300
                       hover:bg-gray-50 dark:hover:bg-gray-700
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                       transition-colors"
            >
              {isSelectionMode ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel Selection
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Select Multiple
                </>
              )}
            </button>
            {isSelectionMode && selectedExpenses.size > 0 && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedExpenses.size} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center px-4 py-2 text-sm font-medium rounded-md
                           bg-red-600 hover:bg-red-700 
                           dark:bg-red-500 dark:hover:bg-red-600
                           text-white
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
                           transition-colors"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Delete Selected
                </button>
              </div>
            )}
          </div>

          {Object.entries(groupedExpenses).map(([date, dateExpenses]) => (
            <div key={date} className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{date}</h3>
                {isSelectionMode && (
                  <button
                    onClick={() => {
                      const allSelected = dateExpenses.every(exp => selectedExpenses.has(exp.id));
                      if (allSelected) {
                        deselectAllInGroup(dateExpenses);
                      } else {
                        selectAllInGroup(dateExpenses);
                      }
                    }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    {dateExpenses.every(exp => selectedExpenses.has(exp.id)) ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700">
                {dateExpenses.map((expense) => (
                  <div key={expense.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                    {editingExpense?.id === expense.id ? (
                      <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="flex justify-between">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">Edit Expense</h4>
                          <button
                            type="button"
                            onClick={() => setEditingExpense(null)}
                            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
                              </div>
                              <input
                                type="number"
                                step="0.01"
                                required
                                value={editFormData.amount}
                                onChange={(e) => setEditFormData({ ...editFormData, amount: parseFloat(e.target.value) })}
                                className="block w-full pl-7 pr-12 sm:text-sm border-2 border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                                placeholder="0.00"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                            <input
                              type="date"
                              required
                              value={editFormData.date}
                              onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                              className="mt-1 block w-full sm:text-sm border-2 border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                            />
                          </div>
                        </div>

                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                          <div className="relative group">
                            <input
                              type="text"
                              required
                              value={editFormData.description}
                              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                              className="block w-full sm:text-sm border-2 border-gray-300 dark:border-gray-600 rounded-md 
                                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                       dark:bg-gray-700 dark:text-white 
                                       hover:border-gray-400 dark:hover:border-gray-500 
                                       transition-colors
                                       py-2.5 px-4 bg-white dark:bg-gray-700
                                       shadow-sm hover:shadow-md transition-shadow"
                              placeholder="What did you spend on?"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                            <select
                              required
                              value={editFormData.category_id}
                              onChange={(e) => setEditFormData({ ...editFormData, category_id: e.target.value })}
                              className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-2 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                            >
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
                            <select
                              required
                              value={editFormData.payment_method}
                              onChange={(e) => setEditFormData({ ...editFormData, payment_method: e.target.value })}
                              className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-2 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                            >
                              {PAYMENT_METHODS.map((method) => (
                                <option key={method} value={method}>
                                  {method}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                          <button
                            type="button"
                            onClick={() => setEditingExpense(null)}
                            className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Save Changes
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-start justify-between">
                        {isSelectionMode && (
                          <div className="flex-shrink-0 mr-4">
                            <button
                              onClick={() => toggleExpenseSelection(expense.id)}
                              className="text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400"
                            >
                              {selectedExpenses.has(expense.id) ? (
                                <CheckSquare className="h-5 w-5" />
                              ) : (
                                <Square className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {expense.description}
                          </p>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <Receipt className="flex-shrink-0 mr-1.5 h-4 w-4" />
                              <p>{expense.payment_method}</p>
                            </div>
                            <div className="flex items-center">
                              <Tag className="flex-shrink-0 mr-1.5 h-4 w-4" />
                              <p>{expense.category?.name || 'Uncategorized'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex items-center space-x-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            expense.amount >= 100 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            ${expense.amount.toFixed(2)}
                          </span>
                          {!isSelectionMode && (
                            <>
                              <button
                                onClick={() => handleEdit(expense)}
                                className="text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400"
                              >
                                <Edit2 className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(expense.id)}
                                className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="text-right font-semibold text-gray-900 dark:text-white">
            Total: ${totalAmount.toFixed(2)}
          </div>
        </>
      )}
    </div>
  );
}