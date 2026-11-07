"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Truck, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  UserPlus,
  RefreshCw,
  Package,
  Activity
} from "lucide-react";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";

export default function AdminDashboard() {
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/dashboard-stats", {
        headers: {
          Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}`,
        },
      });

      if (res.status === 401) {
        document.cookie = "adminAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "/login";
        return;
      }

      const data = await res.json();
      if (data.success) {
        setStatsData(data.data);
      } else {
        setError(data.message || "Failed to fetch dashboard data");
      }
    } catch (err: any) {
      setError("Network error while fetching dashboard data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-850 rounded-xl border border-border-main" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400">
          <p className="font-semibold mb-2">Error loading dashboard</p>
          <p className="text-sm mb-4">{error}</p>
          <button 
            onClick={fetchStats}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = statsData?.stats || {};
  const recentOrders = statsData?.recentOrders || [];
  const recentCustomers = statsData?.recentCustomers || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-main dark:text-text-main">
            Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Real-time delivery logistics, fleet tracking, and sales analytics
          </p>
        </div>
        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-border-main bg-surface hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-primary" : "text-muted"}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/admin/orders"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <span>Manage Orders</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Urgent Operational Alerts */}
      {(stats.awaitingAssignment > 0 || stats.delayedOrdersCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.awaitingAssignment > 0 && (
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-text-main truncate">
                    {stats.awaitingAssignment} {stats.awaitingAssignment === 1 ? "Order" : "Orders"} Awaiting Assignment
                  </h4>
                  <p className="text-xs text-muted truncate">Customer orders waiting for a delivery partner</p>
                </div>
              </div>
              <Link
                href="/admin/orders?deliveryPartnerId=UNASSIGNED"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors text-center shrink-0"
              >
                Assign Now
              </Link>
            </div>
          )}

          {stats.delayedOrdersCount > 0 && (
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/80 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-text-main truncate">
                    {stats.delayedOrdersCount} Delayed / Stalled Deliveries
                  </h4>
                  <p className="text-xs text-muted truncate">Active deliveries inactive for over 45 minutes</p>
                </div>
              </div>
              <Link
                href="/admin/orders?status=OUT_FOR_DELIVERY"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-rose-600 text-white hover:bg-rose-700 transition-colors text-center shrink-0"
              >
                Inspect
              </Link>
            </div>
          )}
        </div>
      )}

      {/* KPI Section 1: Financials & Customers */}
      <div>
        <h3 className="text-xs font-semibold tracking-wider uppercase text-muted mb-3">
          Financial & Customer Metrics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Realized Sales"
            value={`₹${(stats.totalSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            subtitle="Realized revenue (Paid online + Delivered COD)"
            icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
            colorClass="text-emerald-600"
          />
          <MetricCard
            title="Today's Sales"
            value={`₹${(stats.todaySales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            subtitle="Completed & paid orders today"
            icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
            colorClass="text-emerald-600"
          />
          <MetricCard
            title="Total Customers"
            value={stats.totalCustomers || 0}
            subtitle="Registered active customer base"
            icon={<Users className="w-5 h-5 text-primary" />}
            colorClass="text-primary"
          />
          <MetricCard
            title="New Customers Today"
            value={stats.newCustomersToday || 0}
            subtitle="Signups in the last 24 hours"
            icon={<UserPlus className="w-5 h-5 text-blue-600" />}
            colorClass="text-blue-600"
          />
        </div>
      </div>

      {/* KPI Section 2: Delivery Fleet Health */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold tracking-wider uppercase text-muted">
            Delivery Fleet Health
          </h3>
          <Link href="/admin/delivery-boys" className="text-xs font-medium text-primary hover:underline">
            View Staff Directory &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Total Delivery Boys"
            value={stats.totalDeliveryBoys || 0}
            subtitle="Registered delivery personnel"
            icon={<Truck className="w-5 h-5 text-primary" />}
            colorClass="text-primary"
          />
          <MetricCard
            title="Available Delivery Boys"
            value={stats.availableDeliveryBoys || 0}
            subtitle="Active with 0 orders assigned"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            colorClass="text-emerald-600"
            badge="Ready to dispatch"
          />
          <MetricCard
            title="Busy Delivery Boys"
            value={stats.busyDeliveryBoys || 0}
            subtitle="Currently handling active orders"
            icon={<Activity className="w-5 h-5 text-amber-600" />}
            colorClass="text-amber-600"
            badge="On the road"
          />
        </div>
      </div>

      {/* KPI Section 3: Logistics & Order Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold tracking-wider uppercase text-muted">
            Logistics & Order Pipeline
          </h3>
          <Link href="/admin/orders" className="text-xs font-medium text-primary hover:underline">
            View Full Table &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
          <MiniMetricCard
            title="Total Orders"
            value={stats.totalOrders || 0}
            color="border-border-main"
          />
          <MiniMetricCard
            title="Orders Today"
            value={stats.ordersToday || 0}
            color="border-blue-300 dark:border-blue-900"
          />
          <MiniMetricCard
            title="Awaiting Assignment"
            value={stats.awaitingAssignment || 0}
            color="border-amber-400 dark:border-amber-800"
            highlight={stats.awaitingAssignment > 0}
          />
          <MiniMetricCard
            title="Pending Deliveries"
            value={stats.pendingDeliveries || 0}
            color="border-purple-300 dark:border-purple-900"
          />
          <MiniMetricCard
            title="Active (Out)"
            value={stats.activeDeliveries || 0}
            color="border-blue-400 dark:border-blue-800"
          />
          <MiniMetricCard
            title="Delivered"
            value={stats.deliveredOrders || 0}
            color="border-green-400 dark:border-green-800"
          />
          <MiniMetricCard
            title="Failed"
            value={stats.failedDeliveries || 0}
            color="border-rose-300 dark:border-rose-900"
          />
          <MiniMetricCard
            title="Cancelled"
            value={stats.cancelledOrders || 0}
            color="border-gray-300 dark:border-gray-700"
          />
        </div>
      </div>

      {/* Main Content: Recent Orders & Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 premium-card p-4 sm:p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-text-main dark:text-text-main">
                Recent Orders
              </h2>
              <p className="text-xs text-muted">Latest 10 orders placed in the system</p>
            </div>
            <Link href="/admin/orders" className="text-xs sm:text-sm font-medium text-primary hover:underline">
              View All &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full min-w-[560px] text-sm text-left">
              <thead className="text-xs text-muted uppercase bg-surface border-b border-border-main">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Delivery Boy</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {recentOrders && recentOrders.length > 0 ? (
                  recentOrders.map((order: any) => (
                    <tr key={order._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-primary">
                        <Link href={`/admin/orders/${order._id}`} className="hover:underline">
                          #{order._id?.slice(-6).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-text-main">{order.customer?.name || "Customer"}</div>
                        <div className="text-xs text-muted">{order.customer?.mobile || ""}</div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-text-main">
                        ₹{(order.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5">
                        {order.deliveryPartner ? (
                          <div className="text-xs font-medium text-text-main">
                            {order.deliveryPartner.name}
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted">
                      No recent orders recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Customers */}
        <div className="premium-card p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-lg font-bold text-text-main dark:text-text-main">
                  Recent Customers
                </h2>
                <p className="text-xs text-muted">Newly onboarded shoppers</p>
              </div>
              <Link href="/admin/customers" className="text-sm font-medium text-primary hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-4">
              {recentCustomers && recentCustomers.length > 0 ? (
                recentCustomers.map((cust: any) => (
                  <div key={cust._id} className="flex items-center gap-3.5 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 shrink-0">
                      {cust.profilePic ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cust.profilePic} alt={cust.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        (cust.name || "U").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-main truncate">
                        {cust.name || "Unnamed Customer"}
                      </p>
                      <p className="text-xs text-muted truncate">{cust.email || cust.mobile}</p>
                    </div>
                    <div className="text-[11px] text-muted shrink-0">
                      {new Date(cust.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted text-center py-6">No customers found.</p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border-main">
            <div className="bg-primary/5 rounded-lg p-3 text-xs text-muted flex items-center justify-between">
              <span>Catalog Products: <strong>{stats.totalProducts || 0}</strong></span>
              <Link href="/admin/products" className="text-primary font-semibold hover:underline">
                Products &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  colorClass,
  badge,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  colorClass: string;
  badge?: string;
}) {
  return (
    <div className="premium-card p-4 sm:p-5 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider">{title}</p>
        <div className="p-2 bg-surface border border-border-main rounded-lg shadow-2xs shrink-0">
          {icon}
        </div>
      </div>
      <div>
        <h3 className={`text-xl sm:text-2xl font-bold tracking-tight ${colorClass}`}>{value}</h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted truncate">{subtitle}</p>
          {badge && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface border border-border-main text-muted shrink-0 ml-1">
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniMetricCard({
  title,
  value,
  color,
  highlight,
}: {
  title: string;
  value: number;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-2.5 sm:p-3.5 rounded-xl border bg-card text-center transition-all ${color} ${highlight ? "ring-2 ring-amber-500/50 bg-amber-50/20" : ""}`}>
      <p className="text-lg sm:text-xl font-bold text-text-main">{value}</p>
      <p className="text-[10px] sm:text-[11px] font-medium text-muted mt-0.5 leading-tight truncate">{title}</p>
    </div>
  );
}
