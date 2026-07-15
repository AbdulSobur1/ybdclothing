"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  MapPin,
  Users,
  Settings,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Store,

} from "lucide-react";

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/delivery-zones", label: "Delivery Zones", icon: MapPin },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const prevPendingCountRef = useRef(0);

  useEffect(() => {
    if (pathname === "/admin/login") return;
    checkAdmin();
  }, [pathname]);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/admin/login");
      return;
    }

    // Check if user has admin access via their profile email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    // Fetch the owner email from an API endpoint (client components
    // can't access server-only env vars like OWNER_EMAIL directly)
    try {
      const res = await fetch("/api/admin/settings", { method: "HEAD" });
      const ownerEmail = res.headers.get("x-owner-email");
      if (profile?.email && ownerEmail && profile.email === ownerEmail) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    }
    setChecking(false);
  }

  // Fetch pending orders count for badge + new-order notification
  useEffect(() => {
    if (!isAdmin) return;
    const fetchPending = async () => {
      try {
        const res = await fetch("/api/admin/orders?status=pending_verification&limit=1");
        if (res.ok) {
          const data = await res.json();
          const newCount = data.pagination?.total ?? 0;
          setPendingOrdersCount(newCount);
          // Detect new order — if count increased (skip initial fetch)
          if (prevPendingCountRef.current > 0 && newCount > prevPendingCountRef.current) {
            // Flash the page title for 5 seconds
            const originalTitle = document.title;
            document.title = `🆕 ${newCount} pending — YBD Admin`;
            setTimeout(() => {
              document.title = originalTitle;
            }, 5000);
          }
          prevPendingCountRef.current = newCount;
        }
      } catch {
        // ignore
      }
    };
    fetchPending();
    // Poll every 30 seconds
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  // Login page renders bare (no sidebar, no auth UI)
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#A6822E] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
        <div className="text-center">
          <Store className="h-16 w-16 text-[#A6822E] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">Only the store owner can access the admin panel.</p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-2.5 rounded-full bg-[#A6822E] text-white font-medium hover:bg-[#8E6E1F] transition-all"
          >
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-[#16213e] border-r border-white/5 flex flex-col transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo — replace public/logo-icon.svg with your actual icon */}
        <div className="h-16 flex items-center px-4 border-b border-white/5">
          <Link
            href="/admin"
            className="flex items-center gap-3 min-w-0"
          >
            <img
              src="/logo-icon.svg"
              alt="YBD"
              className="w-8 h-8 rounded-lg flex-shrink-0"
            />
            {!collapsed && (
              <span className="font-bold text-white truncate" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                YBD Admin
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const isActive = link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#A6822E]/20 text-[#A6822E]"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
                title={collapsed ? link.label : undefined}
              >
                <div className="relative">
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {/* Notification badge */}
                  {link.href === "/admin/orders" && pendingOrdersCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-lg">
                      {pendingOrdersCount > 9 ? "9+" : pendingOrdersCount}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span>{link.label}</span>
                    {link.href === "/admin/orders" && pendingOrdersCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-medium">
                        {pendingOrdersCount} pending
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-white/5 space-y-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-all"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            {!collapsed && <span>Collapse</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
          <Link
            href="/"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <Store className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>View Store</span>}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-16 bg-[#16213e] border-b border-white/5 flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back to store
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
