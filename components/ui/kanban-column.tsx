// components/KanbanColumn.tsx
import { useDroppable } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { Order } from "@/types";

export function KanbanColumn({
  column,
  orders,
  children,
}: {
  column: any;
  orders: Order[];
  children?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div className="space-y-4">
      <div className={`p-3 rounded-lg ${column.color}`}>
        <h3 className="font-medium">{column.title}</h3>
        <p className="text-sm text-muted-foreground">{orders.length} pedidos</p>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[200px] p-2 rounded-lg transition-colors space-y-3 ${
          isOver ? "bg-accent" : ""
        }`}
      >
        <SortableContext
          items={orders
            .map((o) => o.id)
            .filter((id): id is string => id !== undefined)}
        >
          {children}
        </SortableContext>
      </div>
    </div>
  );
}
