import React, { useState } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { FileText, Download, Calendar } from 'lucide-react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';

interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  category: {
    name: string;
  };
  payment_method: string;
}

interface Category {
  id: string;
  name: string;
}

interface ReportsProps {
  expenses: Expense[];
  categories: Category[];
}

export function Reports({ expenses, categories }: ReportsProps) {
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = parseISO(expense.date);
    return expenseDate >= parseISO(dateRange.start) && expenseDate <= parseISO(dateRange.end);
  });

  // Calculate summary statistics
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryTotals = filteredExpenses.reduce((acc, expense) => {
    const categoryName = expense.category.name;
    acc[categoryName] = (acc[categoryName] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const exportToCSV = () => {
    const data = filteredExpenses.map(expense => ({
      Date: format(parseISO(expense.date), 'MM/dd/yyyy'),
      Description: expense.description,
      Amount: expense.amount.toFixed(2),
      Category: expense.category.name,
      'Payment Method': expense.payment_method
    }));

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.text('Expense Report', pageWidth / 2, 20, { align: 'center' });
    
    // Date Range
    doc.setFontSize(12);
    doc.text(`Date Range: ${format(parseISO(dateRange.start), 'MM/dd/yyyy')} - ${format(parseISO(dateRange.end), 'MM/dd/yyyy')}`, 20, 30);
    
    // Summary
    doc.setFontSize(14);
    doc.text('Summary', 20, 40);
    doc.setFontSize(12);
    doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`, 20, 50);
    
    // Category Breakdown
    let yPos = 60;
    doc.text('Category Breakdown:', 20, yPos);
    yPos += 10;
    Object.entries(categoryTotals).forEach(([category, amount]) => {
      doc.text(`${category}: $${amount.toFixed(2)}`, 30, yPos);
      yPos += 10;
    });
    
    // Expenses Table
    yPos += 10;
    doc.text('Detailed Expenses:', 20, yPos);
    yPos += 10;
    
    // Table headers
    const headers = ['Date', 'Description', 'Amount', 'Category'];
    const columnWidths = [30, 70, 30, 50];
    let xPos = 20;
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos);
      xPos += columnWidths[i];
    });
    
    // Table rows
    yPos += 10;
    filteredExpenses.forEach(expense => {
      if (yPos > 270) { // Check if we need a new page
        doc.addPage();
        yPos = 20;
      }
      
      xPos = 20;
      doc.text(format(parseISO(expense.date), 'MM/dd/yyyy'), xPos, yPos);
      xPos += columnWidths[0];
      
      // Truncate description if too long
      const description = expense.description.length > 30 
        ? expense.description.substring(0, 27) + '...'
        : expense.description;
      doc.text(description, xPos, yPos);
      xPos += columnWidths[1];
      
      doc.text(`$${expense.amount.toFixed(2)}`, xPos, yPos);
      xPos += columnWidths[2];
      
      doc.text(expense.category.name, xPos, yPos);
      
      yPos += 10;
    });
    
    doc.save(`expense_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reports & Exports</h2>
          <div className="flex space-x-2">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={exportToPDF}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Date Range Selector */}
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              />
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Summary</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                  ${totalExpenses.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Number of Transactions</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                  {filteredExpenses.length}
                </p>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Category Breakdown</h3>
            <div className="space-y-4">
              {Object.entries(categoryTotals)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">{category}</span>
                    <span className="text-gray-900 dark:text-white font-medium">${amount.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Detailed Expenses */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Detailed Expenses</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {format(parseISO(expense.date), 'MM/dd/yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {expense.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {expense.category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ${expense.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 