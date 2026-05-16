import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Settings,
  LogOut,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n/I18nContext";

export function AdminSidebar({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen: boolean;
  setMobileOpen: (o: boolean) => void;
}) {
  const location = useLocation();
  const { t, dir } = useI18n();

  const navItems = [
    { icon: LayoutDashboard, label: t.admin.sidebar.dashboard, href: "/admin" },
    {
      icon: ShoppingBag,
      label: t.admin.sidebar.products,
      href: "/admin/products",
    },
    {
      icon: ShoppingCart,
      label: t.admin.sidebar.orders,
      href: "/admin/orders",
    },
    { icon: Tag, label: t.admin.sidebar.categories, href: "/admin/categories" },
    { icon: Package, label: "Inventory", href: "/admin/inventory" },
    {
      icon: Settings,
      label: t.admin.sidebar.settings,
      href: "/admin/settings",
    },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const sidebarClasses = cn(
    "fixed top-0 bottom-0 z-50 w-64 bg-background border-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
    dir === "rtl"
      ? mobileOpen
        ? "translate-x-0 right-0"
        : "translate-x-full right-0"
      : mobileOpen
        ? "translate-x-0 left-0"
        : "-translate-x-full left-0",
    dir === "rtl" ? "border-l" : "border-r",
  );

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={sidebarClasses}>
        <div className="p-6 border-b border-border">
          <h2 className="font-display text-xl text-primary tracking-wider leading-tight">
            ROYAL BRANDS
          </h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
            {t.admin.sidebar.portal}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/admin" &&
                location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-300",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-gold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>{t.admin.sidebar.logout}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
