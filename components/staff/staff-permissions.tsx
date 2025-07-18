"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getActiveStaff, updateStaffPermissions } from "@/services/staff";
import { Staff, Permission } from "@/types";
import { toast } from "sonner";
import { Shield, Save, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const modules = [
  { id: "orders", name: "Pedidos", icon: "🛒" },
  { id: "clients", name: "Clientes", icon: "👥" },
  { id: "staff", name: "Personal", icon: "👤" },
  { id: "attendance", name: "Asistencia", icon: "⏰" },
  { id: "collections", name: "Cobranza", icon: "💰" },
  { id: "settings", name: "Ajustes", icon: "⚙️" },
];

const defaultPermissions: Permission[] = modules.map((module) => ({
  module: module.id,
  canView: false,
  canEdit: false,
  canDelete: false,
}));

export function StaffPermissions() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    if (selectedStaffId) {
      loadPermissions();
    }
  }, [selectedStaffId]);

  const loadStaff = async () => {
    try {
      const data = await getActiveStaff();
      setStaff(data);
      if (data.length > 0) {
        setSelectedStaffId(data[0].id!);
      }
    } catch (error) {
      console.error("Error loading staff:", error);
      toast.error("Error al cargar personal");
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = () => {
    const selectedMember = staff.find((s) => s.id === selectedStaffId);
    if (selectedMember?.permissions && selectedMember.permissions.length > 0) {
      setPermissions(selectedMember.permissions);
    } else {
      setPermissions(defaultPermissions);
    }
  };

  const handlePermissionChange = (
    moduleId: string,
    permission: "canView" | "canEdit" | "canDelete",
    value: boolean
  ) => {
    setPermissions(
      permissions.map((p) => {
        if (p.module === moduleId) {
          const updated = { ...p, [permission]: value };

          // If enabling edit or delete, also enable view
          if (
            (permission === "canEdit" || permission === "canDelete") &&
            value
          ) {
            updated.canView = true;
          }

          // If disabling view, also disable edit and delete
          if (permission === "canView" && !value) {
            updated.canEdit = false;
            updated.canDelete = false;
          }

          return updated;
        }
        return p;
      })
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedStaffId) return;

    setSaving(true);
    const toastId = toast.loading("Guardando permisos...");

    try {
      await updateStaffPermissions(selectedStaffId, permissions);
      toast.success("Permisos actualizados exitosamente", { id: toastId });
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Error al guardar permisos", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          No hay personal activo para configurar permisos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Seleccionar empleado</Label>
        <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un empleado" />
          </SelectTrigger>
          <SelectContent>
            {staff.map((member) => (
              <SelectItem key={member.id} value={member.id!}>
                {member.firstName} {member.lastName} - {member.position}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground">
          <div>Módulo</div>
          <div className="text-center">Ver</div>
          <div className="text-center">Editar</div>
          <div className="text-center">Eliminar</div>
        </div>

        {modules.map((module) => {
          const permission = permissions.find(
            (p) => p.module === module.id
          ) || {
            module: module.id,
            canView: false,
            canEdit: false,
            canDelete: false,
          };

          return (
            <Card key={module.id} className="glass">
              <div className="grid grid-cols-4 gap-4 items-center p-4">
                <div className="flex items-center gap-2">
                  <span>{module.icon}</span>
                  <span className="font-medium">{module.name}</span>
                </div>

                <div className="text-center">
                  <Checkbox
                    checked={permission.canView}
                    onCheckedChange={(checked) =>
                      handlePermissionChange(
                        module.id,
                        "canView",
                        checked as boolean
                      )
                    }
                  />
                </div>

                <div className="text-center">
                  <Checkbox
                    checked={permission.canEdit}
                    onCheckedChange={(checked) =>
                      handlePermissionChange(
                        module.id,
                        "canEdit",
                        checked as boolean
                      )
                    }
                    disabled={!permission.canView}
                  />
                </div>

                <div className="text-center">
                  <Checkbox
                    checked={permission.canDelete}
                    onCheckedChange={(checked) =>
                      handlePermissionChange(
                        module.id,
                        "canDelete",
                        checked as boolean
                      )
                    }
                    disabled={!permission.canView}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSavePermissions} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar permisos
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
