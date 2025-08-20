import React, { useEffect, useState, useMemo } from 'react';
import ClassForm from '../components/forms/ClassForm';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllClasses, deleteClass } from '../features/classes/classSlice';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  filterFns,
} from '@tanstack/react-table';
import { Edit, Trash2 } from 'lucide-react';

function Classes() {
  const dispatch = useDispatch();
  const classList = useSelector((state) => state.class?.classList || []);
  const [isOpen, setIsOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null); // store edit data
  const [globalFilter, setGlobalFilter] = useState('');

  useEffect(() => {
    dispatch(fetchAllClasses());
  }, [dispatch, isOpen]);

  // Define columns for table
   const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Class Name',
      },
      {
        accessorKey: 'section',
        header: 'Section',
      },
      {
        accessorKey: 'subjects',
        header: 'Subjects',
        cell: (info) => (
          <div className="flex flex-wrap gap-1">
            {info.getValue()?.map((sub, idx) => (
              <span
                key={sub._id || idx}
                className="px-2 py-1 text-xs bg-gray-200 rounded-md"
              >
                {sub.name}
              </span>
            ))}
          </div>
        ),
      },
      {
        accessorKey: 'teacherId',
        header: 'Teacher',
        cell: (info) => {
          const teacher = info.row.original.teacherId;
          return (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">
              {teacher?.name || "—"}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(row.original)}
              className="text-blue-600 hover:text-blue-800"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => handleDelete(row.original._id)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ),
      },
    ],
    
  );


  // Setup table
  const table = useReactTable({
    data: classList,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: filterFns.includesString,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5, // show 5 rows per page
      },
    },
  });

  // Handlers
  const handleEdit = (cls) => {
    setEditingClass(cls);
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    console.log(id)
    await dispatch(deleteClass(id));
    await dispatch(fetchAllClasses());
  };

  const handleAddNew = () => {
    setEditingClass(null); // new form, not editing
    setIsOpen(true);
  };

  return (
    <>
      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
            <ClassForm
              onClose={() => setIsOpen(false)}
              initialData={editingClass} // pass data if editing
            />
          </div>
        </div>
      )}

      <div className="w-full bg-white p-4 border rounded-lg">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h4 className="text-xl font-bold">Class List</h4>
          <button
            onClick={handleAddNew}
            className="px-3 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700"
          >
            Add New Class
          </button>
        </div>

        {/* Search */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="Search..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full md:w-1/3 px-3 py-2 border rounded-lg text-xs"
          />
        </div>

        {/* Data Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="p-2 border cursor-pointer select-none"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: ' 🔼',
                        desc: ' 🔽',
                      }[header.column.getIsSorted()] ?? null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="border p-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}

export default Classes;
