import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, compact = false): string {
  const formatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 0 : 2,
    notation: compact ? "compact" : "standard",
  });

  return formatter.format(amount);
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";

  // Remove non-numeric characters
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    // Format as (XXX) XXX-XXXX
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
      6
    )}`;
  }
  if (cleaned.length === 11) {
    // Format as +XX (XXX) XXX-XXXX
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 5)}) ${cleaned.slice(
      5,
      8
    )}-${cleaned.slice(8)}`;
  }

  // Return cleaned number if it doesn't match expected lengths
  return cleaned;
}

export function formatDate(date: Date | any, formatStr = "dd/MM/yyyy"): string {
  if (!date) return "";

  // Handle Firestore Timestamp
  if (date?.toDate) {
    date = date.toDate();
  }

  // Convert string to Date if needed
  if (typeof date === "string") {
    date = new Date(date);
  }

  return format(date, formatStr, { locale: es });
}

export function formatDateTime(date: Date | any): string {
  return formatDate(date, "dd/MM/yyyy HH:mm");
}

export function formatRelativeTime(date: Date | any): string {
  if (!date) return "";

  // Handle Firestore Timestamp
  if (date?.toDate) {
    date = date.toDate();
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Hace un momento";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `Hace ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `Hace ${days} ${days === 1 ? "día" : "días"}`;
  } else {
    return formatDate(date);
  }
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
