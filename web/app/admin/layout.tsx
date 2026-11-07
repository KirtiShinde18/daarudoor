"use client";

import { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Package, 
  Tags, 
  Truck, 
  CreditCard, 
  Settings,
  Wine,
  Gift
} from "lucide-react";
import { usePathname } from "next/navigation";

const adminNavigation = [
  { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Wine },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Replacements", href: "/admin/replacements", icon: Package },
  { name: "Offers", href: "/admin/offers", icon: Gift },
  { name: "Vendors", href: "/admin/vendors", icon: Package },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Delivery Boys", href: "/admin/delivery-boys", icon: Truck },
  { name: "Categories", href: "/admin/categories", icon: Tags },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  const currentItem = adminNavigation.find(item => 
    pathname === item.href || pathname.startsWith(item.href + '/')
  );
  
  const pageTitle = currentItem?.name || "Admin Panel";

  return (
    <DashboardLayout 
      sidebarItems={adminNavigation} 
      title="DaaruDoor Admin"
      pageTitle={pageTitle}
    >
      {children}
    </DashboardLayout>
  );
}
