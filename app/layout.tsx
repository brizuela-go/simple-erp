import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "@/lib/stack";

import { Toaster } from "sonner";
import { Provider } from "@/provider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
    "1000",
  ],
});

export const metadata: Metadata = {
  title: "ERP Dashboard - Sistema de Gestión",
  description: "Dashboard ERP para gestión de órdenes, clientes y personal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${dmSans.className}`}>
        <Provider>
          <StackProvider lang={"es-419"} app={stackServerApp}>
            <StackTheme>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: "var(--background)",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                  },
                }}
              />
            </StackTheme>
          </StackProvider>
        </Provider>
      </body>
    </html>
  );
}
