"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: "□" },
  { href: "/horses", label: "Horses", icon: "◇" },
  { href: "/applications", label: "Apps", icon: "◈" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex justify-around">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs min-h-[44px] min-w-[44px] ${
                active ? "text-[#1a3a5c] font-medium" : "text-gray-500"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span className="text-lg" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
