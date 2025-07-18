import {
  positionsCollection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "@/lib/firebase";
import { Position } from "@/types";

// Get all positions
export const getPositions = async (): Promise<Position[]> => {
  const q = query(positionsCollection, orderBy("name"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        name: doc.data().name,
        createdAt: doc.data().createdAt,
      } as Position)
  );
};

// Create position
export const createPosition = async (name: string): Promise<string> => {
  // Check if position already exists
  const q = query(positionsCollection, where("name", "==", name));
  const existing = await getDocs(q);

  if (!existing.empty) {
    throw new Error("Position already exists");
  }

  const docRef = await addDoc(positionsCollection, {
    name,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
};
