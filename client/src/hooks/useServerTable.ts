import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { SortingState, ColumnFiltersState, PaginationState } from '@tanstack/react-table'
import api from '@/utils/api'

interface UseServerTableOptions<TData = any> {
  endpoint: string
  queryKey: string | string[]
  initialPageSize?: number
  initialSorting?: SortingState
  buildParams?: (
    pagination: PaginationState,
    sorting: SortingState,
    columnFilters: ColumnFiltersState,
    globalFilter: string
  ) => Record<string, any>
  enabled?: boolean
  debounceMs?: number
  transform?: (data: any) => {
    data: TData[]
    total: number
    pageCount: number
  }
  onDataChange?: (data: TData[]) => void
}

interface UseServerTableReturn<TData = any> {
  data: TData[]
  totalRows: number
  pageCount: number
  isLoading: boolean
  pagination: PaginationState
  sorting: SortingState
  columnFilters: ColumnFiltersState
  globalFilter: string
  setPagination: (pagination: PaginationState | ((prev: PaginationState) => PaginationState)) => void
  setSorting: (sorting: SortingState | ((prev: SortingState) => SortingState)) => void
  setColumnFilters: (filters: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => void
  setGlobalFilter: (filter: string) => void
  clearAllFilters: () => void
  refetch: () => void
}

// Default params builder - can be overridden
const defaultBuildParams = (
  pagination: PaginationState,
  sorting: SortingState,
  columnFilters: ColumnFiltersState,
  globalFilter: string
): Record<string, any> => {
  const params: Record<string, any> = {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize
  }

  // Global search
  if (globalFilter) {
    params.search = globalFilter
  }

  // Sorting
  if (sorting.length > 0) {
    const sort = sorting[0]
    params.sortBy = sort.id
    params.sortOrder = sort.desc ? 'desc' : 'asc'
  }

  // Column filters - pass each filter as-is to the backend
  columnFilters.forEach((filter) => {
    const { id, value } = filter

    if (value === undefined || value === null) return

    // Handle date range filters
    if (typeof value === 'object' && !Array.isArray(value) && 'from' in value) {
      const dateRange = value as { from?: string; to?: string }
      if (dateRange.from) params[`${id}Debut`] = dateRange.from
      if (dateRange.to) params[`${id}Fin`] = dateRange.to
    }
    // Handle multi-select (array) filters
    else if (Array.isArray(value)) {
      params[id] = value
    }
    // Handle simple filters
    else {
      params[id] = value
    }
  })

  return params
}

export function useServerTable<TData = any>({
  endpoint,
  queryKey,
  initialPageSize = 50,
  initialSorting = [],
  buildParams = defaultBuildParams,
  enabled = true,
  debounceMs = 500,
  transform,
  onDataChange
}: UseServerTableOptions<TData>): UseServerTableReturn<TData> {
  // Server-side state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize
  })
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  // Debounced global filter for API calls
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('')

  // Debounce global filter to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter)
      // Reset to first page when search changes
      if (globalFilter !== debouncedGlobalFilter) {
        setPagination((prev) => ({ ...prev, pageIndex: 0 }))
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [globalFilter, debounceMs, debouncedGlobalFilter])

  // Normalize queryKey to array
  const normalizedQueryKey = Array.isArray(queryKey) ? queryKey : [queryKey]

  // Fetch data with server-side pagination, sorting, and filtering
  const { data: apiData, isLoading, refetch } = useQuery({
    queryKey: [...normalizedQueryKey, pagination, sorting, columnFilters, debouncedGlobalFilter],
    queryFn: async () => {
      const params = buildParams(pagination, sorting, columnFilters, debouncedGlobalFilter)
      const response = await api.get(endpoint, { params })
      return response.data
    },
    enabled,
    placeholderData: (previousData) => previousData
  })

  // Transform the data using custom transform or default structure
  const transformedData = transform
    ? transform(apiData)
    : {
        data: apiData?.data || apiData?.demandes || apiData?.dossiers || apiData?.decisions || apiData?.conventions || apiData?.paiements || [],
        total: apiData?.total || 0,
        pageCount: apiData?.pagination?.pages || apiData?.pageCount || 0
      }

  const clearAllFilters = () => {
    setColumnFilters([])
    setGlobalFilter('')
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  // Call onDataChange when data changes
  useEffect(() => {
    if (onDataChange && transformedData.data) {
      onDataChange(transformedData.data)
    }
  }, [transformedData.data, onDataChange])

  return {
    data: transformedData.data,
    totalRows: transformedData.total,
    pageCount: transformedData.pageCount,
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
  }
}
