"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createClient, updateClient, getClientById } from "@/services/clients";
import { Client } from "@/types";
import { Loader2, X } from "lucide-react";

interface ClientFormProps {
  clientId?: string | null;
  onClose: () => void;
}

export function ClientForm({ clientId, onClose }: ClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    price: 0,
    hasCredit: false,
    routes: [] as string[],
  });
  const [newRoute, setNewRoute] = useState("");

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  const loadClientData = async () => {
    if (!clientId) return;

    try {
      const client = await getClientById(clientId);
      if (client) {
        setFormData({
          name: client.name,
          address: client.address,
          phone: client.phone,
          price: client.price,
          hasCredit: client.hasCredit,
          routes: client.routes || [],
        });
      }
    } catch (error) {
      console.error("Error loading client:", error);
      toast.error("Error al cargar datos del cliente");
    }
  };

  const handleAddRoute = () => {
    if (newRoute.trim() && !formData.routes.includes(newRoute.trim())) {
      setFormData({
        ...formData,
        routes: [...formData.routes, newRoute.trim()],
      });
      setNewRoute("");
    }
  };

  const handleRemoveRoute = (route: string) => {
    setFormData({
      ...formData,
      routes: formData.routes.filter((r) => r !== route),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.address || !formData.phone) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    setLoading(true);
    const toastId = toast.loading(
      clientId ? "Actualizando cliente..." : "Creando cliente..."
    );

    try {
      const clientData: Partial<Client> = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        price: formData.price,
        hasCredit: formData.hasCredit,
        routes: formData.routes,
      };

      if (clientId) {
        await updateClient(clientId, clientData);
        toast.success("Cliente actualizado exitosamente", { id: toastId });
      } else {
        await createClient(clientData);
        toast.success("Cliente creado exitosamente", { id: toastId });
      }

      onClose();
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error("Error al guardar cliente", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre *</Label>
        <Input
          id="name"
          placeholder="Nombre del cliente"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección *</Label>
        <Input
          id="address"
          placeholder="Calle y número"
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono *</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="222 123 4567"
          max={13}
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Precio</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="price"
            type="number"
            step="0.01"
            placeholder="0.00"
            className="pl-8"
            value={formData.price || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                price: parseFloat(e.target.value) || 0,
              })
            }
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
            checked={formData.hasCredit}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, hasCredit: checked })
            }
          />
          <span>Tiene crédito</span>
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="routes">Rutas</Label>
        <div className="flex gap-2">
          <Input
            id="routes"
            placeholder="Agregar ruta"
            value={newRoute}
            onChange={(e) => setNewRoute(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddRoute();
              }
            }}
          />
          <Button type="button" onClick={handleAddRoute} variant="outline">
            Agregar
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.routes.map((route) => (
            <Badge key={route} variant="secondary" className="gap-1">
              {route}
              <button
                type="button"
                onClick={() => handleRemoveRoute(route)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
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
          {clientId ? "Actualizar" : "Crear"} Cliente
        </Button>
      </div>
    </form>
  );
}
