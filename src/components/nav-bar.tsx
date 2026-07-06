"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListOrdered, Search, Users, CircleUserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/explore", label: "Home", icon: Home },
  { href: "/lists", label: "Lists", icon: ListOrdered },
  { href: "/search", label: "Search", icon: Search },
  { href: "/compare", label: "Compare", icon: Users },
  { href: "/profile", label: "Profile", icon: CircleUserRound },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around border-t border-border bg-background/95 py-2 backdrop-blur">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 text-xs",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
