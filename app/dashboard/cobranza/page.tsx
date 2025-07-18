"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Users, Search } from "lucide-react";
import { Order } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getOrdersWithDebt } from "@/services/collections";

export default function CobranzaPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await getOrdersWithDebt();
      setOrders(data);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDebt = orders.reduce(
    (sum, order) => sum + (order.remainingDebt || 0),
    0
  );
  const totalClients = new Set(orders.map((o) => o.clientId)).size;

  const handlePayment = async () => {
    if (!selectedOrder || paymentAmount <= 0) return;

    const toastId = toast.loading("Procesando pago...");

    try {
      // Here you would implement the payment logic
      toast.success("Pago registrado exitosamente", { id: toastId });
      setIsPaymentDialogOpen(false);
      setSelectedOrder(null);
      setPaymentAmount(0);
      loadOrders();
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Error al procesar pago", { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="swiss-text-title">Cobranza</h1>
        <p className="text-muted-foreground">
          Gestión de pagos y deudas pendientes
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalDebt)}
            </div>
            <p className="text-xs text-muted-foreground">Por cobrar</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pedidos Pendientes
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">Con deuda</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">Con deuda activa</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Pedidos con Deuda</CardTitle>
          <CardDescription>Lista de pedidos pendientes de pago</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-20 bg-muted rounded animate-pulse"
                  />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay pedidos con deuda pendiente
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{order.clientName}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>#{order.id?.slice(0, 8)}</span>
                        <span>{formatDate(order.date)}</span>
                        <Badge variant="outline">
                          Total: {formatCurrency(order.total)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Deuda</p>
                        <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                          {formatCurrency(order.remainingDebt || 0)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setPaymentAmount(order.remainingDebt || 0);
                          setIsPaymentDialogOpen(true);
                        }}
                      >
                        Registrar Pago
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{selectedOrder.clientName}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Deuda pendiente</p>
                <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(selectedOrder.remainingDebt || 0)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Monto a pagar</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    className="pl-8"
                    value={paymentAmount}
                    onChange={(e) =>
                      setPaymentAmount(parseFloat(e.target.value) || 0)
                    }
                    max={selectedOrder.remainingDebt}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsPaymentDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={
                    paymentAmount <= 0 ||
                    paymentAmount > (selectedOrder.remainingDebt || 0)
                  }
                  className="flex-1"
                >
                  Registrar Pago
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
