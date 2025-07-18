import {
  staffCollection,
  onSnapshot,
  query,
  orderBy,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  db,
} from "@/lib/firebase";
import { Staff } from "@/types";

// Get all staff
export const getStaff = async (): Promise<Staff[]> => {
  const q = query(staffCollection, orderBy("firstName"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(
    (doc) =>
      ({
        ...doc.data(),
        id: doc.id,
      } as Staff)
  );
};

// Subscribe to real-time staff
export const subscribeToStaff = (callback: (staff: Staff[]) => void) => {
  const q = query(staffCollection, orderBy("firstName"));

  return onSnapshot(q, (snapshot) => {
    const staff = snapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          id: doc.id,
        } as Staff)
    );

    callback(staff);
  });
};

// Get staff by ID
export const getStaffById = async (staffId: string): Promise<Staff | null> => {
  const docSnap = await getDoc(doc(db, "staff", staffId));

  if (docSnap.exists()) {
    return {
      ...docSnap.data(),
      id: docSnap.id,
    } as Staff;
  }

  return null;
};

// Get active staff
export const getActiveStaff = async (): Promise<Staff[]> => {
  const q = query(
    staffCollection,
    where("isActive", "==", true),
    orderBy("firstName")
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(
    (doc) =>
      ({
        ...doc.data(),
        id: doc.id,
      } as Staff)
  );
};

// Create staff
export const createStaff = async (
  staffData: Partial<Staff>
): Promise<string> => {
  const docRef = await addDoc(staffCollection, {
    ...staffData,
    loans: [],
    totalLoans: 0,
    permissions: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};

// Update staff
export const updateStaff = async (staffId: string, data: Partial<Staff>) => {
  const staffRef = doc(db, "staff", staffId);
  await updateDoc(staffRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Delete staff
export const deleteStaff = async (staffId: string) => {
  await deleteDoc(doc(db, "staff", staffId));
};

// Add loan to staff
export const addLoan = async (staffId: string, loan: any) => {
  const staffDoc = await getStaffById(staffId);
  if (!staffDoc) throw new Error("Staff not found");

  const loans = staffDoc.loans || [];
  loans.push({
    ...loan,
    id: `loan_${Date.now()}`,
    date: new Date(),
    status: "active",
  });

  const totalLoans = loans.reduce((sum, l) => sum + (l.amount || 0), 0);

  await updateStaff(staffId, {
    loans,
    totalLoans,
  });
};

// Update staff permissions
export const updateStaffPermissions = async (
  staffId: string,
  permissions: any[]
) => {
  await updateStaff(staffId, { permissions });
};
