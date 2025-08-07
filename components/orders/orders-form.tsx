"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { OrderStatus } from "@/types";
import { Loader2 } from "lucide-react";
import { createOrder } from "@/services/orders";
import { ClientCombobox } from "../clients/clients-combobox";
import { generateTicketPDFExtended } from "@/lib/pdf-generator";

interface OrderFormProps {
  onClose: () => void;
}

export function OrderForm({ onClose }: OrderFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    total: 0,
    isCredit: false,
    abonado: 0,
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId) {
      toast.error("Por favor selecciona un cliente");
      return;
    }

    if (formData.total <= 0) {
      toast.error("El total debe ser mayor a 0");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Creando pedido...");

    try {
      // Calculate status based on payment
      let status = OrderStatus.NO_PAGADO;
      if (!formData.isCredit || formData.abonado >= formData.total) {
        status = OrderStatus.LIQUIDADO;
      } else if (formData.abonado > 0) {
        status = OrderStatus.ABONO;
      }

      const orderData = {
        clientId: formData.clientId,
        total: formData.total,
        status,
        isCredit: formData.isCredit,
        remainingDebt: formData.isCredit
          ? formData.total - formData.abonado
          : 0,
        notes: formData.notes,
        date: new Date(),
      };

      const orderId = await createOrder(orderData);

      // Generate PDF ticket
      await generateTicketPDFExtended({ ...orderData, id: orderId });

      toast.success("Pedido creado exitosamente", { id: toastId });
      onClose();
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Error al crear el pedido", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-6">
      <div className="space-y-2">
        <Label htmlFor="client">Cliente</Label>
        <ClientCombobox
          value={formData.clientId}
          onChange={(value: string | undefined) =>
            setFormData({ ...formData, clientId: value ?? "" })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="total">Total</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="total"
            type="number"
            step="0.01"
            placeholder="0.00"
            className="pl-8"
            value={formData.total || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                total: parseFloat(e.target.value) || 0,
              })
            }
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label
          htmlFor="credit"
          className="flex items-center gap-2 cursor-pointer"
        >
          <Switch
            id="credit"
            checked={formData.isCredit}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isCredit: checked })
            }
          />
          <span>Crédito</span>
        </Label>
      </div>

      {formData.isCredit && (
        <div className="space-y-2 animate-slide-in">
          <Label htmlFor="abonado">Abonado</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              id="abonado"
              type="number"
              step="0.01"
              placeholder="0.00"
              className="pl-8"
              value={formData.abonado || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  abonado: parseFloat(e.target.value) || 0,
                })
              }
              max={formData.total}
            />
          </div>
          {formData.total > 0 && (
            <p className="text-sm text-muted-foreground">
              Deuda restante: ${(formData.total - formData.abonado).toFixed(2)}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Input
          id="notes"
          placeholder="Agregar notas..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Crear Pedido
        </Button>
      </div>
    </form>
  );
}
