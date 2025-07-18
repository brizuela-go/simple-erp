"use client";

import { cn } from "@/lib/utils";
import { UserButton } from "@stackframe/stack";
import { LucideIcon, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Separator } from "../ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../ui/sheet";
import { Button } from "../ui/button";

function useSegment(basePath: string) {
  const path = usePathname();
  const result = path.slice(basePath.length, path.length);
  return result ? result : "/";
}

type Item = {
  name: React.ReactNode;
  href: string;
  icon: LucideIcon;
  type: "item";
};

type Sep = {
  type: "separator";
};

type Label = {
  name: React.ReactNode;
  type: "label";
};

export type SidebarItem = Item | Sep | Label;

function NavItem(props: {
  item: Item;
  onClick?: () => void;
  basePath: string;
}) {
  const segment = useSegment(props.basePath);
  const selected = segment === props.item.href;

  return (
    <Link
      href={props.basePath + props.item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
        selected && "bg-accent text-accent-foreground"
      )}
      onClick={props.onClick}
      prefetch={true}
    >
      <props.item.icon className="h-4 w-4" />
      {props.item.name}
    </Link>
  );
}

function SidebarContent(props: {
  onNavigate?: () => void;
  items: SidebarItem[];
  sidebarTop?: React.ReactNode;
  sidebarBottom?: React.ReactNode;
  basePath: string;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="h-16 flex items-center px-4 border-b">
        {props.sidebarTop}
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
        {props.items.map((item, index) => {
          if (item.type === "separator") {
            return <Separator key={index} className="my-2" />;
          } else if (item.type === "item") {
            return (
              <NavItem
                key={index}
                item={item}
                onClick={props.onNavigate}
                basePath={props.basePath}
              />
            );
          } else {
            return (
              <div key={index} className="px-3 py-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {item.name}
                </p>
              </div>
            );
          }
        })}
      </div>
      {props.sidebarBottom && (
        <div className="border-t p-2">{props.sidebarBottom}</div>
      )}
    </div>
  );
}

export default function SidebarLayout(props: {
  children?: React.ReactNode;
  items: SidebarItem[];
  sidebarTop?: React.ReactNode;
  sidebarBottom?: React.ReactNode;
  basePath: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col border-r bg-card/40 backdrop-blur-lg">
        <SidebarContent
          items={props.items}
          sidebarTop={props.sidebarTop}
          sidebarBottom={props.sidebarBottom}
          basePath={props.basePath}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b flex items-center justify-between px-4 md:px-6 bg-card/40 backdrop-blur-lg sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetTitle className="p-4 sr-only">Menu</SheetTitle>
              <SheetContent side="left" className="w-64 p-0">
                <Separator />
                <SidebarContent
                  onNavigate={() => setSidebarOpen(false)}
                  items={props.items}
                  sidebarTop={props.sidebarTop}
                  sidebarBottom={props.sidebarBottom}
                  basePath={props.basePath}
                />
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <UserButton />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {props.children}
        </main>
      </div>
    </div>
  );
}
