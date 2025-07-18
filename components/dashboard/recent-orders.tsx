"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { Order, OrderStatus } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { getRecentOrders } from "@/services/orders";

export function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await getRecentOrders(5);
        setOrders(data);
      } catch (error) {
        console.error("Error loading orders:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

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

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Pedidos Recientes</CardTitle>
        <CardDescription>Últimos 5 pedidos registrados</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay pedidos recientes
          </p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/dashboard/pedidos/${order.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{order.clientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.date)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {formatCurrency(order.total)}
                  </span>
                  {getStatusBadge(order.status)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
