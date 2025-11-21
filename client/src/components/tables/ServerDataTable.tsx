import React, { useMemo, forwardRef, useImperativeHandle } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type PaginationState,
  type OnChangeFn
} from '@tanstack/react-table'
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { useServerTable } from '@/hooks/useServerTable'

// Extend TanStack Table's ColumnMeta to include custom filterComponent
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    filterComponent?: (column: any) => React.ReactNode
  }
}

export interface ServerDataTableRef {
  setColumnFilters: (filters: ColumnFiltersState) => void
  clearAllFilters: () => void
  refetch: () => void
}

interface ServerDataTableProps<TData> {
  // Required
  endpoint: string
  queryKey: string | string[]
  columns: ColumnDef<TData>[]

  // Optional configuration
  initialPageSize?: number
  initialSorting?: SortingState
  initialColumnVisibility?: VisibilityState
  buildParams?: (
    pagination: PaginationState,
    sorting: SortingState,
    columnFilters: ColumnFiltersState,
    globalFilter: string
  ) => Record<string, any>

  // Optional features
  enableGlobalFilter?: boolean
  enableColumnFilters?: boolean
  enableSorting?: boolean
  enablePagination?: boolean
  showClearFilters?: boolean

  // Optional customization
  emptyMessage?: string
  loadingRows?: number
  rowClassName?: (row: TData) => string
  onRowClick?: (row: TData) => void
  onRowContextMenu?: (e: React.MouseEvent, row: TData) => void

  // Optional toolbar content
  toolbarLeft?: React.ReactNode
  toolbarRight?: React.ReactNode
  toolbarBottom?: React.ReactNode

  // Pagination options
  pageSizeOptions?: number[]

  // Data transformation
  transform?: (data: any) => {
    data: TData[]
    total: number
    pageCount: number
  }

  // Callback when data changes
  onDataChange?: (data: TData[]) => void
}

