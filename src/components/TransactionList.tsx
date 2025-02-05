import React from 'react';
import { format, parseISO } from 'date-fns';
import { Receipt, Tag } from 'lucide-react';

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
  onDelete?: (id: string) => void;
}

export function TransactionList({ expenses, onDelete }: TransactionListProps) {
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
          <Receipt className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new expense.</p>
        </div>
      ) : (
        <>
          {Object.entries(groupedExpenses).map(([date, dateExpenses]) => (
            <div key={date} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">{date}</h3>
              <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
                {dateExpenses.map((expense) => (
                  <div key={expense.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {expense.description}
                        </p>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
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
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          ${expense.amount.toFixed(2)}
                        </span>
                        {onDelete && (
                          <button
                            onClick={() => onDelete(expense.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <span className="sr-only">Delete</span>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="text-right font-semibold text-gray-900">
            Total: ${totalAmount.toFixed(2)}
          </div>
        </>
      )}
    </div>
  );
}