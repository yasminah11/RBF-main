import { Menu, UserCircle, Globe, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nContext";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AdminTopbar({ setMobileOpen }: { setMobileOpen: (o: boolean) => void }) {
  const { locale, setLocale, t, dir } = useI18n();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 backdrop-blur px-4 sm:px-6 shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0 h-9 w-9"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle navigation menu</span>
      </Button>
      
      <div className="flex-1 flex justify-between items-center min-w-0">
        <h2 className="font-display text-base sm:text-lg text-primary truncate mr-2">
          {/* Page title could be dynamic based on route, for now let's show Portal */}
          {t.admin.sidebar.portal}
        </h2>
        
        <div className="flex items-center gap-2 sm:gap-4 ml-auto shrink-0">
          {/* View Store Button */}
          <Button variant="outline" size="sm" className="hidden sm:flex h-8 gap-2 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300" asChild>
            <Link to="/">
              <Home className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{t.admin.topbar.viewStore}</span>
            </Link>
          </Button>

          <Button variant="ghost" size="icon" className="sm:hidden text-primary h-8 w-8" asChild>
            <Link to="/">
              <Home className="h-4 w-4" />
            </Link>
          </Button>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 sm:gap-2 text-muted-foreground hover:text-primary transition-colors px-1 sm:px-2">
                <Globe className="h-4 w-4" />
                <span className="uppercase text-[10px] sm:text-xs font-bold tracking-widest">{locale}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={dir === "rtl" ? "start" : "end"} className="bg-card border-border">
              <DropdownMenuItem onClick={() => setLocale("en")} className="text-xs uppercase tracking-widest cursor-pointer hover:bg-primary hover:text-primary-foreground">
                English (EN)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocale("ar")} className="text-xs uppercase tracking-widest cursor-pointer hover:bg-primary hover:text-primary-foreground">
                العربية (AR)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocale("tr")} className="text-xs uppercase tracking-widest cursor-pointer hover:bg-primary hover:text-primary-foreground">
                Türkçe (TR)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2 sm:gap-3 border-l border-border pl-2 sm:pl-4 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-2 sm:rtl:pr-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-bold text-foreground tracking-wide uppercase leading-tight">{t.admin.topbar.user}</span>
              <span className="text-[9px] text-primary uppercase tracking-[0.2em] leading-tight">{t.admin.topbar.role}</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border shrink-0">
              <UserCircle className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
