"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useStackApp } from "@stackframe/stack";

export default function LoginPage() {
  const router = useRouter();
  const app = useStackApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isStaffLogin, setIsStaffLogin] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleAdminLogin = () => {
    // Redirect to Stack Auth login
    window.location.href = app.urls.signIn;
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Here you would implement staff authentication
      // For now, we'll use a simple check
      // In production, this should validate against your database

      if (formData.username && formData.password) {
        // Mock authentication
        toast.success("Inicio de sesión exitoso");
        router.push("/dashboard");
      } else {
        setError("Por favor completa todos los campos");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <CardTitle className="swiss-text-title">ERP Dashboard</CardTitle>
          <CardDescription>Sistema de Gestión de Pedidos</CardDescription>
        </CardHeader>
        <CardContent>
          {!isStaffLogin ? (
            <div className="space-y-4">
              <Button onClick={handleAdminLogin} className="w-full" size="lg">
                Iniciar sesión como Administrador
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    O
                  </span>
                </div>
              </div>
              <Button
                onClick={() => setIsStaffLogin(true)}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Iniciar sesión como Personal
              </Button>
            </div>
          ) : (
            <form onSubmit={handleStaffLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Iniciar sesión
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setIsStaffLogin(false)}
                  disabled={loading}
                >
                  Volver
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
