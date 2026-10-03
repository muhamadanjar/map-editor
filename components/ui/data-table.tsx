"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "cn"

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageSize?: number
  emptyMessage?: React.ReactNode
  className?: string
  getRowId?: (originalRow: TData, index: number) => string
}

function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 10,
  emptyMessage = "No results.",
  className,
  getRowId,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
    getRowId,
  })
  const pageCount = table.getPageCount()

  return (
    <div className={cn("space-y-3", className)}>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sortDirection = header.column.getIsSorted()

                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className="inline-flex min-h-8 items-center gap-2 rounded-sm text-left font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={header.column.getToggleSortingHandler()}
                          aria-label={`Sort by ${header.column.id}`}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortDirection === "asc" ? (
                            <ArrowUpIcon className="size-3.5" aria-hidden="true" />
                          ) : sortDirection === "desc" ? (
                            <ArrowDownIcon className="size-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowUpDownIcon className="size-3.5 opacity-50" aria-hidden="true" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span className="font-mono text-xs">
          Page {pageCount === 0 ? 0 : table.getState().pagination.pageIndex + 1} of {pageCount}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

export { DataTable }
export type { DataTableProps }
