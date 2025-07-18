"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, LogOut, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getActiveStaff } from "@/services/staff";
import { Staff, Attendance } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { checkIn, checkOut, getTodayAttendance } from "@/services/attendance";

export function AttendanceClock() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [staff, setStaff] = useState<Staff[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    // Update clock every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    loadData();

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [staffData, attendanceData] = await Promise.all([
        getActiveStaff(),
        getTodayAttendance(),
      ]);
      setStaff(staffData);
      setTodayAttendance(attendanceData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (staffId: string, staffName: string) => {
    setProcessingId(staffId);
    try {
      await checkIn(staffId, staffName);
      await loadData();
      toast.success(`Entrada registrada para ${staffName}`);
    } catch (error) {
      console.error("Error checking in:", error);
      toast.error("Error al registrar entrada");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCheckOut = async (attendanceId: string, staffName: string) => {
    setProcessingId(attendanceId);
    try {
      await checkOut(attendanceId);
      await loadData();
      toast.success(`Salida registrada para ${staffName}`);
    } catch (error) {
      console.error("Error checking out:", error);
      toast.error("Error al registrar salida");
    } finally {
      setProcessingId(null);
    }
  };

  const getStaffAttendance = (staffId: string) => {
    return todayAttendance.find((a) => a.staffId === staffId && !a.checkOut);
  };

  if (loading) {
    return (
      <div className="grid gap-6">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-muted rounded" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 ">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Control de Asistencia
          </CardTitle>
          <CardDescription>
            {format(currentTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </CardDescription>
        </CardHeader>
        <CardContent className="max-lg:-mx-6">
          <div className="text-center mb-8">
            <div className="text-5xl font-bold tabular-nums">
              {format(currentTime, "HH:mm:ss")}
            </div>
          </div>

          <div className="space-y-3">
            {staff.map((member) => {
              const attendance = getStaffAttendance(member.id!);
              const isCheckedIn = !!attendance;
              const isProcessing =
                processingId === member.id || processingId === attendance?.id;

              return (
                <div
                  key={member.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-all",
                    isCheckedIn
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : "glass"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        isCheckedIn
                          ? "bg-green-100 dark:bg-green-800"
                          : "bg-primary/10"
                      )}
                    >
                      <UserCheck
                        className={cn(
                          "h-5 w-5",
                          isCheckedIn
                            ? "text-green-600 dark:text-green-400"
                            : "text-primary"
                        )}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{`${member.firstName} ${member.lastName}`}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.position}
                      </p>
                      {isCheckedIn && attendance && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Entrada:{" "}
                          {format(attendance.checkIn.toDate(), "HH:mm")}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={isCheckedIn ? "destructive" : "default"}
                    onClick={() => {
                      if (isCheckedIn && attendance) {
                        handleCheckOut(
                          attendance.id!,
                          `${member.firstName} ${member.lastName}`
                        );
                      } else {
                        handleCheckIn(
                          member.id!,
                          `${member.firstName} ${member.lastName}`
                        );
                      }
                    }}
                    disabled={isProcessing}
                  >
                    {isCheckedIn ? (
                      <>
                        <LogOut className="h-4 w-4 mr-2" />
                        Marcar Salida
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 mr-2" />
                        Marcar Entrada
                      </>
                    )}
                  </Button>
                </div>
              );
            })}

            {staff.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay personal activo para mostrar
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
