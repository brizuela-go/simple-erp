// components/orders/order-details.tsx
import { Order, OrderStatus } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  User,
  CreditCard,
  FileText,
  DollarSign,
  TrendingDown,
} from "lucide-react";

interface OrderDetailsProps {
  order: Order;
}

export function OrderDetails({ order }: OrderDetailsProps) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Pedido</p>
          <p className="text-2xl font-bold">
            #{order.id?.slice(0, 8).toUpperCase()}
          </p>
        </div>
        {getStatusBadge(order.status)}
      </div>

      <Separator />

      {/* Client Info */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <User className="h-4 w-4" />
          Información del Cliente
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Nombre</p>
            <p className="font-medium">
              {order.clientName || "Cliente General"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">ID Cliente</p>
            <p className="font-medium">{order.clientId}</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Order Info */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Información del Pedido
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Fecha</p>
            <p className="font-medium">
              {formatDate(order.date, "dd/MM/yyyy HH:mm")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tipo de Venta</p>
            <p className="font-medium">
              {order.isCredit ? "Crédito" : "Contado"}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Financial Info */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Información Financiera
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl font-bold">{formatCurrency(order.total)}</p>
          </div>
          {order.isCredit && (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Abonado</p>
                <p className="text-xl font-medium text-green-600">
                  {formatCurrency(order.total - (order.remainingDebt || 0))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deuda Pendiente</p>
                <p className="text-xl font-medium text-red-600">
                  {formatCurrency(order.remainingDebt || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Porcentaje Pagado
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${
                          ((order.total - (order.remainingDebt || 0)) /
                            order.total) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {Math.round(
                      ((order.total - (order.remainingDebt || 0)) /
                        order.total) *
                        100
                    )}
                    %
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notas
            </h3>
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </div>
        </>
      )}

      {/* Payments History (if credit) */}
      {order.isCredit && order.payments && order.payments.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Historial de Pagos
            </h3>
            <div className="space-y-2">
              {order.payments.map((payment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(payment.date)}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {payment.method || "Efectivo"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
