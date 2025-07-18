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
import { Badge } from "@/components/ui/badge";
import { getClientsReportData } from "@/services/reports";

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
];

export function ClientsReport({
  startDate,
  endDate,
  period,
}: ClientsReportProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const reportData = await getClientsReportData(startDate, endDate, period);
      setData(reportData);
    } catch (error) {
      console.error("Error loading clients report:", error);
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

  return (
    <div className="space-y-6">
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
              />
              <Line
                type="monotone"
                dataKey="activeClients"
                stroke="#10b981"
                strokeWidth={2}
                name="Clientes Activos"
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
            <div className="space-y-3">
              {data.topClientsByRevenue.map((client: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
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
                    <p className="text-xs text-muted-foreground">
                      {client.percentage}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Client Distribution by Route */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Distribución por Ruta</CardTitle>
            <CardDescription>
              Clientes agrupados por ruta de entrega
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
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
                  {data.clientsByRoute.map((entry: any, index: number) => (
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
          </CardContent>
        </Card>
      </div>

      {/* Credit Analysis */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Análisis de Crédito</CardTitle>
          <CardDescription>
            Estado de créditos y cobranza por cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {data.creditStats.totalClientsWithCredit}
                </p>
                <p className="text-sm text-muted-foreground">
                  Clientes con crédito
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {formatCurrency(data.creditStats.totalCreditAmount)}
                </p>
                <p className="text-sm text-muted-foreground">Crédito total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {data.creditStats.averagePaymentDays} días
                </p>
                <p className="text-sm text-muted-foreground">
                  Plazo promedio de pago
                </p>
              </div>
            </div>

            {/* Top Debtors */}
            <div>
              <h4 className="text-sm font-medium mb-3">Principales Deudores</h4>
              <div className="space-y-2">
                {data.topDebtors.map((debtor: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
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
                radius={[8, 8, 0, 0]}
                name="Clientes"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
