import {
  ordersCollection,
  clientsCollection,
  onSnapshot,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  db,
} from "@/lib/firebase";
import { Order, OrderStatus } from "@/types";

// Subscribe to real-time orders
export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  const q = query(ordersCollection, orderBy("createdAt", "desc"));

  return onSnapshot(q, async (snapshot) => {
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

    callback(orders);
  });
};

// Get recent orders
export const getRecentOrders = async (limit: number = 5): Promise<Order[]> => {
  const q = query(
    ordersCollection,
    orderBy("createdAt", "desc"),
    where("createdAt", "!=", null)
  );

  const snapshot = await getDocs(q);
  const orders: Order[] = [];

  for (const docSnap of snapshot.docs.slice(0, limit)) {
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

// Create order
export const createOrder = async (
  orderData: Partial<Order>
): Promise<string> => {
  const docRef = await addDoc(ordersCollection, {
    ...orderData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};

// Update order status
export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus
) => {
  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, {
    status,
    updatedAt: serverTimestamp(),
  });
};

// Update order
export const updateOrder = async (orderId: string, data: Partial<Order>) => {
  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Delete order
export const deleteOrder = async (orderId: string) => {
  await deleteDoc(doc(db, "orders", orderId));
};
