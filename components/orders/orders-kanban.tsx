"use client";

import { SetStateAction, useEffect, useState } from "react";
import {
  DndContext,
  closestCorners,
  DragEndEvent,
  useSensors,
  useSensor,
  MouseSensor,
  TouchSensor,
} from "@dnd-kit/core";
import { Order, OrderStatus } from "@/types";
import { subscribeToOrders, updateOrderStatus } from "@/services/orders";
import { toast } from "sonner";
import { KanbanColumn } from "../ui/kanban-column";
import KanbanCard from "../ui/kanban-card";

const columns = [
  {
    id: OrderStatus.NO_PAGADO,
    title: "No Pagado",
    color: "bg-red-100 dark:bg-red-900/20",
  },
  {
    id: OrderStatus.ABONO,
    title: "Abono",
    color: "bg-yellow-100 dark:bg-yellow-900/20",
  },
  {
    id: OrderStatus.LIQUIDADO,
    title: "Liquidado",
    color: "bg-green-100 dark:bg-green-900/20",
  },
];

export function OrderKanban() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToOrders(
      (updatedOrders: SetStateAction<Order[]>) => {
        setOrders(updatedOrders);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const orderId = active.id;
    const destStatus = over.id as OrderStatus;

    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === destStatus) return;

    try {
      await updateOrderStatus(orderId.toString(), destStatus);
      toast.success("Estado actualizado");
    } catch (error) {
      toast.error("Error al actualizar el estado");
    }
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            <div className="h-10 bg-muted rounded animate-pulse" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            orders={orders.filter((order) => order.status === column.id)}
          >
            {orders
              .filter((order) => order.status === column.id)
              .map((order) => (
                <KanbanCard key={order.id} order={order} />
              ))}
          </KanbanColumn>
        ))}
      </div>
    </DndContext>
  );
}
