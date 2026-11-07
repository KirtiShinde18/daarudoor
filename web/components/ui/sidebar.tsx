"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarProps {
  items: NavItem[];
  title: string;
}

export function Sidebar({ items, title }: SidebarProps) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<{ name: string; email: string; role: string; profilePic: string | null } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/admin/profile", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data.result);
        }
      } catch (error) {
        console.error("Failed to fetch admin profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border-main bg-surface dark:bg-surface flex flex-col h-full transition-all">
      <div className="h-16 flex items-center px-6 border-b border-border-main">
        <span className="text-xl font-bold text-primary dark:text-primary-light tracking-tight">
          {title}
        </span>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light"
                  : "text-muted hover:bg-surface hover:text-gray-900 dark:text-muted dark:hover:bg-surface dark:hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border-main">
        <Link href="/admin/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface transition-colors cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-primary-light/20 flex items-center justify-center text-primary font-bold text-sm overflow-hidden border border-primary/20 shrink-0">
            {profile?.profilePic ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profilePic} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              profile?.name ? getInitials(profile.name) : "US"
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-medium text-text-main dark:text-text-main truncate group-hover:text-primary transition-colors">
              {profile?.name || "User"}
            </span>
            <span className="text-xs text-muted truncate">
              {profile?.email || "View Profile"}
            </span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
