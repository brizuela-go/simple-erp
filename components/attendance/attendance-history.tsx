"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Download, FileText } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { getAttendanceByDateRange } from "@/services/attendance";
import { getStaff } from "@/services/staff";
import { Attendance, Staff } from "@/types";
import { formatDate, formatRelativeTime, cn } from "@/lib/utils";
import { toast } from "sonner";
import { generateReportPDF } from "@/lib/pdf-generator";
import { Calendar } from "../ui/calendar";

export function AttendanceHistory() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  useEffect(() => {
    loadData();
  }, [dateRange, selectedStaff]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [attendanceData, staffData] = await Promise.all([
        getAttendanceByDateRange(dateRange.from, dateRange.to),
        getStaff(),
      ]);

      // Filter by selected staff if needed
      const filteredAttendance =
        selectedStaff === "all"
          ? attendanceData
          : attendanceData.filter((a) => a.staffId === selectedStaff);

      setAttendance(filteredAttendance);
      setStaff(staffData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error al cargar historial");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById("attendance-table");
    if (!element) return;

    const title = `Reporte de Asistencia - ${format(
      dateRange.from,
      "MMM yyyy",
      { locale: es }
    )}`;
    await generateReportPDF(title, element);
    toast.success("Reporte generado exitosamente");
  };

  const columns = [
    {
      accessorKey: "date",
      header: "Fecha",
      cell: ({ row }: any) => formatDate(row.original.date, "EEEE, d MMM"),
    },
    {
      accessorKey: "staffName",
      header: "Empleado",
      cell: ({ row }: any) => {
        const attendance = row.original;
        const staffMember = staff.find((s) => s.id === attendance.staffId);
        return (
          <div>
            <p className="font-medium">{attendance.staffName || "N/A"}</p>
            {staffMember && (
              <p className="text-sm text-muted-foreground">
                {staffMember.position}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "checkIn",
      header: "Entrada",
      cell: ({ row }: any) => {
        const checkIn = row.original.checkIn;
        return (
          <div>
            <p className="font-medium">{format(checkIn.toDate(), "HH:mm")}</p>
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(checkIn)}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "checkOut",
      header: "Salida",
      cell: ({ row }: any) => {
        const checkOut = row.original.checkOut;
        if (!checkOut) {
          return <Badge variant="secondary">Sin marcar</Badge>;
        }
        return (
          <div>
            <p className="font-medium">{format(checkOut.toDate(), "HH:mm")}</p>
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(checkOut)}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "duration",
      header: "Duración",
      cell: ({ row }: any) => {
        const { checkIn, checkOut } = row.original;
        if (!checkOut) return "-";

        const durationMs = checkOut.toDate() - checkIn.toDate();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor(
          (durationMs % (1000 * 60 * 60)) / (1000 * 60)
        );

        return (
          <Badge variant="outline">
            {hours}h {minutes}m
          </Badge>
        );
      },
    },
  ];

  const quickFilters = [
    { label: "Este mes", value: "thisMonth" },
    { label: "Mes pasado", value: "lastMonth" },
    { label: "Últimos 7 días", value: "last7Days" },
    { label: "Últimos 30 días", value: "last30Days" },
  ];

  const handleQuickFilter = (value: string) => {
    const now = new Date();
    let from: Date;
    let to: Date = now;

    switch (value) {
      case "thisMonth":
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case "lastMonth":
        from = startOfMonth(subMonths(now, 1));
        to = endOfMonth(subMonths(now, 1));
        break;
      case "last7Days":
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "last30Days":
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return;
    }

    setDateRange({ from, to });
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Historial de Asistencia</CardTitle>
              <CardDescription>
                Registro detallado de entradas y salidas
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filtrar por empleado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los empleados</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id!}>
                      {member.firstName} {member.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[240px] justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "d MMM", { locale: es })} -{" "}
                          {format(dateRange.to, "d MMM yyyy", { locale: es })}
                        </>
                      ) : (
                        format(dateRange.from, "d MMM yyyy", { locale: es })
                      )
                    ) : (
                      <span>Seleccionar fechas</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range: any) => {
                      if (range?.from && range?.to) {
                        setDateRange(range);
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Quick filters */}
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter) => (
                <Button
                  key={filter.value}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>

            {/* Table */}
            <div id="attendance-table">
              <DataTable
                columns={columns}
                data={attendance}
                loading={loading}
              />
            </div>

            {/* Summary */}
            {!loading && attendance.length > 0 && (
              <Card className="glass">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{attendance.length}</p>
                      <p className="text-sm text-muted-foreground">
                        Registros totales
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {attendance.filter((a) => a.checkOut).length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Jornadas completas
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {attendance.filter((a) => !a.checkOut).length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Sin salida
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {new Set(attendance.map((a) => a.staffId)).size}
                      </p>
                      <p className="text-sm text-muted-foreground">Empleados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
