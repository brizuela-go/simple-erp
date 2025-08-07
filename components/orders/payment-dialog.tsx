// components/orders/payment-dialog.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Order } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { registerPayment } from "@/services/collections";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PaymentDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PaymentDialog({
  order,
  open,
  onOpenChange,
  onSuccess,
}: PaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    method: "cash" as "cash" | "transfer" | "card",
    notes: "",
  });

  const handleSubmit = async () => {
    if (!order?.id || paymentData.amount <= 0) return;

    if (paymentData.amount > (order.remainingDebt || 0)) {
      toast.error("El monto no puede ser mayor a la deuda pendiente");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Procesando pago...");

    try {
      await registerPayment(
        order.id,
        paymentData.amount,
        paymentData.method,
        paymentData.notes
      );

      toast.success("Pago registrado exitosamente", { id: toastId });
      onOpenChange(false);
      onSuccess?.();

      // Reset form
      setPaymentData({
        amount: 0,
        method: "cash",
        notes: "",
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Error al procesar pago", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <p className="text-sm font-medium">{order.clientName}</p>
          </div>

          <div className="space-y-2">
            <Label>Deuda pendiente</Label>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(order.remainingDebt || 0)}
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
                value={paymentData.amount || ""}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                max={order.remainingDebt}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Método de pago</Label>
            <Select
              value={paymentData.method}
              onValueChange={(value) =>
                setPaymentData({
                  ...paymentData,
                  method: value as "cash" | "transfer" | "card",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="card">Tarjeta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Agregar notas sobre el pago..."
              value={paymentData.notes}
              onChange={(e) =>
                setPaymentData({ ...paymentData, notes: e.target.value })
              }
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              paymentData.amount <= 0 ||
              paymentData.amount > (order.remainingDebt || 0)
            }
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Registrar Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
