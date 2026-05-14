"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "□" },
  { href: "/horses", label: "My Horses", icon: "◇" },
  { href: "/applications", label: "Applications", icon: "◈" },
  { href: "/documents", label: "Documents", icon: "▤" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

interface SidebarProps {
  tenantName?: string;
  userName?: string;
}

export function Sidebar({ tenantName, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white max-md:hidden">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-bold text-[#1a3a5c]">EquestRai</h2>
        {tenantName && <p className="text-xs text-gray-500">{tenantName}</p>}
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
                active
                  ? "bg-[#1a3a5c]/10 text-[#1a3a5c]"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span className="text-base" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        {userName && (
          <p className="mb-2 truncate text-sm text-gray-700">{userName}</p>
        )}
        <button
          onClick={handleSignOut}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 min-h-[44px]"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
