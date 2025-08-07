// components/clients/client-details.tsx
import { Client } from "@/types";
import { formatCurrency, formatDate, formatPhoneNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Phone,
  CreditCard,
  Route,
  DollarSign,
  Calendar,
} from "lucide-react";

interface ClientDetailsProps {
  client: Client;
}

export function ClientDetails({ client }: ClientDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{client.name}</h2>
        <p className="text-sm text-muted-foreground">
          Cliente desde{" "}
          {client.createdAt ? formatDate(client.createdAt) : "N/A"}
        </p>
      </div>

      <Separator />

      {/* Contact Info */}
      <div className="space-y-4">
        <h3 className="font-semibold">Información de Contacto</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Dirección</p>
              <p className="text-sm text-muted-foreground">{client.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Teléfono</p>
              <a
                href={`tel:${client.phone}`}
                className="text-sm text-primary hover:underline"
              >
                {formatPhoneNumber(client.phone)}
              </a>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Financial Info */}
      <div className="space-y-4">
        <h3 className="font-semibold">Información Financiera</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Precio Especial
            </p>
            <p className="text-lg font-medium">
              {client.price > 0
                ? formatCurrency(client.price)
                : "Precio estándar"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              Crédito
            </p>
            <Badge variant={client.hasCredit ? "default" : "secondary"}>
              {client.hasCredit ? "Habilitado" : "No habilitado"}
            </Badge>
          </div>
          {client.totalDebt && client.totalDebt > 0 && (
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Deuda Total</p>
              <p className="text-lg font-medium text-red-600">
                {formatCurrency(client.totalDebt)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Routes */}
      {client.routes && client.routes.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Route className="h-4 w-4" />
              Rutas Asignadas
            </h3>
            <div className="flex flex-wrap gap-2">
              {client.routes.map((route) => (
                <Badge key={route} variant="outline">
                  {route}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
