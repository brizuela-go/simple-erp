// app/dashboard/ajustes/page.tsx - Updated version
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, Shield, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StaffPermissions } from "@/components/staff/staff-permissions";
import { doc, getDoc } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { setDoc } from "firebase/firestore";

const COMPANY_SETTINGS_DOC = "settings/company";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("ERP Alatriste");

  useEffect(() => {
    loadCompanySettings();
  }, []);

  const loadCompanySettings = async () => {
    try {
      const docSnap = await getDoc(doc(db, COMPANY_SETTINGS_DOC));
      if (docSnap.exists()) {
        setCompanyName(docSnap.data().name || "ERP Alatriste");
      }
    } catch (error) {
      console.error("Error loading company settings:", error);
    }
  };

  const handleSaveCompanyName = async () => {
    setLoading(true);
    const toastId = toast.loading("Guardando configuración...");

    try {
      await setDoc(doc(db, COMPANY_SETTINGS_DOC), {
        name: companyName,
        updatedAt: new Date(),
      });

      toast.success("Nombre de empresa actualizado", { id: toastId });

      // Update in localStorage for immediate effect
      localStorage.setItem("companyName", companyName);

      // Trigger a custom event to update the sidebar
      window.dispatchEvent(new Event("companyNameChanged"));
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
              <div className="space-y-2">
                <Label htmlFor="companyName">Nombre de la empresa</Label>
                <div className="flex gap-2">
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nombre de tu empresa"
                  />
                  <Button onClick={handleSaveCompanyName} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 pt-4">
                <div className="space-y-2">
                  <Label>Zona horaria</Label>
                  <p className="text-sm text-muted-foreground">
                    América/Mexico_City (UTC-06:00)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <p className="text-sm text-muted-foreground">
                    Peso Mexicano (MXN)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Versión del sistema</Label>
                  <p className="text-sm text-muted-foreground">
                    v2.0.0 - Actualizado {new Date().toLocaleDateString()}
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
      </Tabs>
    </div>
  );
}
