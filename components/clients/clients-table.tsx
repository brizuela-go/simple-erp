"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Client } from "@/types";
import { subscribeToClients } from "@/services/clients";
import { formatCurrency, formatPhoneNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Search, MapPin, Phone } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

interface ClientTableProps {
  onEdit: (clientId: string) => void;
}

export function ClientTable({ onEdit }: ClientTableProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = subscribeToClients((updatedClients) => {
      setClients(updatedClients);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = clients;

    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone.includes(searchTerm) ||
          client.routes.some((route) =>
            route.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const columns = [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }: any) => {
        const client = row.original;
        return (
          <div>
            <p className="font-medium">{client.name}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {client.address}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Teléfono",
      cell: ({ row }: any) => (
        <Link
          href={`tel:${row.original.phone}`}
          className="flex items-center gap-3 hover:underline"
          title={`Llamar a ${row.original.name}`}
        >
          <Phone className="h-3 w-3 text-muted-foreground" />
          {formatPhoneNumber(row.original.phone)}
        </Link>
      ),
    },
    {
      accessorKey: "price",
      header: "Precio",
      cell: ({ row }: any) => formatCurrency(row.original.price),
    },
    {
      accessorKey: "hasCredit",
      header: "Crédito",
      cell: ({ row }: any) => (
        <Badge variant={row.original.hasCredit ? "default" : "secondary"}>
          {row.original.hasCredit ? "Sí" : "No"}
        </Badge>
      ),
    },
    {
      accessorKey: "routes",
      header: "Rutas",
      cell: ({ row }: any) => {
        const routes = row.original.routes || [];
        return (
          <div className="flex flex-wrap gap-1">
            {routes.slice(0, 2).map((route: string) => (
              <Badge key={route} variant="outline" className="text-xs">
                {route}
              </Badge>
            ))}
            {routes.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{routes.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "totalDebt",
      header: "Deuda Total",
      cell: ({ row }: any) => {
        const debt = row.original.totalDebt || 0;
        return debt > 0 ? (
          <span className="text-red-600 dark:text-red-400 font-medium">
            {formatCurrency(debt)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }: any) => {
        const client = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(client.id)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/clientes/${client.id}`)}
              >
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  // View orders
                  toast.info("Función no implementada");
                }}
              >
                Ver pedidos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  // Delete logic
                  toast.error("Función no implementada");
                }}
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, dirección, teléfono o ruta..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <DataTable columns={columns} data={filteredClients} loading={loading} />
    </div>
  );
}
