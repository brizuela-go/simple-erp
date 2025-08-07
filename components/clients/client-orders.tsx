// components/clients/client-orders.tsx
import { useEffect, useState } from "react";
import { Order, OrderStatus } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import { getClientOrders } from "@/services/orders";

interface ClientOrdersProps {
  clientId: string;
}

export function ClientOrders({ clientId }: ClientOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [clientId]);

  const loadOrders = async () => {
    try {
      const data = await getClientOrders(clientId);
      setOrders(data);
    } catch (error) {
      console.error("Error loading client orders:", error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          Este cliente no tiene pedidos registrados
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">
                #{order.id?.slice(0, 8).toUpperCase()}
              </span>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(order.date)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium">{formatCurrency(order.total)}</p>
            {order.remainingDebt && order.remainingDebt > 0 && (
              <p className="text-sm text-red-600">
                Debe: {formatCurrency(order.remainingDebt)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
