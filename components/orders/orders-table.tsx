"use client";

import { SetStateAction, useEffect, useState } from "react";
import { Order, OrderStatus } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "../ui/data-table";
import { subscribeToOrders } from "@/services/orders";

export function OrderTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = subscribeToOrders(
      (updatedOrders: SetStateAction<Order[]>) => {
        setOrders(updatedOrders);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = orders;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  const getStatusBadge = (status: OrderStatus) => {
    const variants = {
      [OrderStatus.ABONO]: "status-abono",
      [OrderStatus.LIQUIDADO]: "status-liquidado",
      [OrderStatus.NO_PAGADO]: "status-no-pagado",
    };

    const labels = {
      [OrderStatus.ABONO]: "Abono",
      [OrderStatus.LIQUIDADO]: "Liquidado",
      [OrderStatus.NO_PAGADO]: "No Pagado",
    };

    return <Badge className={variants[status]}>{labels[status]}</Badge>;
  };

  const columns = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }: any) => (
        <span className="font-mono text-xs">
          {row.original.id?.slice(0, 8)}
        </span>
      ),
    },
    {
      accessorKey: "clientName",
      header: "Cliente",
    },
    {
      accessorKey: "date",
      header: "Fecha",
      cell: ({ row }: any) => formatDate(row.original.date),
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }: any) => formatCurrency(row.original.total),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }: any) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "remainingDebt",
      header: "Deuda",
      cell: ({ row }: any) => {
        const debt = row.original.remainingDebt || 0;
        return debt > 0 ? (
          <span className="text-red-600 dark:text-red-400 font-medium">
            {formatCurrency(debt)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }: any) => {
        const order = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/pedidos/${order.id}`)}
              >
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  // Generate ticket logic
                  toast.success("Ticket generado");
                }}
              >
                Generar ticket
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  // Delete logic
                  toast.error("Función no implementada");
                }}
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value={OrderStatus.ABONO}>Abono</SelectItem>
            <SelectItem value={OrderStatus.LIQUIDADO}>Liquidado</SelectItem>
            <SelectItem value={OrderStatus.NO_PAGADO}>No Pagado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={filteredOrders} loading={loading} />
    </div>
  );
}
