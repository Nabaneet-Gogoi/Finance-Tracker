import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PlusCircle, X } from 'lucide-react';
import { format } from 'date-fns';

interface ExpenseFormProps {
  categories: Array<{
    id: string;
    name: string;
  }>;
  onSubmit: (data: ExpenseFormData) => void;
  recentDescriptions?: string[]; // Optional prop for autocomplete suggestions
}

interface ExpenseFormData {
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

// Common expense descriptions for autocomplete
const DEFAULT_DESCRIPTIONS = [
  'Groceries',
  'Lunch',
  'Dinner',
  'Coffee',
  'Gas',
  'Transportation',
  'Shopping',
  'Entertainment'
];

export function ExpenseForm({ categories, onSubmit, recentDescriptions = [] }: ExpenseFormProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ExpenseFormData>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: 'Credit Card' // Most common payment method as default
    }
  });

  const descriptions = [...new Set([...recentDescriptions, ...DEFAULT_DESCRIPTIONS])];
  const filteredDescriptions = descriptions.filter(desc => 
    desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDescriptionSelect = (description: string) => {
    setValue('description', description);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Add keyboard shortcuts
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit(onSubmitForm)();
    }
  };

  const onSubmitForm = async (data: ExpenseFormData) => {
    try {
      await onSubmit(data);
      reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: watch('payment_method') // Preserve last used payment method
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4" onKeyDown={handleKeyDown}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Amount Field */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Amount
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              id="amount"
              {...register('amount', { 
                required: 'Amount is required', 
                min: { value: 0, message: 'Amount must be positive' },
                validate: {
                  validDecimal: value => 
                    /^\d+(\.\d{0,2})?$/.test(value.toString()) || 
                    'Amount can only have up to 2 decimal places'
                }
              })}
              className="block w-full pl-7 pr-12 sm:text-sm border-2 border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              placeholder="0.00"
              autoFocus
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount.message}</p>
          )}
        </div>

        {/* Date Field */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Date
          </label>
          <input
            type="date"
            id="date"
            {...register('date', { required: 'Date is required' })}
            className="mt-1 block w-full sm:text-sm border-2 border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date.message}</p>
          )}
        </div>
      </div>

      {/* Description Field with Autocomplete */}
      <div className="relative">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <div className="relative group">
          <input
            type="text"
            id="description"
            {...register('description', { required: 'Description is required' })}
            className="block w-full sm:text-sm border-2 border-gray-300 dark:border-gray-600 rounded-md 
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                     dark:bg-gray-700 dark:text-white 
                     hover:border-gray-400 dark:hover:border-gray-500 
                     transition-colors
                     py-2.5 px-4 bg-white dark:bg-gray-700
                     shadow-sm hover:shadow-md transition-shadow"
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="What did you spend on?"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-gray-400 group-hover:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
        </div>
        {showSuggestions && searchTerm && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-md shadow-lg max-h-60 overflow-auto border-2 border-gray-200 dark:border-gray-600">
            {filteredDescriptions.map((desc, index) => (
              <div
                key={index}
                className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-600 cursor-pointer text-gray-900 dark:text-gray-100 transition-colors"
                onClick={() => handleDescriptionSelect(desc)}
              >
                {desc}
              </div>
            ))}
          </div>
        )}
        {errors.description && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Field */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category
          </label>
          <select
            id="category"
            {...register('category_id', { required: 'Category is required' })}
            className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-2 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.category_id && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category_id.message}</p>
          )}
        </div>

        {/* Payment Method Field */}
        <div>
          <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Payment Method
          </label>
          <select
            id="payment_method"
            {...register('payment_method', { required: 'Payment method is required' })}
            className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-2 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            <option value="">Select payment method</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
          {errors.payment_method && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.payment_method.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Press Ctrl + Enter to submit
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Adding...' : 'Add Expense'}
          </button>
        </div>
      </div>
    </form>
  );
}