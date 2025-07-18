import { DashboardStats } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingCart,
  DollarSign,
  CreditCard,
  Users,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Pedidos Totales",
      value: stats.totalOrders.toString(),
      description: `${stats.todayOrders} pedidos hoy`,
      icon: ShoppingCart,
      trend: stats.todayOrders > 0 ? "up" : "neutral",
    },
    {
      title: "Ingresos Totales",
      value: formatCurrency(stats.totalRevenue),
      description: `${formatCurrency(stats.monthlyRevenue)} este mes`,
      icon: DollarSign,
      trend: stats.monthlyRevenue > 0 ? "up" : "neutral",
    },
    {
      title: "Pagos Pendientes",
      value: formatCurrency(stats.pendingPayments),
      description: "Por cobrar",
      icon: CreditCard,
      trend: stats.pendingPayments > 0 ? "down" : "neutral",
    },
    {
      title: "Clientes Activos",
      value: stats.activeClients.toString(),
      description: "Con pedidos recientes",
      icon: Users,
      trend: "up",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {card.trend === "up" && (
                <TrendingUp className="h-3 w-3 text-green-500" />
              )}
              {card.trend === "down" && (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              {card.description}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
