"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Clock,
  Target,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getReportSummary } from "@/services/reports";

interface SummaryReportProps {
  startDate: Date;
  endDate: Date;
  period: "weekly" | "monthly" | "yearly";
}

export function SummaryReport({
  startDate,
  endDate,
  period,
}: SummaryReportProps) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, [startDate, endDate]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await getReportSummary(startDate, endDate);
      setSummary(data);
    } catch (error) {
      console.error("Error loading summary:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!summary) return null;

  const metrics = [
    {
      title: "Ingresos Totales",
      value: formatCurrency(summary.totalRevenue),
      change: summary.revenueChange,
      icon: DollarSign,
    },
    {
      title: "Pedidos",
      value: summary.totalOrders,
      change: summary.ordersChange,
      icon: ShoppingCart,
    },
    {
      title: "Clientes Activos",
      value: summary.activeClients,
      change: summary.clientsChange,
      icon: Users,
    },
    {
      title: "Asistencia Promedio",
      value: `${summary.averageAttendance}%`,
      change: summary.attendanceChange,
      icon: Clock,
    },
  ];

  const insights = [
    {
      type: summary.revenueChange > 0 ? "positive" : "negative",
      title: "Tendencia de Ingresos",
      description: `Los ingresos han ${
        summary.revenueChange > 0 ? "aumentado" : "disminuido"
      } un ${Math.abs(
        summary.revenueChange
      )}% comparado con el período anterior.`,
    },
    {
      type: summary.topClient ? "info" : "neutral",
      title: "Cliente Principal",
      description: summary.topClient
        ? `${summary.topClient.name} representa el ${summary.topClient.percentage}% de los ingresos totales.`
        : "No hay datos suficientes de clientes.",
    },
    {
      type:
        summary.pendingPayments > summary.totalRevenue * 0.3
          ? "warning"
          : "positive",
      title: "Estado de Cobranza",
      description: `Hay ${formatCurrency(
        summary.pendingPayments
      )} en pagos pendientes, representando el ${(
        (summary.pendingPayments / summary.totalRevenue) *
        100
      ).toFixed(1)}% de los ingresos.`,
    },
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "positive":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "negative":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Target className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-4 w-4 `} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {metric.change !== 0 && (
                  <>
                    {metric.change > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={
                        metric.change > 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      {Math.abs(metric.change)}%
                    </span>
                  </>
                )}
                vs período anterior
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Overview */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Resumen de Desempeño</CardTitle>
          <CardDescription>
            Análisis comparativo del período{" "}
            {period === "weekly"
              ? "semanal"
              : period === "monthly"
              ? "mensual"
              : "anual"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bars */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Meta de Ventas</span>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(summary.totalRevenue)} /{" "}
                  {formatCurrency(summary.salesTarget)}
                </span>
              </div>
              <Progress
                value={(summary.totalRevenue / summary.salesTarget) * 100}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Tasa de Cobro</span>
                <span className="text-sm text-muted-foreground">
                  {summary.collectionRate}%
                </span>
              </div>
              <Progress
                value={summary.collectionRate}
                className="bg-green-100"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Ocupación del Personal
                </span>
                <span className="text-sm text-muted-foreground">
                  {summary.staffUtilization}%
                </span>
              </div>
              <Progress
                value={summary.staffUtilization}
                className="bg-blue-100"
              />
            </div>
          </div>

          {/* Key Insights */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Observaciones Clave</h4>
            {insights.map((insight, index) => (
              <div
                key={index}
                className="flex gap-3 p-3 rounded-lg bg-muted/50"
              >
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {insight.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Top Products/Services */}
          {summary.topProducts && summary.topProducts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">
                Productos/Servicios Principales
              </h4>
              <div className="space-y-2">
                {summary.topProducts.map((product: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{product.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {product.quantity} ventas
                      </Badge>
                      <span className="text-sm font-medium">
                        {formatCurrency(product.revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
