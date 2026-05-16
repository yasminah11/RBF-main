import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useI18n } from "@/i18n/I18nContext";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminLayout() {
  const { isAdmin, loading } = useAdminAuth();
  const { dir } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <AdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className={cn(
        "flex flex-col min-h-screen transition-all duration-300",
        dir === "rtl" ? "lg:pr-64 lg:pl-0" : "lg:pl-64 lg:pr-0"
      )}>
        <AdminTopbar setMobileOpen={setMobileOpen} />
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
