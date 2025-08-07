"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getClientsReportData } from "@/services/reports";
import {
  RefreshCw,
  AlertTriangle,
  Users,
  CreditCard,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

interface ClientsReportProps {
  startDate: Date;
  endDate: Date;
  period: "weekly" | "monthly" | "yearly";
}

const COLORS = [
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
  "#84cc16",
  "#f97316",
];

interface ClientsData {
  clientGrowth: Array<{
    period: string;
    newClients: number;
    activeClients: number;
  }>;
  topClientsByRevenue: Array<{
    name: string;
    revenue: number;
    orders: number;
    percentage: string;
  }>;
  clientsByRoute: Array<{
    name: string;
    value: number;
  }>;
  creditStats: {
    totalClientsWithCredit: number;
    totalCreditAmount: number;
  };
  topDebtors: Array<{
    daysPastDue: number;
    clientId: string;
    name: string;
    totalDebt: number;
    overdueOrders: number;
  }>;
  retentionData: Array<{
    segment: string;
    count: number;
  }>;
}

export function ClientsReport({
  startDate,
  endDate,
  period,
}: ClientsReportProps) {
  const [data, setData] = useState<ClientsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const reportData = await getClientsReportData(startDate, endDate, period);
      setData(reportData);
    } catch (error) {
      console.error("Error loading clients report:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al cargar los datos de clientes";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
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

  if (!data) {
    return (
      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No hay datos de clientes para este período
          </p>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-muted-foreground">
              <span className="font-medium" style={{ color: entry.color }}>
                {entry.name}:
              </span>{" "}
              {entry.dataKey === "revenue" || entry.dataKey === "total"
                ? formatCurrency(entry.value)
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Calculate summary statistics
  const totalClients = data.topClientsByRevenue.length;
  const totalRevenue = data.topClientsByRevenue.reduce(
    (sum, client) => sum + client.revenue,
    0
  );
  const totalOrders = data.topClientsByRevenue.reduce(
    (sum, client) => sum + client.orders,
    0
  );
  const averageRevenuePerClient =
    totalClients > 0 ? totalRevenue / totalClients : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">Con actividad</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Del período</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Ingreso Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageRevenuePerClient)}
            </div>
            <p className="text-xs text-muted-foreground">Por cliente</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Con Crédito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.creditStats.totalClientsWithCredit}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(data.creditStats.totalCreditAmount)} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client Growth */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Crecimiento de Clientes</CardTitle>
          <CardDescription>
            Nuevos clientes y clientes activos en el período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data.clientGrowth}>
              <XAxis
                dataKey="period"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="newClients"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Nuevos Clientes"
                dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="activeClients"
                stroke="#10b981"
                strokeWidth={2}
                name="Clientes Activos"
                dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Clients by Revenue */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Clientes por Ingresos</CardTitle>
            <CardDescription>
              Top 10 clientes que generan más ingresos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.topClientsByRevenue.slice(0, 10).map((client, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {client.orders} pedidos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatCurrency(client.revenue)}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {client.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Client Distribution by Route */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Distribución por Ruta
            </CardTitle>
            <CardDescription>
              Clientes agrupados por ruta de entrega
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.clientsByRoute.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.clientsByRoute}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.clientsByRoute.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-4 space-y-2">
                  {data.clientsByRoute.map((route, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span>{route.name}</span>
                      </div>
                      <span className="font-medium">
                        {route.value} clientes
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  No hay datos de rutas disponibles
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Credit Analysis */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Análisis de Crédito
          </CardTitle>
          <CardDescription>
            Estado de créditos y cobranza por cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-blue-600">
                  {data.creditStats.totalClientsWithCredit}
                </p>
                <p className="text-sm text-muted-foreground">
                  Clientes con crédito
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(data.creditStats.totalCreditAmount)}
                </p>
                <p className="text-sm text-muted-foreground">Crédito total</p>
              </div>
            </div>

            {/* Top Debtors */}
            {data.topDebtors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">
                  Principales Deudores
                </h4>
                <div className="space-y-2">
                  {data.topDebtors.map((debtor, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20"
                    >
                      <div>
                        <p className="text-sm font-medium">{debtor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {debtor.overdueOrders} pedidos vencidos
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">
                          {formatCurrency(debtor.totalDebt)}
                        </p>
                        <Badge variant="destructive" className="text-xs">
                          {debtor.daysPastDue} días vencido
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Client Retention */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Retención de Clientes</CardTitle>
          <CardDescription>
            Análisis de frecuencia de compra y retención
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.retentionData}>
              <XAxis
                dataKey="segment"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                name="Clientes"
              />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.retentionData.map((segment, index) => (
              <div
                key={index}
                className="text-center p-3 rounded-lg bg-muted/50"
              >
                <p className="text-lg font-bold">{segment.count}</p>
                <p className="text-xs text-muted-foreground">
                  {segment.segment}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
