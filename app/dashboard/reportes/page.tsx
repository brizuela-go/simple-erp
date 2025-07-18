"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AttendanceReport } from "@/components/reports/attendance-report";
import { OrdersReport } from "@/components/reports/orders-report";
import { ClientsReport } from "@/components/reports/clients-report";
import { SummaryReport } from "@/components/reports/summary-report";
import { ReportHistory } from "@/components/reports/report-history";
import {
  Calendar,
  Download,
  FileText,
  Loader2,
  TrendingUp,
  Users,
  ShoppingCart,
  Clock,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subWeeks,
  subMonths,
  subYears,
} from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { generateFullReport, saveReportToStorage } from "@/services/reports";

type ReportPeriod = "weekly" | "monthly" | "yearly" | "custom";

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");

  const getDateRange = () => {
    switch (period) {
      case "weekly":
        return {
          start: startOfWeek(selectedDate, { locale: es }),
          end: endOfWeek(selectedDate, { locale: es }),
        };
      case "monthly":
        return {
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate),
        };
      case "yearly":
        return {
          start: startOfYear(selectedDate),
          end: endOfYear(selectedDate),
        };
      default:
        return {
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate),
        };
    }
  };

  const handlePreviousPeriod = () => {
    switch (period) {
      case "weekly":
        setSelectedDate(subWeeks(selectedDate, 1));
        break;
      case "monthly":
        setSelectedDate(subMonths(selectedDate, 1));
        break;
      case "yearly":
        setSelectedDate(subYears(selectedDate, 1));
        break;
    }
  };

  const handleNextPeriod = () => {
    switch (period) {
      case "weekly":
        setSelectedDate(subWeeks(selectedDate, -1));
        break;
      case "monthly":
        setSelectedDate(subMonths(selectedDate, -1));
        break;
      case "yearly":
        setSelectedDate(subYears(selectedDate, -1));
        break;
    }
  };

  const getPeriodLabel = () => {
    const { start, end } = getDateRange();
    switch (period) {
      case "weekly":
        return `${format(start, "d MMM", { locale: es })} - ${format(
          end,
          "d MMM yyyy",
          { locale: es }
        )}`;
      case "monthly":
        return format(selectedDate, "MMMM yyyy", { locale: es });
      case "yearly":
        return format(selectedDate, "yyyy");
      default:
        return "";
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    const toastId = toast.loading("Generando reporte...");

    try {
      const { start, end } = getDateRange();
      const reportData = await generateFullReport(start, end, period);

      // Save to Firebase Storage
      const fileName = `reporte_${period}_${format(
        selectedDate,
        "yyyy-MM-dd"
      )}.pdf`;
      await saveReportToStorage(reportData, fileName);

      toast.success("Reporte generado y guardado exitosamente", {
        id: toastId,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Error al generar el reporte", { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const dateRange = getDateRange();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="swiss-text-title">Reportes</h1>
          <p className="text-muted-foreground">
            Análisis detallado del negocio
          </p>
        </div>
        <Button onClick={handleGenerateReport} disabled={generating}>
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generar PDF
            </>
          )}
        </Button>
      </div>

      {/* Period Selector */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <Select
                value={period}
                onValueChange={(v) => setPeriod(v as ReportPeriod)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousPeriod}
              >
                ←
              </Button>
              <div className="min-w-[200px] text-center font-medium">
                {getPeriodLabel()}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextPeriod}
                disabled={selectedDate >= new Date()}
              >
                →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass">
          <TabsTrigger value="summary" className="gap-2">
            <FileText className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <Clock className="h-4 w-4" />
            Asistencia
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6">
          <SummaryReport
            startDate={dateRange.start}
            endDate={dateRange.end}
            period={period === "custom" ? "monthly" : period}
          />
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <OrdersReport
            startDate={dateRange.start}
            endDate={dateRange.end}
            period={period === "custom" ? "monthly" : period}
          />
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          <ClientsReport
            startDate={dateRange.start}
            endDate={dateRange.end}
            period={period === "custom" ? "monthly" : period}
          />
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <AttendanceReport
            startDate={dateRange.start}
            endDate={dateRange.end}
            period={period === "custom" ? "monthly" : period}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <ReportHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