function ServerDataTableInner<TData>(
  {
    endpoint,
    queryKey,
    columns,
    initialPageSize = 50,
    initialSorting = [],
    initialColumnVisibility = {},
    buildParams,
    enableGlobalFilter = true,
    enableColumnFilters = true,
    enableSorting = true,
    enablePagination = true,
    showClearFilters = true,
    emptyMessage = 'Aucun résultat trouvé',
    loadingRows = 10,
    rowClassName,
    onRowClick,
    onRowContextMenu,
    toolbarLeft,
    toolbarRight,
    toolbarBottom,
    pageSizeOptions = [10, 20, 50, 100, 200],
    transform,
    onDataChange
  }: ServerDataTableProps<TData>,
  ref: React.Ref<ServerDataTableRef>
) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(initialColumnVisibility)

  // Use the server table hook
  const {
    data,
    totalRows,
    pageCount,
    isLoading,
    pagination,
    sorting,
    columnFilters,
    globalFilter,
    setPagination,
    setSorting,
    setColumnFilters,
    setGlobalFilter,
    clearAllFilters,
    refetch
  } = useServerTable({
    endpoint,
    queryKey,
    initialPageSize,
    initialSorting,
    buildParams,
    transform,
    onDataChange
  })

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      pagination
    },
    onSortingChange: setSorting as OnChangeFn<SortingState>,
    onColumnFiltersChange: setColumnFilters as OnChangeFn<ColumnFiltersState>,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination as OnChangeFn<PaginationState>,
    getCoreRowModel: getCoreRowModel(),
    // Server-side mode
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount,
    rowCount: totalRows
  })

  // Expose methods via ref
  useImperativeHandle(
    ref,
    () => ({
      setColumnFilters,
      clearAllFilters,
      refetch
    }),
    [setColumnFilters, clearAllFilters, refetch]
  )

  // Loading skeleton
  if (isLoading && data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-t-lg mb-4"></div>
          {[...Array(loadingRows)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 mb-2 mx-4"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Toolbar */}
      {(enableGlobalFilter || toolbarLeft || toolbarRight || showClearFilters) && (
        <div className="border-b border-gray-200">
          <div className="p-4">
            {/* Desktop: tout sur une ligne */}
            <div className="hidden sm:flex items-center gap-3">
              {toolbarLeft}

              {enableGlobalFilter && (
                <>
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    name="search"
                    autoComplete="off"
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(String(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Recherche globale..."
                  />
                </>
              )}

              <span className="text-sm text-gray-500 whitespace-nowrap">{totalRows} résultat(s)</span>

              {toolbarRight}

              {showClearFilters && (columnFilters.length > 0 || globalFilter) && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200 whitespace-nowrap"
                  title="Effacer tous les filtres"
                >
                  Effacer tous les filtres
                </button>
              )}
            </div>

            {/* Mobile: deux lignes */}
            <div className="sm:hidden space-y-3">
              {enableGlobalFilter && (
                <div className="flex items-center gap-2">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    name="search"
                    autoComplete="off"
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(String(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Recherche globale..."
                  />
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                {toolbarLeft}
                <span className="text-sm text-gray-500">{totalRows} résultat(s)</span>
                {toolbarRight}
                {showClearFilters && (columnFilters.length > 0 || globalFilter) && (
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200 whitespace-nowrap"
                    title="Effacer tous les filtres"
                  >
                    Effacer tous les filtres
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional toolbar bottom content */}
      {toolbarBottom && <div className="border-b border-gray-200">{toolbarBottom}</div>}

      {/* Table */}
      <div className="overflow-x-auto" style={{ minHeight: '400px' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      header.column.getFilterValue() ? 'bg-blue-50 border-l-2 border-l-blue-300' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        {header.isPlaceholder ? null : (
                          <>
                            <div
                              className={`${
                                enableSorting && header.column.getCanSort()
                                  ? 'cursor-pointer select-none hover:text-gray-700'
                                  : ''
                              } flex items-center`}
                              onClick={
                                enableSorting && header.column.getCanSort()
                                  ? header.column.getToggleSortingHandler()
                                  : undefined
                              }
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {enableSorting && header.column.getCanSort() && (
                                <span className="ml-1">
                                  {header.column.getIsSorted() === 'asc' ? (
                                    <ChevronUpIcon className="h-4 w-4" />
                                  ) : header.column.getIsSorted() === 'desc' ? (
                                    <ChevronDownIcon className="h-4 w-4" />
                                  ) : (
                                    <div className="h-4 w-4 opacity-0 group-hover:opacity-100">
                                      <ChevronUpIcon className="h-4 w-4" />
                                    </div>
                                  )}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      {enableColumnFilters &&
                        header.column.getCanFilter() &&
                        header.column.columnDef.meta?.filterComponent && (
                          <div>{header.column.columnDef.meta.filterComponent(header.column)}</div>
                        )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={table.getHeaderGroups()[0]?.headers.length || 1}
                  className="px-6 py-16 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center">
                    <svg
                      className="h-12 w-12 text-gray-400 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-sm font-medium text-gray-900 mb-1">{emptyMessage}</p>
                    <p className="text-sm text-gray-500">Essayez de modifier vos critères de filtrage</p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''} ${
                    rowClassName ? rowClassName(row.original) : ''
                  }`}
                  onClick={() => onRowClick?.(row.original)}
                  onContextMenu={(e) => onRowContextMenu?.(e, row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`px-6 py-4 whitespace-nowrap ${
                        cell.column.getFilterValue() ? 'bg-blue-50/70' : ''
                      }`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {enablePagination && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center justify-center sm:justify-start text-xs sm:text-sm text-gray-700">
              <span>
                Page {pagination.pageIndex + 1} sur {pageCount} • {totalRows} résultat(s)
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2">
              <select
                value={pagination.pageSize}
                onChange={(e) => {
                  setPagination({
                    pageIndex: 0,
                    pageSize: Number(e.target.value)
                  })
                }}
                className="w-full sm:w-auto border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} par page
                  </option>
                ))}
              </select>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setPagination({ ...pagination, pageIndex: 0 })}
                  disabled={pagination.pageIndex === 0}
                  className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-xs sm:text-sm"
                  title="Première page"
                >
                  {'<<'}
                </button>

                <button
                  onClick={() => setPagination({ ...pagination, pageIndex: pagination.pageIndex - 1 })}
                  disabled={pagination.pageIndex === 0}
                  className="p-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  title="Page précédente"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>

                <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm">{pagination.pageIndex + 1}</span>

                <button
                  onClick={() => setPagination({ ...pagination, pageIndex: pagination.pageIndex + 1 })}
                  disabled={pagination.pageIndex >= pageCount - 1}
                  className="p-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  title="Page suivante"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setPagination({ ...pagination, pageIndex: pageCount - 1 })}
                  disabled={pagination.pageIndex >= pageCount - 1}
                  className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-xs sm:text-sm"
                  title="Dernière page"
                >
                  {'>>'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const ServerDataTable = forwardRef(ServerDataTableInner) as <TData>(
  props: ServerDataTableProps<TData> & { ref?: React.Ref<ServerDataTableRef> }
) => ReturnType<typeof ServerDataTableInner>
