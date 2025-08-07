import {
  attendanceCollection,
  onSnapshot,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  serverTimestamp,
  db,
} from "@/lib/firebase";
import { Attendance } from "@/types";
import { format } from "date-fns";

// Get today's attendance
export const getTodayAttendance = async (): Promise<Attendance[]> => {
  const today = format(new Date(), "yyyy-MM-dd");
  const q = query(
    attendanceCollection,
    where("date", "==", today),
    orderBy("checkIn", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        ...doc.data(),
        id: doc.id,
      } as Attendance)
  );
};

// Get attendance by date range
export const getAttendanceByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<Attendance[]> => {
  const start = format(startDate, "yyyy-MM-dd");
  const end = format(endDate, "yyyy-MM-dd");

  const q = query(
    attendanceCollection,
    where("date", ">=", start),
    where("date", "<=", end),
    orderBy("date", "desc"),
    orderBy("checkIn", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        ...doc.data(),
        id: doc.id,
      } as Attendance)
  );
};

// Subscribe to attendance updates
export const subscribeToAttendance = (
  date: string,
  callback: (attendance: Attendance[]) => void
) => {
  const q = query(
    attendanceCollection,
    where("date", "==", date),
    orderBy("checkIn", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const attendance = snapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          id: doc.id,
        } as Attendance)
    );

    callback(attendance);
  });
};

// Check in
export const checkIn = async (
  staffId: string,
  staffName: string
): Promise<string> => {
  const today = format(new Date(), "yyyy-MM-dd");

  // Check if already checked in today
  const q = query(
    attendanceCollection,
    where("staffId", "==", staffId),
    where("date", "==", today),
    where("checkOut", "==", null)
  );

  const existing = await getDocs(q);
  if (!existing.empty) {
    throw new Error("Ya se registró entrada para hoy");
  }

  const docRef = await addDoc(attendanceCollection, {
    staffId,
    staffName,
    checkIn: serverTimestamp(),
    checkOut: null,
    date: today,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
};

// Check out
export const checkOut = async (attendanceId: string) => {
  const attendanceRef = doc(db, "attendance", attendanceId);
  await updateDoc(attendanceRef, {
    checkOut: serverTimestamp(),
  });
};

// Get staff attendance summary
export const getStaffAttendanceSummary = async (
  staffId: string,
  month: number,
  year: number
) => {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  const start = format(startDate, "yyyy-MM-dd");
  const end = format(endDate, "yyyy-MM-dd");

  const q = query(
    attendanceCollection,
    where("staffId", "==", staffId),
    where("date", ">=", start),
    where("date", "<=", end)
  );

  const snapshot = await getDocs(q);
  const attendance = snapshot.docs.map((doc) => doc.data() as Attendance);

  const summary = {
    totalDays: attendance.length,
    daysWithCheckOut: attendance.filter((a) => a.checkOut).length,
    daysWithoutCheckOut: attendance.filter((a) => !a.checkOut).length,
  };

  return summary;
};
// services/attendance.ts - Add these functions
export const markAbsence = async (
  staffId: string,
  staffName: string
): Promise<string> => {
  const today = format(new Date(), "yyyy-MM-dd");

  // Check if already has attendance today
  const q = query(
    attendanceCollection,
    where("staffId", "==", staffId),
    where("date", "==", today)
  );

  const existing = await getDocs(q);
  if (!existing.empty) {
    throw new Error("Ya se registró asistencia para hoy");
  }

  const docRef = await addDoc(attendanceCollection, {
    staffId,
    staffName,
    date: today,
    isAbsent: true,
    checkIn: serverTimestamp(),
    checkOut: serverTimestamp(),
    createdAt: serverTimestamp(),
  });

  return docRef.id;
};
