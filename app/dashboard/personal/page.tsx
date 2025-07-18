"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { StaffTable } from "@/components/staff/staff-table";
import { StaffForm } from "@/components/staff/staff-form";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function StaffPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<string | null>(null);

  const handleEdit = (staffId: string) => {
    setEditingStaff(staffId);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingStaff(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="swiss-text-title">Personal</h1>
          <p className="text-muted-foreground">
            Gestión de empleados y permisos
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Empleado
        </Button>
      </div>

      <StaffTable onEdit={handleEdit} />

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="w-full sm:max-w-lg p-4">
          <SheetHeader>
            <SheetTitle className="-ml-4">
              {editingStaff ? "Editar Empleado" : "Nuevo Empleado"}
            </SheetTitle>
          </SheetHeader>
          <StaffForm staffId={editingStaff} onClose={handleCloseForm} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
