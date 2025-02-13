import React from 'react';
import { useForm } from 'react-hook-form';
import { PlusCircle } from 'lucide-react';

interface ExpenseFormProps {
  categories: Array<{
    id: string;
    name: string;
  }>;
  onSubmit: (data: ExpenseFormData) => void;
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

export function ExpenseForm({ categories, onSubmit }: ExpenseFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ExpenseFormData>();

  const onSubmitForm = async (data: ExpenseFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
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
            {...register('amount', { required: 'Amount is required', min: 0 })}
            className="block w-full pl-7 pr-12 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="0.00"
          />
        </div>
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <input
          type="text"
          id="description"
          {...register('description', { required: 'Description is required' })}
          className="mt-1 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Category
        </label>
        <select
          id="category"
          {...register('category_id', { required: 'Category is required' })}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
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

      <div>
        <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Payment Method
        </label>
        <select
          id="payment_method"
          {...register('payment_method', { required: 'Payment method is required' })}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
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

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Date
        </label>
        <input
          type="date"
          id="date"
          {...register('date', { required: 'Date is required' })}
          className="mt-1 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
        {errors.date && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <PlusCircle className="w-4 h-4 mr-2" />
        {isSubmitting ? 'Adding...' : 'Add Expense'}
      </button>
    </form>
  );
}