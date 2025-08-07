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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Search,
  Calendar,
  Trash2,
  Eye,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  deleteReport,
  downloadReport,
  getReportHistory,
} from "@/services/reports";

interface Report {
  id: string;
  fileName: string;
  period: string;
  type: string;
  createdAt: Date;
  size: number;
  url: string;
}

export function ReportHistory() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    const filtered = reports.filter(
      (report) =>
        report.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.period.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredReports(filtered);
  }, [reports, searchTerm]);

  const loadReports = async (showRefreshingIndicator = false) => {
    if (showRefreshingIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getReportHistory();
      setReports(data);

      if (showRefreshingIndicator) {
        toast.success("Lista de reportes actualizada");
      }
    } catch (error) {
      console.error("Error loading reports:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al cargar historial de reportes";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadReports(true);
  };

  const handleDownload = async (report: Report) => {
    setDownloading(report.id);
    const toastId = toast.loading(`Descargando ${report.fileName}...`);

    try {
      await downloadReport(report.url, report.fileName);
      toast.success("Reporte descargado exitosamente", { id: toastId });
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Error al descargar reporte", { id: toastId });
    } finally {
      setDownloading(null);
    }
  };

  const handleView = (report: Report) => {
    try {
      window.open(report.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error opening report:", error);
      toast.error("Error al abrir el reporte");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const toastId = toast.loading("Eliminando reporte...");
    try {
      await deleteReport(deleteId);
      setReports(reports.filter((r) => r.id !== deleteId));
      toast.success("Reporte eliminado exitosamente", { id: toastId });
    } catch (error) {
      console.error("Error deleting report:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error al eliminar reporte";
      toast.error(errorMessage, { id: toastId });
    } finally {
      setDeleteId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getPeriodBadge = (period: string) => {
    const variants: Record<
      string,
      { label: string; variant: "default" | "secondary" | "outline" }
    > = {
      weekly: { label: "Semanal", variant: "secondary" },
      monthly: { label: "Mensual", variant: "default" },
      yearly: { label: "Anual", variant: "outline" },
      unknown: { label: "General", variant: "outline" },
    };

    const config = variants[period] || { label: period, variant: "default" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-20" />
      ))}
    </div>
  );

  const ErrorState = () => (
    <div className="text-center py-12">
      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground mb-4">{error}</p>
      <Button onClick={() => loadReports()} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Reintentar
      </Button>
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-12">
      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground">
        {searchTerm
          ? "No se encontraron reportes que coincidan con la búsqueda"
          : "No hay reportes generados"}
      </p>
      {searchTerm && (
        <Button
          onClick={() => setSearchTerm("")}
          variant="outline"
          className="mt-4"
        >
          Limpiar búsqueda
        </Button>
      )}
    </div>
  );

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Historial de Reportes
                {refreshing && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
              <CardDescription>
                {reports.length > 0
                  ? `${reports.length} reporte${
                      reports.length !== 1 ? "s" : ""
                    } generado${reports.length !== 1 ? "s" : ""}`
                  : "Reportes generados anteriormente"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar reportes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="icon"
                disabled={refreshing}
                title="Actualizar lista"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorState />
          ) : filteredReports.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p
                        className="font-medium truncate max-w-[300px]"
                        title={report.fileName}
                      >
                        {report.fileName}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDate(report.createdAt, "dd/MM/yyyy HH:mm")}
                        </span>
                        <span>•</span>
                        <span>{formatFileSize(report.size)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getPeriodBadge(report.period)}

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleView(report)}
                        title="Ver reporte"
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDownload(report)}
                        disabled={downloading === report.id}
                        title="Descargar reporte"
                        className="h-8 w-8"
                      >
                        {downloading === report.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteId(report.id)}
                        title="Eliminar reporte"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El reporte será eliminado
              permanentemente del almacenamiento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
