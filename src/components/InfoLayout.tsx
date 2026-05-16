import { Outlet } from "react-router-dom";
import { InfoHeader } from "./InfoHeader";
import { Footer } from "./Footer";
import ScrollToTop from "./ScrollToTop";

export function InfoLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <InfoHeader />
      {/* Spacer for fixed header */}
      <div className="h-[56px] md:h-[72px]" />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
