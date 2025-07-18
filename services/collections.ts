import {
  ordersCollection,
  clientsCollection,
  paymentsCollection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  db,
} from "@/lib/firebase";
import { Order, Payment, OrderStatus } from "@/types";

// Get orders with remaining debt
export const getOrdersWithDebt = async (): Promise<Order[]> => {
  const q = query(
    ordersCollection,
    where("remainingDebt", ">", 0),
    orderBy("remainingDebt", "desc")
  );

  const snapshot = await getDocs(q);
  const orders: Order[] = [];

  for (const docSnap of snapshot.docs) {
    const orderData = docSnap.data() as Order;

    // Get client name
    if (orderData.clientId) {
      const clientDoc = await getDoc(
        doc(clientsCollection, orderData.clientId)
      );
      if (clientDoc.exists()) {
        orderData.clientName = clientDoc.data().name;
      }
    }

    orders.push({
      ...orderData,
      id: docSnap.id,
    });
  }

  return orders;
};

// Register payment for an order
export const registerPayment = async (
  orderId: string,
  amount: number,
  method: "cash" | "transfer" | "card" = "cash",
  notes?: string
): Promise<void> => {
  // Get current order
  const orderRef = doc(db, "orders", orderId);
  const orderDoc = await getDoc(orderRef);

  if (!orderDoc.exists()) {
    throw new Error("Order not found");
  }

  const order = orderDoc.data() as Order;
  const currentDebt = order.remainingDebt || 0;

  if (amount > currentDebt) {
    throw new Error("Payment amount exceeds remaining debt");
  }

  // Create payment record
  const payment: Partial<Payment> = {
    orderId,
    amount,
    date: serverTimestamp() as any,
    method,
    notes,
    createdAt: serverTimestamp() as any,
  };

  await addDoc(paymentsCollection, payment);

  // Update order
  const newDebt = currentDebt - amount;
  const newStatus = newDebt === 0 ? OrderStatus.LIQUIDADO : OrderStatus.ABONO;

  await updateDoc(orderRef, {
    remainingDebt: newDebt,
    status: newStatus,
    updatedAt: serverTimestamp(),
  });

  // Update client's total debt
  if (order.clientId) {
    await updateClientDebt(order.clientId);
  }
};

// Update client's total debt
const updateClientDebt = async (clientId: string): Promise<void> => {
  const q = query(
    ordersCollection,
    where("clientId", "==", clientId),
    where("remainingDebt", ">", 0)
  );

  const snapshot = await getDocs(q);
  let totalDebt = 0;

  snapshot.forEach((doc) => {
    const order = doc.data() as Order;
    totalDebt += order.remainingDebt || 0;
  });

  const clientRef = doc(db, "clients", clientId);
  await updateDoc(clientRef, {
    totalDebt,
    updatedAt: serverTimestamp(),
  });
};

// Get payment history for an order
export const getOrderPayments = async (orderId: string): Promise<Payment[]> => {
  const q = query(
    paymentsCollection,
    where("orderId", "==", orderId),
    orderBy("date", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(
    (doc) =>
      ({
        ...doc.data(),
        id: doc.id,
      } as Payment)
  );
};
