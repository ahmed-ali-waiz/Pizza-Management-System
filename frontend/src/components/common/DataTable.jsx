import React from 'react';

const DataTable = ({ columns, data, onSearch, searchPlaceholder }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      {onSearch && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder={searchPlaceholder || "Search..."}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full md:w-80 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-4 py-3 text-sm text-gray-900 dark:text-gray-100 ${col.className || ''}`}
                    >
                      {col.cell ? col.cell(row) : (typeof col.accessor === 'function' ? col.accessor(row) : (col.accessor ? row[col.accessor] : ''))}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
