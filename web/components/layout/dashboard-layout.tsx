"use client";

import { ReactNode, useState, useEffect } from "react";
import { Sidebar, NavItem } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";

interface DashboardLayoutProps {
  children: ReactNode;
  sidebarItems: NavItem[];
  title: string;
  pageTitle?: string;
}

export function DashboardLayout({ children, sidebarItems, title, pageTitle }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  // Prevent background scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="flex h-screen bg-background dark:bg-surface overflow-hidden print:h-auto print:overflow-visible print:bg-white print:text-black">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex print:hidden h-full flex-shrink-0 w-64">
        <Sidebar items={sidebarItems} title={title} />
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-in Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-300 ease-in-out lg:hidden shadow-2xl ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          items={sidebarItems}
          title={title}
          onNavigate={() => setIsMobileMenuOpen(false)}
          onClose={() => setIsMobileMenuOpen(false)}
          isMobile
        />
      </div>
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible">
        <div className="print:hidden">
          <Header 
            title={pageTitle} 
            onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 print:overflow-visible print:p-0">
          <div className="max-w-7xl mx-auto print:max-w-none print:w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
