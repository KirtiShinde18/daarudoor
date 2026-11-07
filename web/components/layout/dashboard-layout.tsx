import { ReactNode } from "react";
import { Sidebar, NavItem } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";

interface DashboardLayoutProps {
  children: ReactNode;
  sidebarItems: NavItem[];
  title: string;
  pageTitle?: string;
}

export function DashboardLayout({ children, sidebarItems, title, pageTitle }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-background dark:bg-surface overflow-hidden print:h-auto print:overflow-visible print:bg-white print:text-black">
      <div className="print:hidden h-full flex flex-shrink-0">
        <Sidebar items={sidebarItems} title={title} />
      </div>
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible">
        <div className="print:hidden">
          <Header title={pageTitle} />
        </div>
        <div className="flex-1 overflow-y-auto p-6 print:overflow-visible print:p-0">
          <div className="max-w-7xl mx-auto print:max-w-none print:w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
