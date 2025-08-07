// components/orders/orders-table.tsx - Updated version
"use client";

import { useEffect, useState } from "react";
import { Order, OrderStatus } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MoreHorizontal,
  Search,
  Eye,
  FileText,
  Trash2,
  Edit,
} from "lucide-react";
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
import { toast } from "sonner";
import { DataTable } from "../ui/data-table";
import { subscribeToOrders, deleteOrder } from "@/services/orders";
import { generateTicketPDFExtended } from "@/lib/pdf-generator";
import { ViewDetailsDialog } from "../ui/view-details-dialog";
import { OrderDetails } from "./order-details";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OrderTableProps {
  onEdit?: (order: Order) => void;
}

export function OrderTable({ onEdit }: OrderTableProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [generatingTicket, setGeneratingTicket] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToOrders((updatedOrders) => {
      setOrders(updatedOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  const handleGenerateTicket = async (order: Order) => {
    if (!order.id) return;

    setGeneratingTicket(order.id);
    const toastId = toast.loading("Generando ticket...");

    try {
      const url = await generateTicketPDFExtended(order);
      toast.success(
        <div className="flex flex-col gap-2">
          <span>Ticket generado exitosamente</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // Create WhatsApp link
                const message = `Hola! Te comparto tu ticket de compra: ${url}`;
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
                  message
                )}`;
                window.open(whatsappUrl, "_blank");
              }}
            >
              Enviar por WhatsApp
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(url, "_blank")}
            >
              Ver en línea
            </Button>
          </div>
        </div>,
        { id: toastId, duration: 10000 }
      );
    } catch (error) {
      console.error("Error generating ticket:", error);
      toast.error("Error al generar ticket", { id: toastId });
    } finally {
      setGeneratingTicket(null);
    }
  };

  const handleDeleteOrder = async () => {
    if (!deletingOrder?.id) return;

    const toastId = toast.loading("Eliminando pedido...");
    try {
      await deleteOrder(deletingOrder.id);
      toast.success("Pedido eliminado exitosamente", { id: toastId });
      setDeletingOrder(null);
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Error al eliminar pedido", { id: toastId });
    }
  };

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
          #{row.original.id?.slice(0, 8).toUpperCase()}
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
              <DropdownMenuItem onClick={() => setViewingOrder(order)}>
                <Eye className="h-4 w-4 mr-2" />
                Ver detalles
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(order)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => handleGenerateTicket(order)}
                disabled={generatingTicket === order.id}
              >
                <FileText className="h-4 w-4 mr-2" />
                Generar ticket
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => setDeletingOrder(order)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
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

      <ViewDetailsDialog
        open={!!viewingOrder}
        onOpenChange={(open) => !open && setViewingOrder(null)}
        title="Detalles del Pedido"
      >
        {viewingOrder && <OrderDetails order={viewingOrder} />}
      </ViewDetailsDialog>

      <AlertDialog
        open={!!deletingOrder}
        onOpenChange={() => setDeletingOrder(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El pedido será eliminado
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
