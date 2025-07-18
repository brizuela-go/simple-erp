"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Building,
  Shield,
  Bell,
  Database,
  Save,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StaffPermissions } from "@/components/staff/staff-permissions";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    companyName: "ERP Dashboard",
    notifications: {
      emailNotifications: true,
      orderAlerts: true,
      paymentReminders: true,
      dailyReports: false,
    },
    system: {
      autoBackup: true,
      maintenanceMode: false,
      debugMode: false,
    },
  });

  const handleSaveSettings = async () => {
    setLoading(true);
    const toastId = toast.loading("Guardando configuración...");

    try {
      // Here you would save settings to Firebase
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      toast.success("Configuración guardada exitosamente", { id: toastId });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Error al guardar configuración", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="swiss-text-title">Ajustes</h1>
        <p className="text-muted-foreground">
          Configuración del sistema y permisos
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="general" className="gap-2">
            <Building className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Shield className="h-4 w-4" />
            Permisos
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Database className="h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>
                Configuración básica del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Esta sección está en desarrollo. La configuración mostrada es
                  de ejemplo.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre de la empresa</Label>
                  <p className="text-sm text-muted-foreground">
                    {settings.companyName}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Zona horaria</Label>
                  <p className="text-sm text-muted-foreground">
                    América/Mexico_City (UTC-06:00)
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <p className="text-sm text-muted-foreground">
                    Peso Mexicano (MXN)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Permisos del Personal</CardTitle>
              <CardDescription>
                Gestiona los permisos de acceso para cada empleado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StaffPermissions />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>
                Configura las alertas y notificaciones del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">
                      Notificaciones por correo
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Recibir notificaciones importantes por email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          emailNotifications: checked,
                        },
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="order-alerts">Alertas de pedidos</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar cuando se creen nuevos pedidos
                    </p>
                  </div>
                  <Switch
                    id="order-alerts"
                    checked={settings.notifications.orderAlerts}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          orderAlerts: checked,
                        },
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="payment-reminders">
                      Recordatorios de pago
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Alertas automáticas para pagos pendientes
                    </p>
                  </div>
                  <Switch
                    id="payment-reminders"
                    checked={settings.notifications.paymentReminders}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          paymentReminders: checked,
                        },
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="daily-reports">Reportes diarios</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibir resumen diario de actividades
                    </p>
                  </div>
                  <Switch
                    id="daily-reports"
                    checked={settings.notifications.dailyReports}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          dailyReports: checked,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Configuración del Sistema</CardTitle>
              <CardDescription>
                Opciones avanzadas y mantenimiento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-backup">Respaldo automático</Label>
                    <p className="text-sm text-muted-foreground">
                      Realizar respaldos diarios de la base de datos
                    </p>
                  </div>
                  <Switch
                    id="auto-backup"
                    checked={settings.system.autoBackup}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        system: {
                          ...settings.system,
                          autoBackup: checked,
                        },
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenance-mode">Modo mantenimiento</Label>
                    <p className="text-sm text-muted-foreground">
                      Desactivar acceso temporal al sistema
                    </p>
                  </div>
                  <Switch
                    id="maintenance-mode"
                    checked={settings.system.maintenanceMode}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        system: {
                          ...settings.system,
                          maintenanceMode: checked,
                        },
                      })
                    }
                    disabled
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="debug-mode">Modo depuración</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar información adicional para desarrollo
                    </p>
                  </div>
                  <Switch
                    id="debug-mode"
                    checked={settings.system.debugMode}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        system: {
                          ...settings.system,
                          debugMode: checked,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          disabled={loading}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
