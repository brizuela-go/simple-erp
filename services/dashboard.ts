import {
  ordersCollection,
  query,
  where,
  getDocs,
  Timestamp,
} from "@/lib/firebase";
import { DashboardStats, OrderStatus } from "@/types";
import { startOfMonth, startOfDay, subMonths } from "date-fns";

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const today = startOfDay(new Date());
  const thisMonth = startOfMonth(new Date());

  // Get all orders
  const ordersSnapshot = await getDocs(ordersCollection);
  const orders = ordersSnapshot.docs.map((doc) => {
    const data = doc.data() as {
      status?: OrderStatus;
      total?: number;
      remainingDebt?: number;
      date?: Timestamp; // Firebase Timestamp
      clientId?: string;
      // add other fields as needed
    };
    return {
      ...data,
      id: doc.id,
    };
  });

  // Calculate stats
  let totalRevenue = 0;
  let pendingPayments = 0;
  let todayOrders = 0;
  let monthlyRevenue = 0;

  orders.forEach((order) => {
    // Total revenue (only liquidated orders)
    if (order.status === OrderStatus.LIQUIDADO) {
      totalRevenue += order.total || 0;
    }

    // Pending payments
    if (order.remainingDebt && order.remainingDebt > 0) {
      pendingPayments += order.remainingDebt;
    }

    // Today's orders
    const orderDate = order.date?.toDate ? order.date.toDate() : order.date;
    if (orderDate && orderDate >= today) {
      todayOrders++;
    }

    // Monthly revenue
    if (
      orderDate &&
      orderDate >= thisMonth &&
      order.status === OrderStatus.LIQUIDADO
    ) {
      monthlyRevenue += order.total || 0;
    }
  });

  // Get active clients (with orders in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activeClientsSet = new Set();
  orders.forEach((order) => {
    const orderDate = order.date?.toDate ? order.date.toDate() : order.date;
    if (orderDate && orderDate >= thirtyDaysAgo && order.clientId) {
      activeClientsSet.add(order.clientId);
    }
  });

  return {
    totalOrders: orders.length,
    totalRevenue,
    pendingPayments,
    activeClients: activeClientsSet.size,
    todayOrders,
    monthlyRevenue,
  };
};

export const getMonthlyRevenue = async () => {
  const months = [];
  const monthNames = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  // Get data for last 6 months
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(new Date(), i));
    const monthEnd = startOfMonth(subMonths(new Date(), i - 1));

    const q = query(
      ordersCollection,
      where("date", ">=", Timestamp.fromDate(monthStart)),
      where("date", "<", Timestamp.fromDate(monthEnd)),
      where("status", "==", OrderStatus.LIQUIDADO)
    );

    const snapshot = await getDocs(q);
    let monthTotal = 0;

    snapshot.forEach((doc) => {
      monthTotal += doc.data().total || 0;
    });

    months.push({
      month: monthNames[monthStart.getMonth()],
      total: monthTotal,
    });
  }

  return months;
};
