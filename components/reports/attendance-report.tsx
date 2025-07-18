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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getAttendanceReportData } from "@/services/reports";

interface AttendanceReportProps {
  startDate: Date;
  endDate: Date;
  period: "weekly" | "monthly" | "yearly";
}

const COLORS = {
  present: "#10b981",
  absent: "#ef4444",
  late: "#f59e0b",
  early: "#3b82f6",
};

export function AttendanceReport({
  startDate,
  endDate,
  period,
}: AttendanceReportProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const reportData = await getAttendanceReportData(
        startDate,
        endDate,
        period
      );
      setData(reportData);
    } catch (error) {
      console.error("Error loading attendance report:", error);
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
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Attendance Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Tasa de Asistencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.overview.attendanceRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio del período
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Faltas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.overview.totalAbsences}
            </div>
            <p className="text-xs text-muted-foreground">
              Sin justificar: {data.overview.unjustifiedAbsences}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Llegadas Tarde
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {data.overview.lateArrivals}
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio: {data.overview.averageLateMinutes} min
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Horas Trabajadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.totalHoursWorked}h
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio: {data.overview.averageHoursPerDay}h/día
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Attendance Pattern */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Patrón de Asistencia</CardTitle>
          <CardDescription>
            Tendencia de asistencia en el período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data.dailyAttendance}>
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  format(new Date(value), "d MMM", { locale: es })
                }
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                content={<CustomTooltip />}
                labelFormatter={(value) =>
                  format(new Date(value), "dd/MM/yyyy", { locale: es })
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="attendanceRate"
                stroke="#10b981"
                strokeWidth={2}
                name="Tasa de Asistencia"
              />
              <Line
                type="monotone"
                dataKey="averageAttendance"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Promedio"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* By Employee */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Asistencia por Empleado</CardTitle>
            <CardDescription>Resumen individual del período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.byEmployee.map((employee: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{employee.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {employee.position}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {employee.attendanceRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {employee.daysWorked}/{employee.totalDays} días
                      </p>
                    </div>
                    <Badge
                      variant={
                        employee.attendanceRate >= 95
                          ? "default"
                          : employee.attendanceRate >= 85
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {employee.attendanceRate >= 95
                        ? "Excelente"
                        : employee.attendanceRate >= 85
                        ? "Regular"
                        : "Bajo"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Day of Week */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Asistencia por Día de la Semana</CardTitle>
            <CardDescription>Patrones de asistencia semanal</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.byDayOfWeek}>
                <XAxis
                  dataKey="day"
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
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="attendanceRate"
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                  name="Asistencia"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Punctuality Analysis */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Análisis de Puntualidad</CardTitle>
          <CardDescription>Distribución de horarios de entrada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.punctualityDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.punctualityDistribution.map(
                      (
                        entry: { category: keyof typeof COLORS },
                        index: number
                      ) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[entry.category]}
                        />
                      )
                    )}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Resumen de Puntualidad</h4>
              {data.punctualityDistribution.map(
                (item: {
                  category: keyof typeof COLORS;
                  name: string;
                  value: number;
                }) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[item.category] }}
                      />
                      <span className="text-sm capitalize">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {item.value} registros
                    </span>
                  </div>
                )
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Hora promedio de entrada:{" "}
                  <span className="font-medium text-foreground">
                    {data.overview.averageCheckInTime}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Hora promedio de salida:{" "}
                  <span className="font-medium text-foreground">
                    {data.overview.averageCheckOutTime}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
