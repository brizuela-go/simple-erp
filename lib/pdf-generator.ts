import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Order } from "@/types";
import { formatCurrency, formatDate } from "./utils";

export const generateTicketPDF = async (order: Order) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 150], // Ticket size
  });

  // Set font
  doc.setFontSize(10);

  // Header
  doc.text("TICKET DE VENTA", 40, 10, { align: "center" });
  doc.setFontSize(8);
  doc.text("ALATRISTE", 40, 15, { align: "center" });

  // Line
  doc.line(5, 20, 75, 20);

  // Order details
  doc.setFontSize(8);
  let y = 25;

  doc.text(`Folio: ${order.id?.slice(0, 8) || "N/A"}`, 5, y);
  y += 5;
  doc.text(`Fecha: ${formatDate(order.date)}`, 5, y);
  y += 5;
  doc.text(`Cliente: ${order.clientName || "N/A"}`, 5, y);
  y += 10;

  // Items (simplified for now)
  doc.text("DETALLE:", 5, y);
  y += 5;
  doc.text("Venta general", 10, y);
  doc.text(formatCurrency(order.total), 70, y, { align: "right" });
  y += 10;

  // Line
  doc.line(5, y, 75, y);
  y += 5;

  // Total
  doc.setFontSize(10);
  doc.text("TOTAL:", 5, y);
  doc.text(formatCurrency(order.total), 70, y, { align: "right" });
  y += 10;

  // Payment info
  doc.setFontSize(8);
  if (order.isCredit) {
    doc.text("TIPO: CRÉDITO", 5, y);
    y += 5;
    if (order.remainingDebt && order.remainingDebt > 0) {
      doc.text(`Deuda: ${formatCurrency(order.remainingDebt)}`, 5, y);
      y += 5;
    }
  } else {
    doc.text("TIPO: CONTADO", 5, y);
    y += 5;
  }

  // Footer
  y += 10;
  doc.setFontSize(6);
  doc.text("Gracias por su compra", 40, y, { align: "center" });

  // Save the PDF
  doc.save(`ticket_${order.id?.slice(0, 8) || "order"}.pdf`);
};

export const generateReportPDF = async (
  title: string,
  content: HTMLElement,
  orientation: "portrait" | "landscape" = "portrait"
) => {
  const canvas = await html2canvas(content, {
    scale: 2,
    logging: false,
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  });

  const imgWidth = 210; // A4 width in mm
  const pageHeight = 295; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  // Add title
  pdf.setFontSize(16);
  pdf.text(title, 105, 15, { align: "center" });

  // Add image
  position = 25;
  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Add new pages if needed
  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${title.toLowerCase().replace(/\s+/g, "_")}.pdf`);
};
