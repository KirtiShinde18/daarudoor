"use client";

import { Bell, Search, LogOut, Sun, Moon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeContext";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
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
    <header className="h-16 flex items-center justify-between px-6 bg-surface dark:bg-surface border-b border-border-main sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-xl font-semibold text-text-main dark:text-text-main">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-4 relative">
        <button
          onClick={toggleTheme}
          className="relative p-2 text-muted hover:text-primary transition-colors rounded-full hover:bg-primary/5"
          title="Toggle Theme"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button 
            className="relative p-2 text-muted hover:text-primary transition-colors rounded-full hover:bg-primary/5"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold text-white bg-primary rounded-full border-2 border-surface">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-surface dark:bg-surface border border-border-main rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border-main flex justify-between items-center bg-gray-50 dark:bg-white/5">
                <h3 className="font-medium">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-primary font-medium">{unreadCount} unread</span>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted text-sm">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n._id}
                      onClick={() => markAsRead(n._id, n.link)}
                      className={`w-full text-left p-4 border-b border-border-main/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                        !n.isRead ? "bg-primary/5 dark:bg-primary/10" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`font-medium text-sm ${!n.isRead ? "text-primary" : ""}`}>{n.title}</span>
                        <span className="text-xs text-muted">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-muted">{n.action}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center p-2 text-muted hover:text-red-500 transition-colors rounded-full hover:bg-red-500/10 ml-2"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
