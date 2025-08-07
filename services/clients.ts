import {
  clientsCollection,
  onSnapshot,
  query,
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
import { Client } from "@/types";
import { collection, where } from "firebase/firestore";

// Get all clients
export const getClients = async (): Promise<Client[]> => {
  const q = query(clientsCollection, orderBy("name"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(
    (doc) =>
      ({
        ...doc.data(),
        id: doc.id,
      } as Client)
  );
};

// Subscribe to real-time clients
export const subscribeToClients = (callback: (clients: Client[]) => void) => {
  const q = query(clientsCollection, orderBy("name"));

  return onSnapshot(q, (snapshot) => {
    const clients = snapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          id: doc.id,
        } as Client)
    );

    callback(clients);
  });
};

// Get client by ID
export const getClientById = async (
  clientId: string
): Promise<Client | null> => {
  const docSnap = await getDoc(doc(db, "clients", clientId));

  if (docSnap.exists()) {
    return {
      ...docSnap.data(),
      id: docSnap.id,
    } as Client;
  }

  return null;
};

// Create client
export const createClient = async (
  clientData: Partial<Client>
): Promise<string> => {
  const docRef = await addDoc(clientsCollection, {
    ...clientData,
    totalDebt: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};

// Update client
export const updateClient = async (clientId: string, data: Partial<Client>) => {
  const clientRef = doc(db, "clients", clientId);
  await updateDoc(clientRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// services/clients.ts - Add this function
export const deleteClient = async (clientId: string) => {
  // Check if client has orders
  const ordersQuery = query(
    collection(db, "orders"),
    where("clientId", "==", clientId)
  );
  const ordersSnapshot = await getDocs(ordersQuery);

  if (!ordersSnapshot.empty) {
    throw new Error("No se puede eliminar un cliente con pedidos asociados");
  }

  await deleteDoc(doc(db, "clients", clientId));
};
