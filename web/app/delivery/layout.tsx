"use client";

import { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  User
} from "lucide-react";
import { usePathname } from "next/navigation";

const deliveryNavigation = [
  { name: "Overview", href: "/delivery/dashboard", icon: LayoutDashboard },
  { name: "My Orders", href: "/delivery/orders", icon: ShoppingBag },
  { name: "Profile", href: "/delivery/profile", icon: User },
];

export default function DeliveryLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  const currentItem = deliveryNavigation.find(item => 
    pathname === item.href || pathname.startsWith(item.href + '/')
  );
  
  const pageTitle = currentItem?.name || "Delivery Partner";

  return (
    <DashboardLayout 
      sidebarItems={deliveryNavigation} 
      title="DaaruDoor Delivery"
      pageTitle={pageTitle}
    >
      {children}
    </DashboardLayout>
  );
}
