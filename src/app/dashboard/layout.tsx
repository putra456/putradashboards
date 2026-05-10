"use client";

import { usePathname } from "next/navigation";
import { ConfigProvider } from "./config-context";
import DashboardNav from "./nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname === "/dashboard/admin";

  return (
    <ConfigProvider>
      <div className="dash-container py-5 sm:py-8" style={{ paddingBottom: isAdmin ? "20px" : "140px" }}>
        {children}
      </div>
      {!isAdmin && <DashboardNav />}
    </ConfigProvider>
  );
}
