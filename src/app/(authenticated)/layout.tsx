"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="app-container">
      <nav className="app-nav">
        <div className="nav-inner">
          <div className="nav-tabs">
            <Link
              href="/alerts"
              className={`nav-tab ${pathname === "/alerts" ? "active" : ""}`}
            >
              Alerts Configuration
            </Link>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="app-content">{children}</main>
    </div>
  );
}
