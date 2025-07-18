"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Calendar } from "lucide-react";
import { AttendanceClock } from "@/components/attendance/attendance-clock";
import { AttendanceHistory } from "@/components/attendance/attendance-history";

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState("clock");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="swiss-text-title">Asistencia</h1>
        <p className="text-muted-foreground">
          Control de entradas y salidas del personal
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass">
          <TabsTrigger value="clock" className="gap-2">
            <Clock className="h-4 w-4" />
            Marcar Asistencia
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Calendar className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clock" className="mt-6">
          <AttendanceClock />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <AttendanceHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
