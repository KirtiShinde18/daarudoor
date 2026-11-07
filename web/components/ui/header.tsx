"use client";

import { Bell, Search, LogOut, Sun, Moon, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeContext";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface HeaderProps {
  title?: string;
  onToggleMobileMenu?: () => void;
}

export function Header({ title, onToggleMobileMenu }: HeaderProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/admin/notifications", {
          headers: { Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}` }
        });
        if (res.status === 401) {
          document.cookie = "adminAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          window.location.href = "/login";
          return;
        }
        const data = await res.json();
        if (data.success || data.result) {
          setNotifications(data.result || []);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };
    fetchNotifications();
    
    // Simple polling for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = () => {
    document.cookie = "adminAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
  };

  const markAsRead = async (id: string, link: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}` }
      });
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      setShowNotifications(false);
      router.push(link || "/admin");
    } catch (error) {
      console.error("Error marking notification read", error);
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-surface dark:bg-surface border-b border-border-main sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 -ml-1 text-muted hover:text-text-main rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 shrink-0"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5 text-text-main" />
          </button>
        )}

        {title && (
          <h1 className="text-lg sm:text-xl font-semibold text-text-main dark:text-text-main truncate">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 relative shrink-0">
        <button
          onClick={toggleTheme}
          className="relative p-2 text-muted hover:text-primary transition-colors rounded-full hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30"
          title="Toggle Theme"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button 
            className="relative p-2 text-muted hover:text-primary transition-colors rounded-full hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold text-white bg-primary rounded-full border-2 border-surface">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-surface dark:bg-surface border border-border-main rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border-main flex justify-between items-center bg-gray-50 dark:bg-white/5">
                <h3 className="font-medium text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-primary font-medium">{unreadCount} unread</span>
                )}
              </div>
              <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted text-sm">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n._id}
                      onClick={() => markAsRead(n._id, n.link)}
                      className={`w-full text-left p-3.5 sm:p-4 border-b border-border-main/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                        !n.isRead ? "bg-primary/5 dark:bg-primary/10" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`font-medium text-sm truncate mr-2 ${!n.isRead ? "text-primary" : ""}`}>{n.title}</span>
                        <span className="text-[11px] text-muted shrink-0">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-muted line-clamp-2">{n.action}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center p-2 text-muted hover:text-red-500 transition-colors rounded-full hover:bg-red-500/10 ml-1"
          title="Logout"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
