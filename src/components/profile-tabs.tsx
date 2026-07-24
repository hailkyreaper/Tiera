import Link from "next/link";
import { List, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "lists" as const, icon: List, href: "/profile" },
  { value: "library" as const, icon: BookOpen, href: "/profile?tab=library" },
];

export function ProfileTabs({ current }: { current: "lists" | "library" }) {
  return (
    <div className="flex w-full border-b border-border">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.value === current;

        return (
          <Link
            key={tab.value}
            href={tab.href}
            aria-label={tab.value === "lists" ? "Lists" : "Library"}
            className={cn(
              "relative flex flex-1 items-center justify-center py-3",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-5" />
            {isActive && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
