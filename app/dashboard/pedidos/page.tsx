"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Table, Columns } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { OrderForm } from "@/components/orders/orders-form";
import { OrderKanban } from "@/components/orders/orders-kanban";
import { OrderTable } from "@/components/orders/orders-table";
import { Order } from "@/types";

export default function OrdersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [editingOrder, setEditingOrder] = useState<string | null>(null);

  const handleEdit = (order: Order) => {
    setEditingOrder(order.id ?? null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="swiss-text-title">Pedidos</h1>
          <p className="text-muted-foreground">Gestión de pedidos y ventas</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Pedido
        </Button>
      </div>

      <Tabs
        defaultValue="table"
        value={viewMode}
        onValueChange={(v) => setViewMode(v as any)}
      >
        <TabsList className="glass">
          <TabsTrigger value="table" className="gap-2">
            <Table className="h-4 w-4" />
            Tabla
          </TabsTrigger>
          <TabsTrigger value="kanban" className="gap-2">
            <Columns className="h-4 w-4" />
            Kanban
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-6">
          <OrderTable onEdit={handleEdit} />
        </TabsContent>

        <TabsContent value="kanban" className="mt-6">
          <OrderKanban />
        </TabsContent>
      </Tabs>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="w-full sm:max-w-lg p-4">
          <SheetHeader>
            <SheetTitle className="-ml-4">
              {editingOrder ? "Editar Pedido" : "Nuevo Pedido"}
            </SheetTitle>
          </SheetHeader>
          <OrderForm onClose={() => setIsFormOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
