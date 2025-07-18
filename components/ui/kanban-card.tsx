// components/KanbanCard.tsx
import { useDraggable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Order } from "@/types";
import { useRouter } from "next/navigation";

export default function KanbanCard({ order }: { order: Order }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: order.id ?? `order-${Math.random()}`,
    });
  const router = useRouter();

  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
        isDragging ? "shadow-xl rotate-3" : ""
      }`}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      onClick={() => router.push(`/dashboard/pedidos/${order.id}`)}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-sm">{order.clientName}</h4>
          <Badge variant="outline" className="text-xs">
            #{order.id?.slice(0, 6)}
          </Badge>
        </div>
        <p className="text-lg font-semibold">{formatCurrency(order.total)}</p>
        {order.remainingDebt && order.remainingDebt > 0 && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Debe: {formatCurrency(order.remainingDebt)}
          </p>
        )}
      </div>
    </Card>
  );
}
