"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ClientForm } from "@/components/clients/clients-form";
import { ClientTable } from "@/components/clients/clients-table";

export default function ClientsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<string | null>(null);

  const handleEdit = (clientId: string) => {
    setEditingClient(clientId);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingClient(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="swiss-text-title">Clientes</h1>
          <p className="text-muted-foreground">Gestión de clientes y rutas</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <ClientTable onEdit={handleEdit} />

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="w-full sm:max-w-lg p-4">
          <SheetHeader>
            <SheetTitle className="-ml-4">
              {editingClient ? "Editar Cliente" : "Nuevo Cliente"}
            </SheetTitle>
          </SheetHeader>
          <ClientForm clientId={editingClient} onClose={handleCloseForm} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
