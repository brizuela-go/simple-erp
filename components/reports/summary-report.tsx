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
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Clock,
  Target,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getReportSummary } from "@/services/reports";

interface SummaryReportProps {
  startDate: Date;
  endDate: Date;
  period: "weekly" | "monthly" | "yearly";
}

interface SummaryData {
  totalRevenue: number;
  totalOrders: number;
  activeClients: number;
  averageAttendance: number;
  pendingPayments: number;
  topClient: {
    name: string;
    revenue: number;
    percentage: number;
  } | null;
  collectionRate: number;
}

export function SummaryReport({
  startDate,
  endDate,
  period,
}: SummaryReportProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary();
  }, [startDate, endDate]);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getReportSummary(startDate, endDate);
      setSummary(data);
    } catch (error) {
      console.error("Error loading summary:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error al cargar el resumen";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadSummary();
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

  if (error) {
    return (
      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium mb-2">Error al cargar datos</h3>
          <p className="text-muted-foreground text-center mb-4">{error}</p>
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No hay datos disponibles para este período
          </p>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      title: "Ingresos Totales",
      value: formatCurrency(summary.totalRevenue),
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Pedidos",
      value: summary.totalOrders.toString(),
      icon: ShoppingCart,
      color: "text-blue-600",
    },
    {
      title: "Clientes Activos",
      value: summary.activeClients.toString(),
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Asistencia Promedio",
      value: `${summary.averageAttendance}%`,
      icon: Clock,
      color: "text-orange-600",
    },
  ];

  const insights = [
    {
      type: summary.topClient ? "info" : "neutral",
      title: "Cliente Principal",
      description: summary.topClient
        ? `${summary.topClient.name} representa el ${
            summary.topClient.percentage
          }% de los ingresos totales con ${formatCurrency(
            summary.topClient.revenue
          )}.`
        : "No hay datos suficientes de clientes para este período.",
    },
    {
      type:
        summary.pendingPayments > summary.totalRevenue * 0.3
          ? "warning"
          : summary.pendingPayments > summary.totalRevenue * 0.15
          ? "caution"
          : "positive",
      title: "Estado de Cobranza",
      description: `Hay ${formatCurrency(
        summary.pendingPayments
      )} en pagos pendientes, representando el ${(
        (summary.pendingPayments / Math.max(summary.totalRevenue, 1)) *
        100
      ).toFixed(1)}% de los ingresos. Tasa de cobro: ${
        summary.collectionRate
      }%.`,
    },
    {
      type:
        summary.averageAttendance >= 90
          ? "positive"
          : summary.averageAttendance >= 80
          ? "caution"
          : "warning",
      title: "Rendimiento del Personal",
      description: `La asistencia promedio es del ${
        summary.averageAttendance
      }%${
        summary.averageAttendance < 90
          ? ". Se recomienda implementar estrategias para mejorar la puntualidad y asistencia."
          : ". El equipo mantiene una excelente asistencia."
      }`,
    },
    {
      type: summary.totalOrders > 0 ? "info" : "neutral",
      title: "Actividad Comercial",
      description:
        summary.totalOrders > 0
          ? `Se procesaron ${
              summary.totalOrders
            } pedidos con un valor promedio de ${formatCurrency(
              summary.totalRevenue / summary.totalOrders
            )}.`
          : "No hay actividad comercial registrada en este período.",
    },
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "positive":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "negative":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "caution":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Target className="h-4 w-4 text-blue-600" />;
    }
  };

  const getInsightBadgeVariant = (type: string) => {
    switch (type) {
      case "positive":
        return "default";
      case "negative":
      case "warning":
        return "destructive";
      case "caution":
        return "secondary";
      default:
        return "outline";
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
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Período actual
              </p>
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
          {/* Collection Rate Progress */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Tasa de Cobro</span>
                <span className="text-sm text-muted-foreground">
                  {summary.collectionRate}%
                </span>
              </div>
              <Progress value={summary.collectionRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {summary.collectionRate >= 85
                  ? "Excelente gestión de cobranza"
                  : summary.collectionRate >= 70
                  ? "Gestión de cobranza regular"
                  : "Requiere mejorar gestión de cobranza"}
              </p>
            </div>
          </div>

          {/* Key Insights */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Observaciones Clave</h4>
            {insights.map((insight, index) => (
              <div
                key={index}
                className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
              >
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{insight.title}</p>
                    <Badge
                      variant={getInsightBadgeVariant(insight.type)}
                      className="text-xs"
                    >
                      {insight.type === "positive"
                        ? "Bien"
                        : insight.type === "negative" ||
                          insight.type === "warning"
                        ? "Atención"
                        : insight.type === "caution"
                        ? "Revisar"
                        : "Info"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {insight.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Stats */}
          {summary.totalRevenue > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-lg font-bold">
                  {formatCurrency(
                    summary.totalRevenue / Math.max(summary.totalOrders, 1)
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Ticket Promedio</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">
                  {formatCurrency(
                    summary.totalRevenue / Math.max(summary.activeClients, 1)
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Ingreso por Cliente
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">
                  {(
                    summary.totalOrders / Math.max(summary.activeClients, 1)
                  ).toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Pedidos por Cliente
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">
                  {summary.pendingPayments > 0
                    ? Math.round(
                        ((summary.totalRevenue - summary.pendingPayments) /
                          summary.totalRevenue) *
                          100
                      )
                    : 100}
                  %
                </p>
                <p className="text-xs text-muted-foreground">
                  Efectividad de Cobro
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
