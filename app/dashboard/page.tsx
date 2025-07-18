"use client";

import { useEffect, useState } from "react";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { DashboardStats } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { getDashboardStats } from "@/services/dashboard";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="swiss-text-title">Dashboard</h1>
          <p className="text-muted-foreground">Vista general del sistema</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="col-span-4 h-[400px]" />
          <Skeleton className="col-span-3 h-[400px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="swiss-text-title">Dashboard</h1>
        <p className="text-muted-foreground">Vista general del sistema</p>
      </div>

      {stats && <StatsCards stats={stats} />}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <RevenueChart />
        </div>
        <div className="col-span-3">
          <RecentOrders />
        </div>
      </div>
    </div>
  );
}
