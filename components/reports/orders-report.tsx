"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export function OrdersReport({
  startDate,
  endDate,
  period,
}: OrdersReportProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const reportData = await getOrdersReportData(startDate, endDate, period);
      setData(reportData);
    } catch (error) {
      console.error("Error loading orders report:", error);
    } finally {
      setLoading(false);
    }
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

  if (!data) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-muted-foreground">
              {entry.name}:{" "}
              {entry.name === "Total"
                ? formatCurrency(entry.value)
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
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
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="total"
                stroke="#10b981"
                strokeWidth={2}
                name="Total"
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
                  {data.statusDistribution.map(
                    (
                      entry: {
                        status: keyof typeof STATUS_COLORS;
                        value: number;
                        total: number;
                      },
                      index: number
                    ) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.status]}
                      />
                    )
                  )}
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
              {data.statusDistribution.map(
                (status: {
                  status: keyof typeof STATUS_COLORS;
                  value: number;
                  total: number;
                }) => (
                  <div
                    key={status.status}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: STATUS_COLORS[status.status],
                        }}
                      />
                      <span>
                        {
                          STATUS_LABELS[
                            status.status as keyof typeof STATUS_LABELS
                          ]
                        }
                      </span>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(status.total)}
                    </span>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Clients by Orders */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Clientes Principales</CardTitle>
            <CardDescription>
              Top 5 clientes por número de pedidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topClientsByOrders} layout="horizontal">
                <XAxis
                  dataKey="name"
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
                  dataKey="orders"
                  fill="#8b5cf6"
                  radius={[8, 8, 0, 0]}
                  name="Pedidos"
                />
              </BarChart>
            </ResponsiveContainer>
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
                radius={[8, 8, 0, 0]}
                name="Promedio"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
