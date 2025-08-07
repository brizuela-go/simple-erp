import {
  ordersCollection,
  clientsCollection,
  staffCollection,
  attendanceCollection,
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
  getMetadata,
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
import { formatCurrency } from "@/lib/utils";

// Generate comprehensive PDF report
export const generateFullReport = async (
  startDate: Date,
  endDate: Date,
  period: string
): Promise<Blob> => {
  const doc = new jsPDF();
  let y = 20;

  // Helper function to add page if needed
  const checkPage = (additionalHeight: number = 20) => {
    if (y + additionalHeight > 270) {
      doc.addPage();
      y = 20;
      return true;
    }
    return false;
  };

  // Helper function to add section header
  const addSectionHeader = (title: string) => {
    checkPage(15);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(title, 20, y);
    y += 10;
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 8;
  };

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("REPORTE EMPRESARIAL", 105, y, { align: "center" });
  y += 15;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Período: ${period.toUpperCase()}`, 20, y);
  y += 6;
  doc.text(`Desde: ${format(startDate, "dd/MM/yyyy", { locale: es })}`, 20, y);
  y += 6;
  doc.text(`Hasta: ${format(endDate, "dd/MM/yyyy", { locale: es })}`, 20, y);
  y += 6;
  doc.text(
    `Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`,
    20,
    y
  );
  y += 15;

  try {
    // Get all report data
    const [summaryData, ordersData, clientsData, attendanceData] =
      await Promise.all([
        getReportSummary(startDate, endDate),
        getOrdersReportData(startDate, endDate, period),
        getClientsReportData(startDate, endDate, period),
        getAttendanceReportData(startDate, endDate, period),
      ]);

    // 1. EXECUTIVE SUMMARY
    addSectionHeader("RESUMEN EJECUTIVO");

    const summaryItems = [
      {
        label: "Ingresos Totales",
        value: formatCurrency(summaryData.totalRevenue),
      },
      { label: "Total de Pedidos", value: summaryData.totalOrders.toString() },
      {
        label: "Clientes Activos",
        value: summaryData.activeClients.toString(),
      },
      {
        label: "Asistencia Promedio",
        value: `${summaryData.averageAttendance}%`,
      },
      {
        label: "Pagos Pendientes",
        value: formatCurrency(summaryData.pendingPayments),
      },
      { label: "Tasa de Cobro", value: `${summaryData.collectionRate}%` },
    ];

    summaryItems.forEach((item, index) => {
      if (index % 2 === 0) {
        checkPage(6);
        doc.setFont("helvetica", "bold");
        doc.text(item.label + ":", 20, y);
        doc.setFont("helvetica", "normal");
        doc.text(item.value, 80, y);

        // Add second item if exists
        if (summaryItems[index + 1]) {
          doc.setFont("helvetica", "bold");
          doc.text(summaryItems[index + 1].label + ":", 110, y);
          doc.setFont("helvetica", "normal");
          doc.text(summaryItems[index + 1].value, 170, y);
        }
        y += 6;
      }
    });

    y += 10;

    // 2. ANÁLISIS DE PEDIDOS
    addSectionHeader("ANÁLISIS DE PEDIDOS");

    doc.setFont("helvetica", "bold");
    doc.text("Distribución por Estado:", 20, y);
    y += 8;

    ordersData.statusDistribution.forEach((status: any) => {
      checkPage(6);
      doc.setFont("helvetica", "normal");
      doc.text(
        `• ${status.name}: ${status.value} pedidos (${formatCurrency(
          status.total
        )})`,
        25,
        y
      );
      y += 6;
    });

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Top 5 Clientes por Pedidos:", 20, y);
    y += 8;

    ordersData.topClientsByOrders
      .slice(0, 5)
      .forEach((client: any, index: number) => {
        checkPage(6);
        doc.setFont("helvetica", "normal");
        doc.text(
          `${index + 1}. ${client.name}: ${
            client.orders
          } pedidos (${formatCurrency(client.total)})`,
          25,
          y
        );
        y += 6;
      });

    // 3. ANÁLISIS DE CLIENTES
    addSectionHeader("ANÁLISIS DE CLIENTES");

    doc.setFont("helvetica", "bold");
    doc.text("Top 5 Clientes por Ingresos:", 20, y);
    y += 8;

    clientsData.topClientsByRevenue
      .slice(0, 5)
      .forEach((client: any, index: number) => {
        checkPage(6);
        doc.setFont("helvetica", "normal");
        doc.text(
          `${index + 1}. ${client.name}: ${formatCurrency(client.revenue)} (${
            client.percentage
          }%)`,
          25,
          y
        );
        y += 6;
      });

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Análisis de Crédito:", 20, y);
    y += 8;

    const creditItems = [
      {
        label: "Clientes con crédito",
        value: clientsData.creditStats.totalClientsWithCredit.toString(),
      },
      {
        label: "Monto total en crédito",
        value: formatCurrency(clientsData.creditStats.totalCreditAmount),
      },
      {
        label: "Plazo promedio de pago",
        value: `15 días`,
      },
    ];

    creditItems.forEach((item) => {
      checkPage(6);
      doc.setFont("helvetica", "normal");
      doc.text(`• ${item.label}: ${item.value}`, 25, y);
      y += 6;
    });

    // 4. ANÁLISIS DE ASISTENCIA
    addSectionHeader("ANÁLISIS DE ASISTENCIA");

    const attendanceItems = [
      {
        label: "Tasa de asistencia",
        value: `${attendanceData.overview.attendanceRate}%`,
      },
      {
        label: "Total de faltas",
        value: attendanceData.overview.totalAbsences.toString(),
      },
      {
        label: "Llegadas tarde",
        value: attendanceData.overview.lateArrivals.toString(),
      },
      {
        label: "Horas trabajadas",
        value: `${attendanceData.overview.totalHoursWorked}h`,
      },
      {
        label: "Promedio horas/día",
        value: `${attendanceData.overview.averageHoursPerDay}h`,
      },
    ];

    attendanceItems.forEach((item) => {
      checkPage(6);
      doc.setFont("helvetica", "normal");
      doc.text(`• ${item.label}: ${item.value}`, 25, y);
      y += 6;
    });

    // 5. OBSERVACIONES Y RECOMENDACIONES
    addSectionHeader("OBSERVACIONES Y RECOMENDACIONES");

    const observations = [];

    if (summaryData.revenueChange > 0) {
      observations.push(
        `✓ Los ingresos han aumentado un ${summaryData.revenueChange}% respecto al período anterior.`
      );
    } else if (summaryData.revenueChange < 0) {
      observations.push(
        `⚠ Los ingresos han disminuido un ${Math.abs(
          summaryData.revenueChange
        )}% respecto al período anterior.`
      );
    }

    if (summaryData.collectionRate < 80) {
      observations.push(
        `⚠ La tasa de cobro es del ${summaryData.collectionRate}%. Se recomienda mejorar la gestión de cobranza.`
      );
    }

    if (attendanceData.overview.attendanceRate < 90) {
      observations.push(
        `⚠ La asistencia promedio es del ${attendanceData.overview.attendanceRate}%. Considerar estrategias para mejorarla.`
      );
    }

    if (summaryData.topClient) {
      observations.push(
        `✓ El cliente principal "${summaryData.topClient.name}" representa el ${summaryData.topClient.percentage}% de los ingresos.`
      );
    }

    observations.forEach((observation) => {
      checkPage(12);
      const lines = doc.splitTextToSize(observation, 170);
      doc.setFont("helvetica", "normal");
      doc.text(lines, 25, y);
      y += lines.length * 6 + 3;
    });
  } catch (error) {
    console.error("Error generating report data:", error);
    addSectionHeader("ERROR");
    doc.setFont("helvetica", "normal");
    doc.text(
      "Error al generar los datos del reporte. Verifique la conexión a la base de datos.",
      20,
      y
    );
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: "center" });
    doc.text("Generado por Sistema de Gestión Alatriste", 105, 290, {
      align: "center",
    });
  }

  return doc.output("blob");
};

// Save PDF Blob to Firebase Storage with better error handling
export const saveReportToStorage = async (
  pdfBlob: Blob,
  fileName: string
): Promise<string> => {
  try {
    const storageRef = ref(storage, `reports/${fileName}`);
    const snapshot = await uploadBytes(storageRef, pdfBlob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error saving report to storage:", error);
    throw new Error("Error al guardar el reporte en el almacenamiento");
  }
};

// Fetch list of report PDFs and their metadata
export const getReportHistory = async () => {
  try {
    const reportsRef = ref(storage, "reports");
    const result = await listAll(reportsRef);

    const reports = await Promise.all(
      result.items.map(async (itemRef) => {
        try {
          const url = await getDownloadURL(itemRef);
          const metadata = await getMetadata(itemRef);

          // Parse filename for metadata
          const fileName = itemRef.name;
          const parts = fileName.split("_");
          const period = parts[1] || "unknown";

          // Extract date from filename or use metadata
          let createdAt = new Date();
          if (parts[2]) {
            const dateStr = parts[2].replace(".pdf", "");
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime())) {
              createdAt = parsedDate;
            }
          } else if (metadata.timeCreated) {
            createdAt = new Date(metadata.timeCreated);
          }

          return {
            id: itemRef.name,
            fileName,
            period,
            type: "general",
            createdAt,
            size: metadata.size || 0,
            url,
          };
        } catch (error) {
          console.error(`Error processing report ${itemRef.name}:`, error);
          return null;
        }
      })
    );

    // Filter out failed items and sort by date
    return reports
      .filter((report): report is NonNullable<typeof report> => report !== null)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error("Error loading report history:", error);
    throw new Error("Error al cargar el historial de reportes");
  }
};

// Fixed download function that handles CORS properly
export const downloadReport = async (url: string, fileName: string) => {
  try {
    // Create a temporary anchor element and trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Alternative method if the above doesn't work
    setTimeout(() => {
      window.open(url, "_blank");
    }, 100);
  } catch (error) {
    console.error("Error downloading report:", error);
    // Fallback: open in new tab
    window.open(url, "_blank");
  }
};

export const deleteReport = async (reportId: string) => {
  try {
    const reportRef = ref(storage, `reports/${reportId}`);
    await deleteObject(reportRef);
  } catch (error) {
    console.error("Error deleting report:", error);
    throw new Error("Error al eliminar el reporte");
  }
};

// Get summary report data (cleaned up)
export const getReportSummary = async (startDate: Date, endDate: Date) => {
  try {
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
    const averageAttendance =
      expectedAttendance > 0
        ? Math.round((actualAttendance / expectedAttendance) * 100)
        : 0;

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

      try {
        const clientDoc = await getDocs(
          query(clientsCollection, where("__name__", "==", clientId))
        );
        if (!clientDoc.empty) {
          const client = clientDoc.docs[0].data() as Client;
          topClient = {
            name: client.name,
            revenue,
            percentage:
              totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0,
          };
        }
      } catch (error) {
        console.error("Error fetching top client:", error);
      }
    }

    // Calculate percentage changes (you would need previous period data for real calculations)
    const revenueChange = 12.5; // Mock data - implement proper comparison
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
      collectionRate:
        totalRevenue > 0
          ? Math.round(((totalRevenue - pendingPayments) / totalRevenue) * 100)
          : 0,
      staffUtilization: 85, // Mock data
      topProducts: [], // Could be implemented with product tracking
    };
  } catch (error) {
    console.error("Error getting report summary:", error);
    throw new Error("Error al obtener el resumen del reporte");
  }
};

// Get orders report data (cleaned up)
export const getOrdersReportData = async (
  startDate: Date,
  endDate: Date,
  period: string
) => {
  try {
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
      const current = clientOrders.get(order.clientId) || {
        count: 0,
        total: 0,
      };
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
          try {
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
          } catch (error) {
            return {
              name: "Cliente Desconocido",
              orders: data.count,
              total: data.total,
            };
          }
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
  } catch (error) {
    console.error("Error getting orders report data:", error);
    throw new Error("Error al obtener los datos del reporte de pedidos");
  }
};

// Get clients report data (cleaned up)
export const getClientsReportData = async (
  startDate: Date,
  endDate: Date,
  period: string
) => {
  try {
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

    // Client activity over time - based on actual orders
    const clientGrowth: {
      period: string;
      newClients: number; // Would need historical data to calculate truly new clients
      activeClients: number;
    }[] = [];
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    // Group by week for better visualization
    const weeklyData = new Map<string, Set<string>>();

    orders.forEach((order) => {
      const orderDate =
        order.date instanceof Timestamp ? order.date.toDate() : order.date;
      const weekStart = startOfWeek(orderDate, { locale: es });
      const weekKey = format(weekStart, "d MMM", { locale: es });

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, new Set());
      }
      weeklyData.get(weekKey)!.add(order.clientId);
    });

    weeklyData.forEach((clientIds, weekKey) => {
      clientGrowth.push({
        period: weekKey,
        newClients: 0, // Would need historical data to calculate truly new clients
        activeClients: clientIds.size,
      });
    });

    // Top clients by revenue
    const clientRevenue = new Map<
      string,
      { revenue: number; orders: number }
    >();
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
            percentage:
              totalRevenue > 0
                ? ((data.revenue / totalRevenue) * 100).toFixed(1)
                : "0",
          };
        })
    );

    // Clients by route
    const routeCounts = new Map<string, number>();
    clients.forEach((client) => {
      if (client.routes && Array.isArray(client.routes)) {
        client.routes.forEach((route) => {
          routeCounts.set(route, (routeCounts.get(route) || 0) + 1);
        });
      }
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
          });
        }
        return acc;
      }, [])
      .sort((a, b) => b.totalDebt - a.totalDebt)
      .slice(0, 5);

    // Client retention based on order frequency
    const clientOrderCounts = new Map<string, number>();
    orders.forEach((order) => {
      clientOrderCounts.set(
        order.clientId,
        (clientOrderCounts.get(order.clientId) || 0) + 1
      );
    });

    const retentionData = [
      {
        segment: "1 pedido",
        count: Array.from(clientOrderCounts.values()).filter(
          (count) => count === 1
        ).length,
      },
      {
        segment: "2-5 pedidos",
        count: Array.from(clientOrderCounts.values()).filter(
          (count) => count >= 2 && count <= 5
        ).length,
      },
      {
        segment: "6-10 pedidos",
        count: Array.from(clientOrderCounts.values()).filter(
          (count) => count >= 6 && count <= 10
        ).length,
      },
      {
        segment: "10+ pedidos",
        count: Array.from(clientOrderCounts.values()).filter(
          (count) => count > 10
        ).length,
      },
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
      },
      topDebtors,
      retentionData,
    };
  } catch (error) {
    console.error("Error getting clients report data:", error);
    throw new Error("Error al obtener los datos del reporte de clientes");
  }
};

// Get attendance report data (cleaned up)
export const getAttendanceReportData = async (
  startDate: Date,
  endDate: Date,
  period: string
) => {
  try {
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
    const attendanceRate =
      expectedAttendance > 0
        ? Math.round((actualAttendance / expectedAttendance) * 100)
        : 0;

    // Calculate other metrics
    let totalHoursWorked = 0;
    let lateArrivals = 0;
    let totalLateMinutes = 0;
    let totalCheckInMinutes = 0;
    let totalCheckOutMinutes = 0;
    let recordsWithCheckOut = 0;

    attendance.forEach((record) => {
      const checkIn = record.checkIn.toDate();

      // Calculate check-in average
      totalCheckInMinutes += checkIn.getHours() * 60 + checkIn.getMinutes();

      if (record.checkOut) {
        const checkOut = record.checkOut.toDate();
        totalHoursWorked += differenceInHours(checkOut, checkIn);
        recordsWithCheckOut++;

        // Calculate check-out average
        totalCheckOutMinutes +=
          checkOut.getHours() * 60 + checkOut.getMinutes();

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

    // Calculate average check-in/out times
    const avgCheckInMinutes =
      attendance.length > 0 ? totalCheckInMinutes / attendance.length : 0;
    const avgCheckOutMinutes =
      recordsWithCheckOut > 0 ? totalCheckOutMinutes / recordsWithCheckOut : 0;

    const formatTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}`;
    };

    // Daily attendance pattern
    const dailyAttendance: any[] = [];
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    dateRange.forEach((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const dayAttendance = attendance.filter((a) => a.date === dateStr);
      const rate =
        staff.length > 0 ? (dayAttendance.length / staff.length) * 100 : 0;

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
        const employeeRate =
          workDays > 0
            ? Math.round((employeeAttendance.length / workDays) * 100)
            : 0;

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
        averageHoursPerDay:
          actualAttendance > 0
            ? Math.round(totalHoursWorked / actualAttendance)
            : 0,
        averageCheckInTime: formatTime(avgCheckInMinutes),
        averageCheckOutTime: formatTime(avgCheckOutMinutes),
      },
      dailyAttendance,
      byEmployee,
      byDayOfWeek,
      punctualityDistribution,
    };
  } catch (error) {
    console.error("Error getting attendance report data:", error);
    throw new Error("Error al obtener los datos del reporte de asistencia");
  }
};
