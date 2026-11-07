"use client";

import { useEffect, useState } from "react";
import { Package, Truck, CheckCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function DeliveryDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = document.cookie.split("deliveryAuth=")[1]?.split(";")[0] || document.cookie.split("DELIVERY=")[1]?.split(";")[0];
        
        const [statsRes, profileRes] = await Promise.all([
          fetch("/api/delivery/dashboard-stats", {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch("/api/delivery/profile", {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const statsData = await statsRes.json();
        const profileData = await profileRes.json();

        if (statsData.success) setStats(statsData.data);
        if (profileData.success) setProfile(profileData.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Welcome back, {profile?.name || 'Partner'}</h1>
          <p className="text-muted mt-1">Here's your delivery overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Assigned" value={stats?.totalAssigned || 0} icon={Package} color="text-blue-500" bgColor="bg-blue-500/10" />
        <StatCard title="Pending" value={stats?.pendingDeliveries || 0} icon={Clock} color="text-amber-500" bgColor="bg-amber-500/10" />
        <StatCard title="Out for Delivery" value={stats?.outForDelivery || 0} icon={Truck} color="text-purple-500" bgColor="bg-purple-500/10" />
        <StatCard title="Delivered Today" value={stats?.todayDeliveries || 0} icon={CheckCircle} color="text-green-500" bgColor="bg-green-500/10" />
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text-main">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/delivery/orders" className="premium-card p-6 flex flex-col items-center justify-center hover:border-primary transition-colors group">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-text-main">View My Orders</h3>
            <p className="text-sm text-muted mt-1 text-center">Manage and update your assigned deliveries</p>
          </Link>
          <Link href="/delivery/profile" className="premium-card p-6 flex flex-col items-center justify-center hover:border-primary transition-colors group">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UserIcon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-text-main">My Profile</h3>
            <p className="text-sm text-muted mt-1 text-center">View or update your personal details</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bgColor }: { title: string, value: number, icon: any, color: string, bgColor: string }) {
  return (
    <div className="premium-card p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColor}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-sm text-muted font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-text-main">{value}</h3>
      </div>
    </div>
  );
}

function UserIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
}
