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
import { OrderStatus } from "@/types";
import { getOrdersReportData } from "@/services/reports";
import {
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";

interface OrdersReportProps {
  startDate: Date;
  endDate: Date;
  period: "weekly" | "monthly" | "yearly";
}

const STATUS_COLORS = {
  [OrderStatus.LIQUIDADO]: "#10b981",
  [OrderStatus.ABONO]: "#f59e0b",
  [OrderStatus.NO_PAGADO]: "#ef4444",
};

const STATUS_LABELS = {
  [OrderStatus.LIQUIDADO]: "Liquidado",
  [OrderStatus.ABONO]: "Abono",
  [OrderStatus.NO_PAGADO]: "No Pagado",
};

interface OrdersData {
  ordersOverTime: Array<{
    period: string;
    count: number;
    total: number;
  }>;
  statusDistribution: Array<{
    status: OrderStatus;
    name: string;
    value: number;
    total: number;
  }>;
  topClientsByOrders: Array<{
    name: string;
    orders: number;
    total: number;
  }>;
  averageOrderValue: Array<{
    period: string;
    average: number;
  }>;
}

export function OrdersReport({
  startDate,
  endDate,
  period,
}: OrdersReportProps) {
  const [data, setData] = useState<OrdersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const reportData = await getOrdersReportData(startDate, endDate, period);
      setData(reportData);
    } catch (error) {
      console.error("Error loading orders report:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al cargar los datos de pedidos";
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
          <p className="text-muted-foreground">
            No hay datos de pedidos para este período
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
              {entry.name === "Total" || entry.name === "Promedio"
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
  const totalOrders = data.ordersOverTime.reduce(
    (sum, period) => sum + period.count,
    0
  );
  const totalRevenue = data.ordersOverTime.reduce(
    (sum, period) => sum + period.total,
    0
  );
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate trends
  const hasMultiplePeriods = data.ordersOverTime.length > 1;
  let ordersTrend = 0;
  let revenueTrend = 0;

  if (hasMultiplePeriods) {
    const firstHalf = data.ordersOverTime.slice(
      0,
      Math.ceil(data.ordersOverTime.length / 2)
    );
    const secondHalf = data.ordersOverTime.slice(
      Math.ceil(data.ordersOverTime.length / 2)
    );

    const firstHalfOrders = firstHalf.reduce((sum, p) => sum + p.count, 0);
    const secondHalfOrders = secondHalf.reduce((sum, p) => sum + p.count, 0);
    const firstHalfRevenue = firstHalf.reduce((sum, p) => sum + p.total, 0);
    const secondHalfRevenue = secondHalf.reduce((sum, p) => sum + p.total, 0);

    if (firstHalfOrders > 0) {
      ordersTrend =
        ((secondHalfOrders - firstHalfOrders) / firstHalfOrders) * 100;
    }
    if (firstHalfRevenue > 0) {
      revenueTrend =
        ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100;
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            {hasMultiplePeriods && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {ordersTrend > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : ordersTrend < 0 ? (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                ) : null}
                <span
                  className={
                    ordersTrend > 0
                      ? "text-green-600"
                      : ordersTrend < 0
                      ? "text-red-600"
                      : ""
                  }
                >
                  {ordersTrend !== 0 &&
                    `${ordersTrend > 0 ? "+" : ""}${ordersTrend.toFixed(1)}%`}
                </span>
              </div>
            )}
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
            {hasMultiplePeriods && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {revenueTrend > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : revenueTrend < 0 ? (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                ) : null}
                <span
                  className={
                    revenueTrend > 0
                      ? "text-green-600"
                      : revenueTrend < 0
                      ? "text-red-600"
                      : ""
                  }
                >
                  {revenueTrend !== 0 &&
                    `${revenueTrend > 0 ? "+" : ""}${revenueTrend.toFixed(1)}%`}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Ticket Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground">Por pedido</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes Únicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.topClientsByOrders.length}
            </div>
            <p className="text-xs text-muted-foreground">Con pedidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Over Time */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Evolución de Pedidos</CardTitle>
          <CardDescription>
            Número de pedidos y valor total por{" "}
            {period === "weekly"
              ? "día"
              : period === "monthly"
              ? "semana"
              : "mes"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data.ordersOverTime}>
              <XAxis
                dataKey="period"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(value, true)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="count"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Pedidos"
                dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="total"
                stroke="#10b981"
                strokeWidth={2}
                name="Total"
                dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Distribución por Estado</CardTitle>
            <CardDescription>
              Porcentaje de pedidos según su estado de pago
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.statusDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.status]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} pedidos`,
                    STATUS_LABELS[name as OrderStatus],
                  ]}
                />
                <Legend
                  formatter={(value: string) =>
                    STATUS_LABELS[value as OrderStatus]
                  }
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {data.statusDistribution.map((status) => (
                <div
                  key={status.status}
                  className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: STATUS_COLORS[status.status],
                      }}
                    />
                    <span>{STATUS_LABELS[status.status]}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{status.value} pedidos</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(status.total)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Clients by Orders */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Clientes Principales</CardTitle>
            <CardDescription>
              Clientes con mayor número de pedidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.topClientsByOrders.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={data.topClientsByOrders.slice(0, 5)}
                    layout="horizontal"
                  >
                    <XAxis
                      type="number"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="orders"
                      fill="#8b5cf6"
                      radius={[0, 4, 4, 0]}
                      name="Pedidos"
                    />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-4 space-y-2">
                  {data.topClientsByOrders.slice(0, 5).map((client, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <span className="font-medium">{client.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {client.orders} pedidos
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(client.total)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No hay datos de clientes disponibles
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Average Order Value */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Valor Promedio de Pedidos</CardTitle>
          <CardDescription>
            Evolución del ticket promedio en el período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.averageOrderValue}>
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
                tickFormatter={(value) => formatCurrency(value, true)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="average"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                name="Promedio"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
