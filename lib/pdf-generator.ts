import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Order, OrderItem, OrderStatus } from "@/types";
import { formatCurrency, formatDate } from "./utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Enhanced ticket PDF generation
export const generateTicketPDFExtended = async (
  order: Order
): Promise<string> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 150],
  });

  // Set font and styling
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");

  // Header with better design
  doc.text("ALATRISTE", 40, 15, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("TICKET DE VENTA", 40, 22, { align: "center" });

  // Decorative line
  doc.setLineWidth(0.5);
  doc.line(10, 25, 70, 25);

  // Order info section
  doc.setFontSize(8);
  let y = 32;

  // Order details
  doc.setFont("helvetica", "bold");
  doc.text("Folio:", 10, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    `#${order.orderNumber || order.id?.slice(0, 8).toUpperCase() || "N/A"}`,
    50,
    y,
    {
      align: "right",
    }
  );

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Fecha:", 10, y);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(order.date, "dd/MM/yyyy HH:mm"), 50, y, {
    align: "right",
  });

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Cliente:", 10, y);
  doc.setFont("helvetica", "normal");
  const clientName = order.clientName || "Cliente General";
  const splitClient = doc.splitTextToSize(clientName, 40);
  doc.text(splitClient, 30, y);
  y += splitClient.length * 4;

  // Route if available
  if (order.route) {
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.text("Ruta:", 10, y);
    doc.setFont("helvetica", "normal");
    doc.text(order.route, 30, y);
    y += 4;
  }

  // Priority if set
  if (order.priority && order.priority !== "normal") {
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.text("Prioridad:", 10, y);
    doc.setFont("helvetica", "normal");
    doc.text(order.priority.toUpperCase(), 30, y);
    y += 4;
  }

  // Products section
  y += 8;
  doc.setLineWidth(0.3);
  doc.line(10, y, 70, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.text("CONCEPTO", 10, y);
  doc.text("IMPORTE", 70, y, { align: "right" });

  y += 5;
  doc.line(10, y, 70, y);
  y += 6;

  // Products/Items
  doc.setFont("helvetica", "normal");

  if (order.items && order.items.length > 0) {
    order.items.forEach((item: OrderItem) => {
      if (y > 110) {
        // Check if we need more space
        doc.addPage();
        y = 20;
      }

      const itemName = item.name || "Producto";
      const itemText = `${item.quantity}x ${itemName}`;
      const itemPrice = formatCurrency(item.price * item.quantity);

      // Wrap long item names
      const splitItem = doc.splitTextToSize(itemText, 45);
      doc.text(splitItem, 10, y);
      doc.text(itemPrice, 70, y, { align: "right" });
      y += splitItem.length * 4 + 2;
    });
  } else {
    doc.text("Venta de productos", 10, y);
    doc.text(formatCurrency(order.total), 70, y, { align: "right" });
    y += 6;
  }

  // Subtotal if different from total
  if (order.subtotal && order.subtotal !== order.total) {
    y += 3;
    doc.text("Subtotal:", 10, y);
    doc.text(formatCurrency(order.subtotal), 70, y, { align: "right" });
    y += 6;
  }

  // Discount if applicable
  if (order.discount && order.discount > 0) {
    y += 3;
    const discountText = order.discountPercentage
      ? `Descuento (${order.discountPercentage}%):`
      : "Descuento:";
    doc.text(discountText, 10, y);
    doc.text(`-${formatCurrency(order.discount)}`, 70, y, { align: "right" });
    y += 6;
  }

  // Tax if applicable
  if (order.tax && order.tax > 0) {
    y += 3;
    const taxText = order.taxPercentage
      ? `Impuesto (${order.taxPercentage}%):`
      : "Impuesto:";
    doc.text(taxText, 10, y);
    doc.text(formatCurrency(order.tax), 70, y, { align: "right" });
    y += 6;
  }

  // Total section
  y += 5;
  doc.setLineWidth(0.5);
  doc.line(10, y, 70, y);
  y += 6;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", 10, y);
  doc.text(formatCurrency(order.total), 70, y, { align: "right" });
  y += 8;

  // Payment info
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  if (order.isCredit) {
    doc.setFont("helvetica", "bold");
    doc.text("VENTA A CRÉDITO", 40, y, { align: "center" });
    y += 6;

    if (order.remainingDebt && order.remainingDebt > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Deuda pendiente:", 10, y);
      doc.text(formatCurrency(order.remainingDebt), 70, y, { align: "right" });
      y += 5;

      const abonado = order.total - order.remainingDebt;
      if (abonado > 0) {
        doc.text("Abonado:", 10, y);
        doc.text(formatCurrency(abonado), 70, y, { align: "right" });
        y += 5;
      }
    }

    if (order.dueDate) {
      doc.text("Vencimiento:", 10, y);
      doc.text(formatDate(order.dueDate, "dd/MM/yyyy"), 70, y, {
        align: "right",
      });
      y += 5;
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.text("VENTA DE CONTADO", 40, y, { align: "center" });
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.text("Pago recibido:", 10, y);
    doc.text(formatCurrency(order.total), 70, y, { align: "right" });
    y += 5;
  }

  // Delivery info if available
  if (order.deliveryDate) {
    y += 3;
    doc.text("Entrega:", 10, y);
    doc.text(formatDate(order.deliveryDate, "dd/MM/yyyy"), 70, y, {
      align: "right",
    });
    y += 5;
  }

  // Status
  y += 3;
  doc.setFont("helvetica", "bold");
  const statusText =
    order.status === OrderStatus.LIQUIDADO
      ? "PAGADO"
      : order.status === OrderStatus.ABONO
      ? "ABONO"
      : "PENDIENTE";
  doc.text(`Estado: ${statusText}`, 40, y, { align: "center" });

  // Tags if available
  if (order.tags && order.tags.length > 0) {
    y += 5;
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.text(`Tags: ${order.tags.join(", ")}`, 40, y, { align: "center" });
  }

  // Footer
  y = Math.max(y + 10, 130);
  doc.setLineWidth(0.3);
  doc.line(10, y, 70, y);
  y += 5;

  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text("¡Gracias por su compra!", 40, y, { align: "center" });
  y += 4;
  doc.text("Conserve este ticket para aclaraciones", 40, y, {
    align: "center",
  });
  y += 4;
  doc.text("Tel: (123) 456-7890", 40, y, { align: "center" });

  // Save the file
  const fileName = `ticket_${order.id}_${Date.now()}.pdf`;
  doc.save(fileName);

  return fileName;
};

// Comprehensive report PDF generation
export const generateReportPDF = async (
  reportType: "summary" | "orders" | "clients" | "attendance",
  title: string,
  data: any,
  startDate: Date,
  endDate: Date,
  period: string
): Promise<Blob> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let y = 20;
  const pageHeight = 277;
  const margin = 20;

  // Helper functions
  const checkPage = (additionalHeight: number = 20) => {
    if (y + additionalHeight > pageHeight - 20) {
      doc.addPage();
      y = 20;
      return true;
    }
    return false;
  };

  const addHeader = () => {
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), 105, y, { align: "center" });
    y += 15;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Período: ${period.charAt(0).toUpperCase() + period.slice(1)}`,
      margin,
      y
    );
    y += 6;
    doc.text(
      `Desde: ${format(startDate, "dd/MM/yyyy", { locale: es })}`,
      margin,
      y
    );
    y += 6;
    doc.text(
      `Hasta: ${format(endDate, "dd/MM/yyyy", { locale: es })}`,
      margin,
      y
    );
    y += 6;
    doc.text(
      `Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`,
      margin,
      y
    );
    y += 15;
  };

  const addSectionTitle = (sectionTitle: string) => {
    checkPage(15);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(sectionTitle, margin, y);
    y += 8;
    doc.setLineWidth(0.5);
    doc.line(margin, y, 190, y);
    y += 10;
  };

  const addKeyValuePair = (
    key: string,
    value: string,
    bold: boolean = false
  ) => {
    checkPage(6);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(`${key}: ${value}`, margin, y);
    y += 6;
  };

  const addTable = (
    headers: string[],
    rows: string[][],
    colWidths: number[]
  ) => {
    checkPage(20);

    // Headers
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    let x = margin;
    headers.forEach((header, i) => {
      doc.text(header, x, y);
      x += colWidths[i];
    });
    y += 6;

    // Line under headers
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + colWidths.reduce((a, b) => a + b, 0), y);
    y += 6;

    // Rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    rows.forEach((row) => {
      checkPage(6);
      x = margin;
      row.forEach((cell, i) => {
        const cellText = doc.splitTextToSize(cell, colWidths[i] - 2);
        doc.text(cellText, x, y);
        x += colWidths[i];
      });
      y += 6;
    });
    y += 5;
  };

  // Generate header
  addHeader();

  // Generate content based on report type
  switch (reportType) {
    case "summary":
      addSectionTitle("RESUMEN EJECUTIVO");
      addKeyValuePair(
        "Ingresos Totales",
        formatCurrency(data.totalRevenue),
        true
      );
      addKeyValuePair("Total de Pedidos", data.totalOrders.toString());
      addKeyValuePair("Clientes Activos", data.activeClients.toString());
      addKeyValuePair("Asistencia Promedio", `${data.averageAttendance}%`);
      addKeyValuePair("Pagos Pendientes", formatCurrency(data.pendingPayments));
      addKeyValuePair("Tasa de Cobro", `${data.collectionRate}%`);

      if (data.topClient) {
        y += 5;
        addSectionTitle("CLIENTE PRINCIPAL");
        addKeyValuePair("Nombre", data.topClient.name);
        addKeyValuePair("Ingresos", formatCurrency(data.topClient.revenue));
        addKeyValuePair(
          "Porcentaje del Total",
          `${data.topClient.percentage}%`
        );
      }
      break;

    case "orders":
      addSectionTitle("ANÁLISIS DE PEDIDOS");

      // Status distribution
      addKeyValuePair(
        "Total de Pedidos",
        data.ordersOverTime
          .reduce((sum: number, period: any) => sum + period.count, 0)
          .toString(),
        true
      );

      y += 5;
      doc.setFont("helvetica", "bold");
      doc.text("Distribución por Estado:", margin, y);
      y += 8;

      data.statusDistribution.forEach((status: any) => {
        addKeyValuePair(
          status.name,
          `${status.value} pedidos (${formatCurrency(status.total)})`
        );
      });

      // Top clients table
      if (data.topClientsByOrders.length > 0) {
        y += 10;
        addSectionTitle("TOP CLIENTES POR PEDIDOS");
        const headers = ["Cliente", "Pedidos", "Total"];
        const rows = data.topClientsByOrders.map((client: any) => [
          client.name,
          client.orders.toString(),
          formatCurrency(client.total),
        ]);
        addTable(headers, rows, [80, 30, 40]);
      }
      break;

    case "clients":
      addSectionTitle("ANÁLISIS DE CLIENTES");

      // Credit stats
      addKeyValuePair(
        "Total de Clientes",
        data.topClientsByRevenue.length.toString(),
        true
      );
      addKeyValuePair(
        "Clientes con Crédito",
        data.creditStats.totalClientsWithCredit.toString()
      );
      addKeyValuePair(
        "Monto Total en Crédito",
        formatCurrency(data.creditStats.totalCreditAmount)
      );

      // Top clients by revenue
      if (data.topClientsByRevenue.length > 0) {
        y += 10;
        addSectionTitle("TOP CLIENTES POR INGRESOS");
        const headers = ["Cliente", "Ingresos", "Pedidos", "%"];
        const rows = data.topClientsByRevenue
          .slice(0, 10)
          .map((client: any) => [
            client.name,
            formatCurrency(client.revenue),
            client.orders.toString(),
            `${client.percentage}%`,
          ]);
        addTable(headers, rows, [60, 35, 25, 20]);
      }

      // Top debtors
      if (data.topDebtors.length > 0) {
        y += 10;
        addSectionTitle("PRINCIPALES DEUDORES");
        const headers = ["Cliente", "Deuda", "Días"];
        const rows = data.topDebtors.map((debtor: any) => [
          debtor.name,
          formatCurrency(debtor.totalDebt),
          `${debtor.daysPastDue} días`,
        ]);
        addTable(headers, rows, [70, 40, 30]);
      }
      break;

    case "attendance":
      addSectionTitle("ANÁLISIS DE ASISTENCIA");

      addKeyValuePair(
        "Tasa de Asistencia",
        `${data.overview.attendanceRate}%`,
        true
      );
      addKeyValuePair(
        "Total de Faltas",
        data.overview.totalAbsences.toString()
      );
      addKeyValuePair("Llegadas Tarde", data.overview.lateArrivals.toString());
      addKeyValuePair("Horas Trabajadas", `${data.overview.totalHoursWorked}h`);
      addKeyValuePair(
        "Promedio Horas/Día",
        `${data.overview.averageHoursPerDay}h`
      );

      // Employee attendance
      if (data.byEmployee.length > 0) {
        y += 10;
        addSectionTitle("ASISTENCIA POR EMPLEADO");
        const headers = ["Empleado", "Asistencia", "Días"];
        const rows = data.byEmployee.map((emp: any) => [
          emp.name,
          `${emp.attendanceRate}%`,
          `${emp.daysWorked}/${emp.totalDays}`,
        ]);
        addTable(headers, rows, [80, 30, 30]);
      }
      break;
  }

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: "center" });
    doc.text("Sistema de Gestión Alatriste", 105, 290, { align: "center" });
  }

  return doc.output("blob");
};

// Generate comprehensive business report
export const generateBusinessReport = async (
  summaryData: any,
  ordersData: any,
  clientsData: any,
  attendanceData: any,
  startDate: Date,
  endDate: Date,
  period: string
): Promise<Blob> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let y = 20;
  const pageHeight = 277;
  const margin = 20;

  // Helper functions
  const checkPage = (additionalHeight: number = 20) => {
    if (y + additionalHeight > pageHeight - 20) {
      doc.addPage();
      y = 20;
      return true;
    }
    return false;
  };

  const addSectionTitle = (title: string) => {
    checkPage(15);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, y);
    y += 8;
    doc.setLineWidth(0.5);
    doc.line(margin, y, 190, y);
    y += 10;
  };

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("REPORTE EMPRESARIAL COMPLETO", 105, y, { align: "center" });
  y += 15;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Período: ${period.charAt(0).toUpperCase() + period.slice(1)}`,
    margin,
    y
  );
  y += 6;
  doc.text(
    `Desde: ${format(startDate, "dd/MM/yyyy", { locale: es })}`,
    margin,
    y
  );
  y += 6;
  doc.text(
    `Hasta: ${format(endDate, "dd/MM/yyyy", { locale: es })}`,
    margin,
    y
  );
  y += 6;
  doc.text(
    `Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`,
    margin,
    y
  );
  y += 15;

  // Executive Summary
  addSectionTitle("RESUMEN EJECUTIVO");

  const summaryGrid = [
    ["Ingresos Totales", formatCurrency(summaryData.totalRevenue)],
    ["Total de Pedidos", summaryData.totalOrders.toString()],
    ["Clientes Activos", summaryData.activeClients.toString()],
    ["Asistencia Promedio", `${summaryData.averageAttendance}%`],
    ["Pagos Pendientes", formatCurrency(summaryData.pendingPayments)],
    ["Tasa de Cobro", `${summaryData.collectionRate}%`],
  ];

  summaryGrid.forEach(([key, value], index) => {
    if (index % 2 === 0) {
      checkPage(6);
      doc.setFont("helvetica", "bold");
      doc.text(`${key}:`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, margin + 60, y);

      if (summaryGrid[index + 1]) {
        doc.setFont("helvetica", "bold");
        doc.text(`${summaryGrid[index + 1][0]}:`, margin + 100, y);
        doc.setFont("helvetica", "normal");
        doc.text(summaryGrid[index + 1][1], margin + 160, y);
      }
      y += 6;
    }
  });

  // Key Insights
  y += 10;
  addSectionTitle("OBSERVACIONES CLAVE");

  const insights = [];

  if (summaryData.revenueChange > 0) {
    insights.push(
      `✓ Los ingresos aumentaron ${summaryData.revenueChange}% vs período anterior`
    );
  } else if (summaryData.revenueChange < 0) {
    insights.push(
      `⚠ Los ingresos disminuyeron ${Math.abs(
        summaryData.revenueChange
      )}% vs período anterior`
    );
  }

  if (summaryData.topClient) {
    insights.push(
      `✓ Cliente principal: ${summaryData.topClient.name} (${summaryData.topClient.percentage}% de ingresos)`
    );
  }

  if (summaryData.collectionRate < 80) {
    insights.push(
      `⚠ Tasa de cobro baja: ${summaryData.collectionRate}% - Revisar gestión de cobranza`
    );
  }

  if (attendanceData.overview.attendanceRate < 90) {
    insights.push(
      `⚠ Asistencia baja: ${attendanceData.overview.attendanceRate}% - Implementar estrategias de mejora`
    );
  }

  insights.forEach((insight) => {
    checkPage(10);
    const lines = doc.splitTextToSize(insight, 170);
    doc.setFont("helvetica", "normal");
    doc.text(lines, margin + 5, y);
    y += lines.length * 6 + 3;
  });

  // Orders Analysis
  addSectionTitle("ANÁLISIS DE PEDIDOS");

  doc.setFont("helvetica", "normal");
  doc.text("Distribución por Estado:", margin, y);
  y += 8;

  ordersData.statusDistribution.forEach((status: any) => {
    checkPage(6);
    doc.text(
      `• ${status.name}: ${status.value} pedidos (${formatCurrency(
        status.total
      )})`,
      margin + 5,
      y
    );
    y += 6;
  });

  // Top Clients
  if (ordersData.topClientsByOrders.length > 0) {
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Top 5 Clientes por Pedidos:", margin, y);
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
          margin + 5,
          y
        );
        y += 6;
      });
  }

  // Clients Analysis
  addSectionTitle("ANÁLISIS DE CLIENTES");

  doc.setFont("helvetica", "normal");
  doc.text(
    `Total de clientes analizados: ${clientsData.topClientsByRevenue.length}`,
    margin,
    y
  );
  y += 6;
  doc.text(
    `Clientes con crédito: ${clientsData.creditStats.totalClientsWithCredit}`,
    margin,
    y
  );
  y += 6;
  doc.text(
    `Monto total en crédito: ${formatCurrency(
      clientsData.creditStats.totalCreditAmount
    )}`,
    margin,
    y
  );
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Top 5 Clientes por Ingresos:", margin, y);
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
        margin + 5,
        y
      );
      y += 6;
    });

  // Attendance Analysis
  addSectionTitle("ANÁLISIS DE ASISTENCIA");

  const attendanceMetrics = [
    ["Tasa de asistencia", `${attendanceData.overview.attendanceRate}%`],
    ["Total de faltas", attendanceData.overview.totalAbsences.toString()],
    ["Llegadas tarde", attendanceData.overview.lateArrivals.toString()],
    [
      "Promedio de retraso",
      `${attendanceData.overview.averageLateMinutes} min`,
    ],
    ["Horas trabajadas", `${attendanceData.overview.totalHoursWorked}h`],
    ["Promedio horas/día", `${attendanceData.overview.averageHoursPerDay}h`],
  ];

  attendanceMetrics.forEach(([key, value]) => {
    checkPage(6);
    doc.setFont("helvetica", "normal");
    doc.text(`• ${key}: ${value}`, margin + 5, y);
    y += 6;
  });

  // Recommendations
  addSectionTitle("RECOMENDACIONES");

  const recommendations = [
    "Mantener enfoque en clientes principales que generan mayor rentabilidad",
    "Implementar estrategias de fidelización para clientes frecuentes",
    "Mejorar proceso de cobranza para reducir cuentas por cobrar",
    "Establecer metas de asistencia y incentivos para el personal",
    "Revisar rutas de entrega para optimizar tiempos y costos",
    "Considerar ofertas especiales para clientes con bajo volumen de compra",
  ];

  recommendations.forEach((rec, index) => {
    checkPage(10);
    const lines = doc.splitTextToSize(`${index + 1}. ${rec}`, 170);
    doc.setFont("helvetica", "normal");
    doc.text(lines, margin, y);
    y += lines.length * 6 + 3;
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: "center" });
    doc.text("Sistema de Gestión Alatriste - Reporte Confidencial", 105, 290, {
      align: "center",
    });
  }

  return doc.output("blob");
};

// Enhanced HTML to PDF conversion
export const generateHTMLReportPDF = async (
  title: string,
  content: HTMLElement,
  orientation: "portrait" | "landscape" = "portrait"
): Promise<Blob> => {
  try {
    const canvas = await html2canvas(content, {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
    });

    const imgWidth = orientation === "portrait" ? 190 : 277;
    const pageHeight = orientation === "portrait" ? 277 : 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 40; // Leave space for header

    // Header
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(title, pdf.internal.pageSize.getWidth() / 2, 20, {
      align: "center",
    });

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Generado el ${formatDate(new Date(), "dd/MM/yyyy HH:mm")}`,
      pdf.internal.pageSize.getWidth() / 2,
      30,
      { align: "center" }
    );

    // Add content
    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - position;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf.output("blob");
  } catch (error) {
    console.error("Error generating HTML to PDF:", error);
    throw new Error("Error al generar el PDF del reporte");
  }
};
