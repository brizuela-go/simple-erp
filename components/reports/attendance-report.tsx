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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getAttendanceReportData } from "@/services/reports";
import {
  RefreshCw,
  AlertTriangle,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

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

interface AttendanceData {
  overview: {
    attendanceRate: number;
    totalAbsences: number;
    unjustifiedAbsences: number;
    lateArrivals: number;
    averageLateMinutes: number;
    totalHoursWorked: number;
    averageHoursPerDay: number;
    averageCheckInTime: string;
    averageCheckOutTime: string;
  };
  dailyAttendance: Array<{
    date: string;
    attendanceRate: number;
    averageAttendance: number;
  }>;
  byEmployee: Array<{
    name: string;
    position: string;
    attendanceRate: number;
    daysWorked: number;
    totalDays: number;
  }>;
  byDayOfWeek: Array<{
    day: string;
    attendanceRate: number;
  }>;
  punctualityDistribution: Array<{
    category: keyof typeof COLORS;
    name: string;
    value: number;
  }>;
}

export function AttendanceReport({
  startDate,
  endDate,
  period,
}: AttendanceReportProps) {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const reportData = await getAttendanceReportData(
        startDate,
        endDate,
        period
      );
      setData(reportData as AttendanceData);
    } catch (error) {
      console.error("Error loading attendance report:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al cargar los datos de asistencia";
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
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No hay datos de asistencia para este período
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
              {entry.name.includes("%") || entry.dataKey.includes("Rate")
                ? `${entry.value}%`
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getAttendanceBadge = (rate: number) => {
    if (rate >= 95) return { variant: "default" as const, label: "Excelente" };
    if (rate >= 85) return { variant: "secondary" as const, label: "Bueno" };
    if (rate >= 70) return { variant: "outline" as const, label: "Regular" };
    return { variant: "destructive" as const, label: "Bajo" };
  };

  return (
    <div className="space-y-6">
      {/* Attendance Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Tasa de Asistencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                data.overview.attendanceRate >= 90
                  ? "text-green-600"
                  : data.overview.attendanceRate >= 80
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {data.overview.attendanceRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio del período
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
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
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
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
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
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
          <CardTitle>Patrón de Asistencia Diaria</CardTitle>
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
                domain={[0, 100]}
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
                dot={{ fill: "#10b981", strokeWidth: 2, r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="averageAttendance"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Promedio"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* By Employee */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Asistencia por Empleado
            </CardTitle>
            <CardDescription>Resumen individual del período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.byEmployee.map((employee, index) => {
                const badge = getAttendanceBadge(employee.attendanceRate);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex-1">
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
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                  </div>
                );
              })}
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
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="attendanceRate"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="Asistencia"
                />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Día con mejor asistencia:{" "}
                <span className="font-medium">
                  {
                    data.byDayOfWeek.reduce((max, day) =>
                      day.attendanceRate > max.attendanceRate ? day : max
                    ).day
                  }{" "}
                  (
                  {
                    data.byDayOfWeek.reduce((max, day) =>
                      day.attendanceRate > max.attendanceRate ? day : max
                    ).attendanceRate
                  }
                  %)
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Punctuality Analysis */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Análisis de Puntualidad</CardTitle>
          <CardDescription>
            Distribución de horarios de entrada y salida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium mb-4">
                Distribución de Puntualidad
              </h4>
              <ResponsiveContainer width="100%" height={250}>
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
                    {data.punctualityDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[entry.category]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Resumen de Puntualidad</h4>

              <div className="space-y-3">
                {data.punctualityDistribution.map((item) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[item.category] }}
                      />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {item.value} registros
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Hora promedio de entrada:
                  </span>
                  <span className="text-sm font-medium">
                    {data.overview.averageCheckInTime}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Hora promedio de salida:
                  </span>
                  <span className="text-sm font-medium">
                    {data.overview.averageCheckOutTime}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Retraso promedio:
                  </span>
                  <span className="text-sm font-medium">
                    {data.overview.averageLateMinutes} minutos
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recomendaciones</CardTitle>
          <CardDescription>
            Sugerencias para mejorar la asistencia y puntualidad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.overview.attendanceRate < 90 && (
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Mejorar asistencia general
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  La asistencia está por debajo del 90%. Considere implementar
                  incentivos o revisar políticas de asistencia.
                </p>
              </div>
            )}

            {data.overview.lateArrivals >
              data.overview.totalHoursWorked * 0.1 && (
              <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border-l-4 border-orange-500">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Reducir llegadas tarde
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  Alto número de llegadas tarde. Revise horarios de transporte o
                  implemente flexibilidad en horarios.
                </p>
              </div>
            )}

            {data.overview.attendanceRate >= 95 && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Excelente desempeño
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  El equipo mantiene una asistencia excelente. Considere
                  reconocer este logro.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
