import { Timestamp } from "firebase/firestore";

// Enums
export enum OrderStatus {
  ABONO = "abono",
  LIQUIDADO = "liquidado",
  NO_PAGADO = "no_pagado",
}

export enum UserRole {
  ADMIN = "admin",
  STAFF = "staff",
}

export interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

// Extended Order interface (optional)
export interface Order {
  id?: string;
  clientId: string;
  clientName?: string;
  date: Timestamp | Date;
  total: number;
  status: OrderStatus;
  isCredit: boolean;
  payments?: Payment[];
  remainingDebt?: number;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;

  // Optional additional fields for more detailed orders:
  items?: OrderItem[]; // Individual items in the order
  subtotal?: number; // Subtotal before discounts/taxes
  discount?: number; // Discount amount
  discountPercentage?: number; // Discount percentage
  tax?: number; // Tax amount
  taxPercentage?: number; // Tax percentage
  route?: string; // Delivery route
  dueDate?: Timestamp | Date; // Due date for credit orders
  deliveryDate?: Timestamp | Date; // Expected delivery date
  deliveryAddress?: string; // Delivery address (if different from client)
  orderNumber?: string; // Custom order number
  priority?: "low" | "normal" | "high"; // Order priority
  tags?: string[]; // Order tags/categories
}

export interface Client {
  id?: string;
  name: string;
  address: string;
  phone: string;
  price: number;
  hasCredit: boolean;
  routes: string[];
  totalDebt?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Staff {
  id?: string;
  firstName: string;
  lastName: string;
  position: string;
  salary: number;
  notes?: string;
  loans?: Loan[];
  totalLoans?: number;
  permissions?: Permission[];
  username?: string;
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Position {
  id?: string;
  name: string;
  createdAt?: Timestamp;
}

export interface Attendance {
  id?: string;
  staffId: string;
  staffName?: string;
  checkIn: Timestamp;
  checkOut?: Timestamp;
  date: string; // YYYY-MM-DD format
  createdAt?: Timestamp;
  isAbsent?: boolean;
}

export interface Payment {
  id?: string;
  orderId: string;
  amount: number;
  date: Timestamp;
  method?: "cash" | "transfer" | "card";
  notes?: string;
  createdBy?: string;
  createdAt?: Timestamp;
}

export interface Loan {
  id?: string;
  amount: number;
  date: Timestamp;
  paid: number;
  remaining: number;
  status: "active" | "paid";
  notes?: string;
}

export interface Permission {
  module: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingPayments: number;
  activeClients: number;
  todayOrders: number;
  monthlyRevenue: number;
}
