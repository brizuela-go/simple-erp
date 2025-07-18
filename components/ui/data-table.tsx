"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/** Hook for responsive design */
function useIsMdDown() {
  const [isMdDown, setIsMdDown] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 767px)");
    const handler = () => setIsMdDown(mql.matches);
    handler();
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return isMdDown;
}

/** Creative card renderer for mobile */
function DataRowCard({ columns, row }: { columns: any[]; row: any }) {
  // Identify action ("...") column
  const actionColumn = columns.find(
    (col) => col.id === "actions" || col.accessorKey === "actions"
  );
  const actionCell = row
    .getVisibleCells()
    .find(
      (cell: any) =>
        cell.column.id === (actionColumn?.id || actionColumn?.accessorKey)
    );
  // The rest
  const dataColumns = columns.filter((col) => col !== actionColumn);

  return (
    <div className="group relative rounded-xl border glass p-5 my-4 shadow-sm bg-card/70 transition">
      {/* Top-right actions */}
      {actionCell && (
        <div className="absolute right-3 top-3 z-10">
          {flexRender(
            actionCell.column.columnDef.cell,
            actionCell.getContext()
          )}
        </div>
      )}

      {/* Data grid */}
      <dl className="flex flex-col  gap-y-3 gap-x-8">
        {dataColumns.map((col) => {
          const cell = row
            .getVisibleCells()
            .find(
              (cell: any) => cell.column.id === (col.id || col.accessorKey)
            );
          if (!cell) return null;
          return (
            <>
              <dt
                key={"label-" + (col.id || col.accessorKey)}
                className="col-span-1 text-xs font-semibold text-muted-foreground"
              >
                {col.header &&
                  (typeof col.header === "function"
                    ? col.header({ column: col })
                    : col.header)}
              </dt>
              <dd
                key={"value-" + (col.id || col.accessorKey)}
                className="col-span-1 flex items-center font-medium text-base break-words"
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </dd>
            </>
          );
        })}
      </dl>
    </div>
  );
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const isMdDown = useIsMdDown();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  // ---- MOBILE: CARDS ----
  if (isMdDown) {
    return (
      <div>
        {table.getRowModel().rows?.length ? (
          table
            .getRowModel()
            .rows.map((row) => (
              <DataRowCard columns={columns} row={row} key={row.id} />
            ))
        ) : (
          <div className="rounded-lg border p-8 text-center glass">
            No se encontraron resultados.
          </div>
        )}
        <div className="flex flex-col gap-2 mt-2 md:hidden">
          <p className="text-sm text-muted-foreground text-center">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---- DESKTOP: TABLE ----
  return (
    <div className="space-y-4">
      <div className="rounded-md border glass overflow-x-auto">
        <Table className="min-w-[700px] w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Página {table.getState().pagination.pageIndex + 1} de{" "}
          {table.getPageCount()}
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
