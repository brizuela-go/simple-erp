"use client";

import { useUser } from "@stackframe/stack";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  UserCheck,
  Clock,
  CreditCard,
  Settings,
  LogOut,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import SidebarLayout, { SidebarItem } from "@/components/layout/sidebar-layout";

const navigationItems: SidebarItem[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    type: "item",
  },
  {
    type: "separator",
  },
  {
    type: "label",
    name: "Gestión",
  },
  {
    name: "Pedidos",
    href: "/pedidos",
    icon: ShoppingCart,
    type: "item",
  },
  {
    name: "Clientes",
    href: "/clientes",
    icon: Users,
    type: "item",
  },
  {
    type: "separator",
  },
  {
    type: "label",
    name: "Personal",
  },
  {
    name: "Personal",
    href: "/personal",
    icon: UserCheck,
    type: "item",
  },
  {
    name: "Asistencia",
    href: "/asistencia",
    icon: Clock,
    type: "item",
  },
  {
    type: "separator",
  },
  {
    type: "label",
    name: "Finanzas",
  },
  {
    name: "Cobranza",
    href: "/cobranza",
    icon: CreditCard,
    type: "item",
  },
  {
    type: "separator",
  },
  {
    type: "label",
    name: "Análisis",
  },
  {
    name: "Reportes",
    href: "/reportes",
    icon: FileText,
    type: "item",
  },
  {
    type: "separator",
  },
  {
    name: "Ajustes",
    href: "/ajustes",
    icon: Settings,
    type: "item",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useUser({ or: "redirect" });
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>("staff");

  useEffect(() => {
    // Get user role from custom claims or database
    const getUserRole = async () => {
      if (user) {
        // Here you would fetch the user's role from Firestore or custom claims
        // For now, we'll use a placeholder
        setUserRole("admin"); // or 'staff'
      }
    };
    getUserRole();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
      toast.success("Sesión cerrada exitosamente");
    } catch (error) {
      toast.error("Error al cerrar sesión");
    }
  };

  // Filter navigation items based on user role
  const filteredItems = navigationItems.filter((item) => {
    if (userRole === "staff") {
      // Staff can't access settings
      if (item.type === "item" && item.href === "/ajustes") {
        return false;
      }
    }
    return true;
  });

  return (
    <SidebarLayout
      items={filteredItems}
      basePath="/dashboard"
      sidebarTop={
        <div className="flex items-center justify-between w-full px-2">
          <div>
            <h2 className="text-lg font-semibold">ERP Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              {user?.displayName || user?.primaryEmail}
            </p>
          </div>
        </div>
      }
      sidebarBottom={
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      }
    >
      <div className="p-6 lg:p-8">{children}</div>
    </SidebarLayout>
  );
}
