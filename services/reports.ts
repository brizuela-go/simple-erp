import {
  ordersCollection,
  clientsCollection,
  staffCollection,
  attendanceCollection,
  paymentsCollection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  db,
} from "@/lib/firebase";
import { storage } from "@/lib/firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject,
} from "firebase/storage";
import { Order, OrderStatus, Client, Staff, Attendance } from "@/types";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  differenceInDays,
  differenceInHours,
} from "date-fns";
import { es } from "date-fns/locale";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Get summary report data
export const getReportSummary = async (startDate: Date, endDate: Date) => {
  // Get orders data
  const ordersQuery = query(
    ordersCollection,
    where("date", ">=", Timestamp.fromDate(startDate)),
    where("date", "<=", Timestamp.fromDate(endDate))
  );
  const ordersSnapshot = await getDocs(ordersQuery);
  const orders = ordersSnapshot.docs.map(
    (doc) => ({ ...doc.data(), id: doc.id } as Order)
  );

  // Calculate revenue
  const totalRevenue = orders
    .filter((o) => o.status === OrderStatus.LIQUIDADO)
    .reduce((sum, o) => sum + o.total, 0);

  const pendingPayments = orders
    .filter((o) => o.remainingDebt && o.remainingDebt > 0)
    .reduce((sum, o) => sum + (o.remainingDebt || 0), 0);

  // Get active clients
  const activeClientsSet = new Set(orders.map((o) => o.clientId));

  // Get attendance data
  const attendanceQuery = query(
    attendanceCollection,
    where("date", ">=", format(startDate, "yyyy-MM-dd")),
    where("date", "<=", format(endDate, "yyyy-MM-dd"))
  );
  const attendanceSnapshot = await getDocs(attendanceQuery);
  const staffSnapshot = await getDocs(staffCollection);
  const totalStaff = staffSnapshot.size;
  const workDays = differenceInDays(endDate, startDate) + 1;
  const expectedAttendance = totalStaff * workDays;
  const actualAttendance = attendanceSnapshot.size;
  const averageAttendance = Math.round(
    (actualAttendance / expectedAttendance) * 100
  );

  // Get top client
  const clientRevenue = new Map<string, number>();
  orders.forEach((order) => {
    if (order.status === OrderStatus.LIQUIDADO) {
      const current = clientRevenue.get(order.clientId) || 0;
      clientRevenue.set(order.clientId, current + order.total);
    }
  });

  let topClient = null;
  if (clientRevenue.size > 0) {
    const [clientId, revenue] = Array.from(clientRevenue.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const clientDoc = await getDocs(
      query(clientsCollection, where("__name__", "==", clientId))
    );
    if (!clientDoc.empty) {
      const client = clientDoc.docs[0].data() as Client;
      topClient = {
        name: client.name,
        revenue,
        percentage: Math.round((revenue / totalRevenue) * 100),
      };
    }
  }

  // Calculate changes (mock data for now)
  const revenueChange = 12.5;
  const ordersChange = 8.3;
  const clientsChange = 5.0;
  const attendanceChange = -2.1;

  return {
    totalRevenue,
    totalOrders: orders.length,
    activeClients: activeClientsSet.size,
    averageAttendance,
    pendingPayments,
    revenueChange,
    ordersChange,
    clientsChange,
    attendanceChange,
    topClient,
    salesTarget: totalRevenue * 1.2, // Mock target
    collectionRate: Math.round(
      ((totalRevenue - pendingPayments) / totalRevenue) * 100
    ),
    staffUtilization: 85, // Mock data
    topProducts: [], // Could be implemented with product tracking
  };
};

// Get orders report data
export const getOrdersReportData = async (
  startDate: Date,
  endDate: Date,
  period: string
) => {
  const ordersQuery = query(
    ordersCollection,
    where("date", ">=", Timestamp.fromDate(startDate)),
    where("date", "<=", Timestamp.fromDate(endDate)),
    orderBy("date", "asc")
  );

  const ordersSnapshot = await getDocs(ordersQuery);
  const orders = ordersSnapshot.docs.map(
    (doc) => ({ ...doc.data(), id: doc.id } as Order)
  );

  // Group orders by period
  const ordersOverTime: any[] = [];
  const periodFormat =
    period === "weekly" ? "EEEE" : period === "monthly" ? "w" : "MMM";

  const groupedOrders = new Map<string, Order[]>();
  orders.forEach((order) => {
    const date =
      order.date instanceof Timestamp ? order.date.toDate() : order.date;
    const key = format(date, periodFormat, { locale: es });
    if (!groupedOrders.has(key)) {
      groupedOrders.set(key, []);
    }
    groupedOrders.get(key)!.push(order);
  });

  groupedOrders.forEach((orders, period) => {
    ordersOverTime.push({
      period,
      count: orders.length,
      total: orders.reduce((sum, o) => sum + o.total, 0),
    });
  });

  // Status distribution
  const statusCounts = new Map<OrderStatus, number>();
  const statusTotals = new Map<OrderStatus, number>();

  orders.forEach((order) => {
    statusCounts.set(order.status, (statusCounts.get(order.status) || 0) + 1);
    statusTotals.set(
      order.status,
      (statusTotals.get(order.status) || 0) + order.total
    );
  });

  const statusDistribution = Array.from(statusCounts.entries()).map(
    ([status, count]) => ({
      status,
      name: status,
      value: count,
      total: statusTotals.get(status) || 0,
    })
  );

  // Top clients by orders
  const clientOrders = new Map<string, { count: number; total: number }>();
  for (const order of orders) {
    const current = clientOrders.get(order.clientId) || { count: 0, total: 0 };
    clientOrders.set(order.clientId, {
      count: current.count + 1,
      total: current.total + order.total,
    });
  }

  const topClientsData = await Promise.all(
    Array.from(clientOrders.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(async ([clientId, data]) => {
        const clientDoc = await getDocs(
          query(clientsCollection, where("__name__", "==", clientId))
        );
        const clientName = clientDoc.empty
          ? "Cliente Desconocido"
          : clientDoc.docs[0].data().name;
        return {
          name: clientName,
          orders: data.count,
          total: data.total,
        };
      })
  );

  // Average order value over time
  const averageOrderValue = ordersOverTime.map((period) => ({
    period: period.period,
    average: period.count > 0 ? period.total / period.count : 0,
  }));

  return {
    ordersOverTime,
    statusDistribution,
    topClientsByOrders: topClientsData,
    averageOrderValue,
  };
};

// Get clients report data
export const getClientsReportData = async (
  startDate: Date,
  endDate: Date,
  period: string
) => {
  // Get all clients
  const clientsSnapshot = await getDocs(clientsCollection);
  const clients = clientsSnapshot.docs.map(
    (doc) => ({ ...doc.data(), id: doc.id } as Client)
  );

  // Get orders for the period
  const ordersQuery = query(
    ordersCollection,
    where("date", ">=", Timestamp.fromDate(startDate)),
    where("date", "<=", Timestamp.fromDate(endDate))
  );
  const ordersSnapshot = await getDocs(ordersQuery);
  const orders = ordersSnapshot.docs.map(
    (doc) => ({ ...doc.data(), id: doc.id } as Order)
  );

  // Client growth (mock data for demonstration)
  const days = differenceInDays(endDate, startDate);
  const clientGrowth = [];
  for (
    let i = 0;
    i <= days;
    i += period === "weekly" ? 1 : period === "monthly" ? 7 : 30
  ) {
    clientGrowth.push({
      period: format(
        new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
        "d MMM",
        { locale: es }
      ),
      newClients: Math.floor(Math.random() * 5) + 1,
      activeClients: Math.floor(Math.random() * 20) + 30,
    });
  }

  // Top clients by revenue
  const clientRevenue = new Map<string, { revenue: number; orders: number }>();
  orders.forEach((order) => {
    if (order.status === OrderStatus.LIQUIDADO) {
      const current = clientRevenue.get(order.clientId) || {
        revenue: 0,
        orders: 0,
      };
      clientRevenue.set(order.clientId, {
        revenue: current.revenue + order.total,
        orders: current.orders + 1,
      });
    }
  });

  const totalRevenue = Array.from(clientRevenue.values()).reduce(
    (sum, c) => sum + c.revenue,
    0
  );

  const topClientsByRevenue = await Promise.all(
    Array.from(clientRevenue.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10)
      .map(async ([clientId, data]) => {
        const client = clients.find((c) => c.id === clientId);
        return {
          name: client?.name || "Cliente Desconocido",
          revenue: data.revenue,
          orders: data.orders,
          percentage: ((data.revenue / totalRevenue) * 100).toFixed(1),
        };
      })
  );

  // Clients by route
  const routeCounts = new Map<string, number>();
  clients.forEach((client) => {
    client.routes.forEach((route) => {
      routeCounts.set(route, (routeCounts.get(route) || 0) + 1);
    });
  });

  const clientsByRoute = Array.from(routeCounts.entries()).map(
    ([route, count]) => ({
      name: route,
      value: count,
    })
  );

  // Credit analysis
  const creditClients = clients.filter((c) => c.hasCredit);
  const creditOrders = orders.filter(
    (o) => o.isCredit && o.remainingDebt && o.remainingDebt > 0
  );

  const topDebtors = creditOrders
    .reduce((acc: any[], order) => {
      const existing = acc.find((d) => d.clientId === order.clientId);
      if (existing) {
        existing.totalDebt += order.remainingDebt || 0;
        existing.overdueOrders++;
      } else {
        const client = clients.find((c) => c.id === order.clientId);
        acc.push({
          clientId: order.clientId,
          name: client?.name || "Cliente Desconocido",
          totalDebt: order.remainingDebt || 0,
          overdueOrders: 1,
          daysPastDue: Math.floor(Math.random() * 30) + 1, // Mock data
        });
      }
      return acc;
    }, [])
    .sort((a, b) => b.totalDebt - a.totalDebt)
    .slice(0, 5);

  // Retention data (mock)
  const retentionData = [
    { segment: "Nuevos", count: 15 },
    { segment: "Ocasionales", count: 25 },
    { segment: "Frecuentes", count: 40 },
    { segment: "VIP", count: 20 },
  ];

  return {
    clientGrowth,
    topClientsByRevenue,
    clientsByRoute,
    creditStats: {
      totalClientsWithCredit: creditClients.length,
      totalCreditAmount: creditOrders.reduce(
        (sum, o) => sum + (o.remainingDebt || 0),
        0
      ),
      averagePaymentDays: 15, // Mock data
    },
    topDebtors,
    retentionData,
  };
};

// Get attendance report data
export const getAttendanceReportData = async (
  startDate: Date,
  endDate: Date,
  period: string
) => {
  // Get staff
  const staffSnapshot = await getDocs(staffCollection);
  const staff = staffSnapshot.docs.map(
    (doc) => ({ ...doc.data(), id: doc.id } as Staff)
  );

  // Get attendance records
  const attendanceQuery = query(
    attendanceCollection,
    where("date", ">=", format(startDate, "yyyy-MM-dd")),
    where("date", "<=", format(endDate, "yyyy-MM-dd")),
    orderBy("date", "asc")
  );
  const attendanceSnapshot = await getDocs(attendanceQuery);
  const attendance = attendanceSnapshot.docs.map(
    (doc) => ({ ...doc.data(), id: doc.id } as Attendance)
  );

  // Calculate overview stats
  const workDays = differenceInDays(endDate, startDate) + 1;
  const expectedAttendance = staff.length * workDays;
  const actualAttendance = attendance.length;
  const attendanceRate = Math.round(
    (actualAttendance / expectedAttendance) * 100
  );

  // Calculate other metrics
  let totalHoursWorked = 0;
  let lateArrivals = 0;
  let totalLateMinutes = 0;

  attendance.forEach((record) => {
    if (record.checkOut) {
      const checkIn = record.checkIn.toDate();
      const checkOut = record.checkOut.toDate();
      totalHoursWorked += differenceInHours(checkOut, checkIn);

      // Check if late (assuming 9 AM start time)
      const expectedTime = new Date(checkIn);
      expectedTime.setHours(9, 0, 0, 0);
      if (checkIn > expectedTime) {
        lateArrivals++;
        totalLateMinutes += Math.floor(
          (checkIn.getTime() - expectedTime.getTime()) / (1000 * 60)
        );
      }
    }
  });

  // Daily attendance pattern
  const dailyAttendance: any[] = [];
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  dateRange.forEach((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayAttendance = attendance.filter((a) => a.date === dateStr);
    const rate = (dayAttendance.length / staff.length) * 100;

    dailyAttendance.push({
      date: date.toISOString(),
      attendanceRate: Math.round(rate),
      averageAttendance: attendanceRate,
    });
  });

  // By employee
  const byEmployee = staff
    .map((employee) => {
      const employeeAttendance = attendance.filter(
        (a) => a.staffId === employee.id
      );
      const employeeRate = Math.round(
        (employeeAttendance.length / workDays) * 100
      );

      return {
        name: `${employee.firstName} ${employee.lastName}`,
        position: employee.position,
        attendanceRate: employeeRate,
        daysWorked: employeeAttendance.length,
        totalDays: workDays,
      };
    })
    .sort((a, b) => b.attendanceRate - a.attendanceRate);

  // By day of week
  const dayNames = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const byDayOfWeek = dayNames.map((day, index) => {
    const dayAttendance = attendance.filter((a) => {
      const date = new Date(a.date);
      return date.getDay() === index;
    });

    const totalDaysOfWeek = dateRange.filter(
      (d) => d.getDay() === index
    ).length;
    const expectedForDay = staff.length * totalDaysOfWeek;

    return {
      day,
      attendanceRate:
        expectedForDay > 0
          ? Math.round((dayAttendance.length / expectedForDay) * 100)
          : 0,
    };
  });

  // Punctuality distribution
  const punctualityDistribution = [
    {
      category: "present",
      name: "Puntuales",
      value: attendance.length - lateArrivals,
    },
    { category: "late", name: "Tardanzas", value: lateArrivals },
    {
      category: "absent",
      name: "Ausencias",
      value: expectedAttendance - actualAttendance,
    },
  ];

  return {
    overview: {
      attendanceRate,
      totalAbsences: expectedAttendance - actualAttendance,
      unjustifiedAbsences: Math.floor(
        (expectedAttendance - actualAttendance) * 0.7
      ), // Mock
      lateArrivals,
      averageLateMinutes:
        lateArrivals > 0 ? Math.round(totalLateMinutes / lateArrivals) : 0,
      totalHoursWorked,
      averageHoursPerDay: Math.round(totalHoursWorked / actualAttendance),
      averageCheckInTime: "09:15", // Mock
      averageCheckOutTime: "18:30", // Mock
    },
    dailyAttendance,
    byEmployee,
    byDayOfWeek,
    punctualityDistribution,
  };
};

// Generate full report PDF
export const generateFullReport = async (
  startDate: Date,
  endDate: Date,
  period: string
) => {
  // This would generate a comprehensive PDF with all report sections
  // For now, returning mock data
  return {
    period,
    startDate,
    endDate,
    generatedAt: new Date(),
  };
};

// Save report to Firebase Storage
export const saveReportToStorage = async (
  reportData: any,
  fileName: string
) => {
  // Create a blob from the report data (this would be the actual PDF)
  const blob = new Blob([JSON.stringify(reportData)], {
    type: "application/pdf",
  });

  // Create storage reference
  const storageRef = ref(storage, `reports/${fileName}`);

  // Upload file
  await uploadBytes(storageRef, blob);

  // Get download URL
  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
};

// Get report history from Storage
export const getReportHistory = async () => {
  const reportsRef = ref(storage, "reports");
  const result = await listAll(reportsRef);

  const reports = await Promise.all(
    result.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      const metadata = await fetch(url, { method: "HEAD" });

      // Parse filename for metadata
      const fileName = itemRef.name;
      const parts = fileName.split("_");
      const period = parts[1] || "unknown";
      const dateStr = parts[2]?.replace(".pdf", "") || "";

      return {
        id: itemRef.name,
        fileName,
        period,
        type: "general",
        createdAt: new Date(dateStr),
        size: parseInt(metadata.headers.get("content-length") || "0"),
        url,
      };
    })
  );

  return reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

// Download report
export const downloadReport = async (url: string, fileName: string) => {
  const response = await fetch(url);
  const blob = await response.blob();

  // Create download link
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = fileName;
  link.click();

  // Clean up
  window.URL.revokeObjectURL(link.href);
};

// Delete report from Storage
export const deleteReport = async (reportId: string) => {
  const reportRef = ref(storage, `reports/${reportId}`);
  await deleteObject(reportRef);
};
