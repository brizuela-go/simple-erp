"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { createStaff, updateStaff, getStaffById } from "@/services/staff";
import { Staff } from "@/types";
import { Loader2 } from "lucide-react";
import { PositionCombobox } from "./position-combobox";

interface StaffFormProps {
  staffId?: string | null;
  onClose: () => void;
}

export function StaffForm({ staffId, onClose }: StaffFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    position: "",
    salary: 0,
    notes: "",
    username: "",
    isActive: true,
  });

  useEffect(() => {
    if (staffId) {
      loadStaffData();
    }
  }, [staffId]);

  const loadStaffData = async () => {
    if (!staffId) return;

    try {
      const staff = await getStaffById(staffId);
      if (staff) {
        setFormData({
          firstName: staff.firstName,
          lastName: staff.lastName,
          position: staff.position,
          salary: staff.salary,
          notes: staff.notes || "",
          username: staff.username || "",
          isActive: staff.isActive,
        });
      }
    } catch (error) {
      console.error("Error loading staff:", error);
      toast.error("Error al cargar datos del empleado");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.position) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    setLoading(true);
    const toastId = toast.loading(
      staffId ? "Actualizando empleado..." : "Creando empleado..."
    );

    try {
      const staffData: Partial<Staff> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        position: formData.position,
        salary: formData.salary,
        notes: formData.notes,
        username: formData.username,
        isActive: formData.isActive,
        totalLoans: 0,
        loans: [],
      };

      if (staffId) {
        await updateStaff(staffId, staffData);
        toast.success("Empleado actualizado exitosamente", { id: toastId });
      } else {
        await createStaff(staffData);
        toast.success("Empleado creado exitosamente", { id: toastId });
      }

      onClose();
    } catch (error) {
      console.error("Error saving staff:", error);
      toast.error("Error al guardar empleado", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Nombre(s) *</Label>
          <Input
            id="firstName"
            placeholder="Juan"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Apellido(s) *</Label>
          <Input
            id="lastName"
            placeholder="Pérez"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="position">Puesto *</Label>
        <PositionCombobox
          value={formData.position}
          onChange={(value) => setFormData({ ...formData, position: value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="salary">Sueldo</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="salary"
            type="number"
            step="0.01"
            placeholder="0.00"
            className="pl-8"
            value={formData.salary || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                salary: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Usuario (para inicio de sesión)</Label>
        <Input
          id="username"
          placeholder="juanp"
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
        />
        <p className="text-xs text-muted-foreground">
          Solo necesario si el empleado necesita acceso al sistema
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          placeholder="Información adicional..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label
          htmlFor="active"
          className="flex items-center gap-2 cursor-pointer"
        >
          <Switch
            id="active"
            checked={formData.isActive}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isActive: checked })
            }
          />
          <span>Activo</span>
        </Label>
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
          {staffId ? "Actualizar" : "Crear"} Empleado
        </Button>
      </div>
    </form>
  );
}
