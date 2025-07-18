"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Staff } from "@/types";
import { subscribeToStaff } from "@/services/staff";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Search, UserCheck, DollarSign } from "lucide-react";
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

interface StaffTableProps {
  onEdit: (staffId: string) => void;
}

export function StaffTable({ onEdit }: StaffTableProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = subscribeToStaff((updatedStaff) => {
      setStaff(updatedStaff);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = staff;

    if (searchTerm) {
      filtered = filtered.filter(
        (member) =>
          `${member.firstName} ${member.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          member.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStaff(filtered);
  }, [staff, searchTerm]);

  const columns = [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }: any) => {
        const member = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{`${member.firstName} ${member.lastName}`}</p>
              <p className="text-sm text-muted-foreground">{member.position}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "salary",
      header: "Sueldo",
      cell: ({ row }: any) => formatCurrency(row.original.salary),
    },
    {
      accessorKey: "totalLoans",
      header: "Préstamos",
      cell: ({ row }: any) => {
        const loans = row.original.totalLoans || 0;
        return loans > 0 ? (
          <span className="text-orange-600 dark:text-orange-400 flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {formatCurrency(loans)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "username",
      header: "Usuario",
      cell: ({ row }: any) => row.original.username || "-",
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }: any) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }: any) => {
        const member = row.original;

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
              <DropdownMenuItem onClick={() => onEdit(member.id)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/personal/${member.id}`)}
              >
                Ver detalles
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
          placeholder="Buscar por nombre, puesto o usuario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <DataTable columns={columns} data={filteredStaff} loading={loading} />
    </div>
  );
}
