"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Search, 
  Filter, 
  Calendar, 
  Truck, 
  MapPin, 
  Eye, 
  UserCheck, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  AlertCircle, 
  X, 
  CheckCircle, 
  XCircle,
  FileText,
  Phone,
  Clock,
  ExternalLink
} from "lucide-react";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
import { useToast } from "@/components/ToastContext";
import { LiveOrderMap } from "@/components/ui/LiveOrderMap";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const { showToast } = useToast();

  // Filters state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [deliveryPartnerFilter, setDeliveryPartnerFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination & Sorting state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Modals state
  const [assignModalOrder, setAssignModalOrder] = useState<any | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [assigningLoading, setAssigningLoading] = useState(false);

  const [statusModalOrder, setStatusModalOrder] = useState<any | null>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [updatingStatusLoading, setUpdatingStatusLoading] = useState(false);

  const [trackingModalOrder, setTrackingModalOrder] = useState<any | null>(null);
  const [trackingData, setTrackingData] = useState<any | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Fetch Delivery Boys list for assignments and filter dropdown
  const loadDeliveryBoys = async () => {
    try {
      const res = await fetch("/api/admin/delivery-boys", {
        headers: { Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}` }
      });
      const data = await res.json();
      if (data.success) {
        setDeliveryBoys(data.data);
      }
    } catch (e) {
      console.error("Failed to load delivery boys", e);
    }
  };

  // Fetch Orders with search, filters, and pagination
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (paymentStatusFilter !== "ALL") params.append("paymentStatus", paymentStatusFilter);
      if (deliveryPartnerFilter !== "ALL") params.append("deliveryPartnerId", deliveryPartnerFilter);
      if (dateRange !== "ALL") params.append("dateRange", dateRange);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      params.append("page", page.toString());
      params.append("limit", limit.toString());
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
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
        setOrders(data.data);
        if (data.pagination) {
          setTotalPages(data.pagination.pages);
          setTotalOrders(data.pagination.total);
        }
      } else {
        showToast(data.message || "Failed to load orders", "error");
      }
    } catch (err) {
      showToast("Network error while loading orders", "error");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, paymentStatusFilter, deliveryPartnerFilter, dateRange, startDate, endDate, page, limit, sortBy, sortOrder, showToast]);

  useEffect(() => {
    loadDeliveryBoys();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Open Tracking modal
  const openTrackingModal = async (order: any) => {
    setTrackingModalOrder(order);
    setTrackingLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${order._id}/tracking`, {
        headers: { Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}` }
      });
      const data = await res.json();
      if (data.success) {
        setTrackingData(data.data);
      }
    } catch (e) {
      showToast("Failed to fetch live tracking data", "error");
    } finally {
      setTrackingLoading(false);
    }
  };

  // Open Assign / Reassign modal
  const openAssignModal = (order: any) => {
    setAssignModalOrder(order);
    setSelectedPartnerId(order.deliveryPartner?._id || "");
    setAssignNote("");
  };

  const handleAssignSubmit = async () => {
    if (!assignModalOrder) return;
    setAssigningLoading(true);

    try {
      // If selectedPartnerId is empty or "UNASSIGN", call unassign endpoint
      if (!selectedPartnerId || selectedPartnerId === "UNASSIGN") {
        const res = await fetch(`/api/admin/orders/${assignModalOrder._id}/unassign`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}`
          },
          body: JSON.stringify({ note: assignNote })
        });
        const data = await res.json();
        if (data.success) {
          showToast("Delivery partner unassigned", "success");
          setAssignModalOrder(null);
          fetchOrders();
        } else {
          showToast(data.message || "Failed to unassign", "error");
        }
      } else {
        const res = await fetch(`/api/admin/orders/${assignModalOrder._id}/assign`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}`
          },
          body: JSON.stringify({ 
            deliveryPartnerId: selectedPartnerId,
            note: assignNote
          })
        });
        const data = await res.json();
        if (data.success) {
          showToast("Delivery partner assigned successfully", "success");
          setAssignModalOrder(null);
          fetchOrders();
        } else {
          showToast(data.message || "Failed to assign", "error");
        }
      }
    } catch (e) {
      showToast("Network error while updating assignment", "error");
    } finally {
      setAssigningLoading(false);
    }
  };

  // Open Status modal
  const openStatusModal = (order: any) => {
    setStatusModalOrder(order);
    setSelectedNewStatus(order.status);
    setFailureReason("");
    setCancelReason("");
    setStatusNote("");
  };

  const handleStatusSubmit = async () => {
    if (!statusModalOrder || !selectedNewStatus) return;
    setUpdatingStatusLoading(true);

    try {
      const res = await fetch(`/api/admin/orders/${statusModalOrder._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}`
        },
        body: JSON.stringify({
          status: selectedNewStatus,
          failureReason: selectedNewStatus === "FAILED" ? failureReason : undefined,
          cancelReason: selectedNewStatus === "CANCELLED" ? cancelReason : undefined,
          note: statusNote
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Order status updated to ${selectedNewStatus}`, "success");
        setStatusModalOrder(null);
        fetchOrders();
      } else {
        showToast(data.message || "Failed to update status", "error");
      }
    } catch (e) {
      showToast("Network error while updating status", "error");
    } finally {
      setUpdatingStatusLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main dark:text-text-main">
            Delivery Operations & Orders
          </h1>
          <p className="text-sm text-muted mt-1">
            Track, assign, inspect, and update real-time customer deliveries
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-border-main bg-surface hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            title="Refresh order table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : "text-muted"}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="premium-card p-5 space-y-4">
        {/* Row 1: Search & Date Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Bar */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Search by Order ID, Customer, Phone, or City..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-surface border border-border-main rounded-lg text-sm text-text-main focus:outline-none focus:border-primary"
            />
          </div>

          {/* Quick Date Range */}
          <div className="md:col-span-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted shrink-0" />
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-surface border border-border-main rounded-lg text-sm text-text-main focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="THIS_WEEK">This Week</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="CUSTOM">Custom Date Range</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-3">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("-");
                setSortBy(sb);
                setSortOrder(so as any);
              }}
              className="w-full px-3 py-2 bg-surface border border-border-main rounded-lg text-sm text-text-main focus:outline-none focus:border-primary"
            >
              <option value="createdAt-desc">Newest Orders First</option>
              <option value="createdAt-asc">Oldest Orders First</option>
              <option value="totalAmount-desc">Highest Value First</option>
              <option value="totalAmount-asc">Lowest Value First</option>
            </select>
          </div>
        </div>

        {/* Custom Date Inputs if CUSTOM is selected */}
        {dateRange === "CUSTOM" && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border-main">
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="px-2.5 py-1.5 bg-surface border border-border-main rounded-md text-text-main text-xs"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="px-2.5 py-1.5 bg-surface border border-border-main rounded-md text-text-main text-xs"
              />
            </div>
          </div>
        )}

        {/* Row 2: Status, Payment, and Delivery Boy Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border-main">
          {/* Order Status */}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-muted mb-1">Order Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 bg-surface border border-border-main rounded-lg text-xs font-medium text-text-main focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="READY_FOR_PICKUP">READY FOR PICKUP</option>
              <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="FAILED">FAILED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-muted mb-1">Payment Status</label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 bg-surface border border-border-main rounded-lg text-xs font-medium text-text-main focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Payments</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          {/* Delivery Boy */}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-muted mb-1">Delivery Boy</label>
            <select
              value={deliveryPartnerFilter}
              onChange={(e) => {
                setDeliveryPartnerFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 bg-surface border border-border-main rounded-lg text-xs font-medium text-text-main focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Partners</option>
              <option value="UNASSIGNED">Unassigned Only</option>
              {deliveryBoys.map((boy) => (
                <option key={boy._id} value={boy._id}>
                  {boy.name} ({boy.availability})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Delivery Operations Table */}
      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted uppercase bg-surface border-b border-border-main">
              <tr>
                <th className="px-4 py-3.5">Order ID & Date</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Delivery Address</th>
                <th className="px-4 py-3.5">Items</th>
                <th className="px-4 py-3.5">Total & Payment</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Assigned Staff</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-muted">
                    <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
                    <p>Loading delivery operations...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-muted">
                    <AlertCircle className="w-10 h-10 text-muted mx-auto mb-2" />
                    <p className="font-semibold text-text-main text-base">No orders matching criteria</p>
                    <p className="text-xs text-muted mt-1">Try resetting your search query or filters</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const totalItemsCount = order.products?.reduce((acc: number, p: any) => acc + (p.quantity || 1), 0) || 0;
                  const isUnassigned = !order.deliveryPartner;

                  return (
                    <tr key={order._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      {/* Order ID & Date */}
                      <td className="px-4 py-4">
                        <Link 
                          href={`/admin/orders/${order._id}`}
                          className="font-bold text-primary hover:underline block text-sm"
                        >
                          #{order._id.slice(-6).toUpperCase()}
                        </Link>
                        <div className="text-[11px] text-muted mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}, {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-4">
                        <div className="font-medium text-text-main">{order.customer?.name || "Customer"}</div>
                        <div className="text-xs text-muted flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{order.customer?.mobile || order.deliveryAddress?.mobile || "N/A"}</span>
                        </div>
                      </td>

                      {/* Address */}
                      <td className="px-4 py-4 max-w-xs">
                        <div className="flex items-start gap-1.5 text-xs text-muted">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span className="truncate">
                            {typeof order.deliveryAddress === "object"
                              ? `${order.deliveryAddress.houseNo || ""}, ${order.deliveryAddress.area || ""}, ${order.deliveryAddress.city || ""}`
                              : order.deliveryAddress || "Address not provided"}
                          </span>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-4 py-4">
                        <span className="font-medium text-text-main text-xs">
                          {totalItemsCount} {totalItemsCount === 1 ? "Item" : "Items"}
                        </span>
                        <div className="text-[11px] text-muted truncate max-w-[120px]">
                          {order.products?.[0]?.name || "Products"}
                          {order.products?.length > 1 && ` +${order.products.length - 1} more`}
                        </div>
                      </td>

                      {/* Total & Payment */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-text-main text-sm">
                          ₹{(order.totalAmount || 0).toFixed(2)}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[11px] text-muted">{order.paymentMethod}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            order.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                          }`}>
                            {order.paymentStatus}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <OrderStatusBadge status={order.status} />
                      </td>

                      {/* Assigned Staff */}
                      <td className="px-4 py-4">
                        {order.deliveryPartner ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                              {order.deliveryPartner.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-text-main">{order.deliveryPartner.name}</p>
                              <button
                                onClick={() => openAssignModal(order)}
                                className="text-[11px] text-primary hover:underline font-medium block"
                              >
                                Reassign
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => openAssignModal(order)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 hover:bg-amber-100 transition-colors"
                          >
                            Assign Staff
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Live Track Button */}
                          <button
                            onClick={() => openTrackingModal(order)}
                            className="p-1.5 text-muted hover:text-primary rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            title="Live Order Tracking"
                          >
                            <MapPin className="w-4 h-4" />
                          </button>

                          {/* Quick Status Update */}
                          <button
                            onClick={() => openStatusModal(order)}
                            className="p-1.5 text-muted hover:text-primary rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            title="Update Status"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>

                          {/* Full Details Link */}
                          <Link
                            href={`/admin/orders/${order._id}`}
                            className="p-1.5 text-muted hover:text-primary rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            title="View Full Order Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border-main bg-surface text-xs text-muted gap-3">
          <div>
            Showing <strong>{orders.length}</strong> of <strong>{totalOrders}</strong> total orders
          </div>

          <div className="flex items-center gap-2">
            <span className="mr-1">Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 bg-surface border border-border-main rounded text-xs text-text-main"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            <div className="flex items-center gap-1 ml-4">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="p-1.5 border border-border-main rounded hover:bg-black/5 disabled:opacity-40 transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="p-1.5 border border-border-main rounded hover:bg-black/5 disabled:opacity-40 transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ASSIGN / REASSIGN MODAL */}
      {assignModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background-main w-full max-w-lg rounded-2xl shadow-2xl flex flex-col border border-border-main overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-border-main bg-surface">
              <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                <span>
                  {assignModalOrder.deliveryPartner ? "Reassign Delivery Partner" : "Assign Delivery Partner"}
                </span>
              </h3>
              <button onClick={() => setAssignModalOrder(null)} className="text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-surface border border-border-main rounded-xl text-xs space-y-1">
                <p><strong>Order ID:</strong> #{assignModalOrder._id.slice(-6).toUpperCase()}</p>
                <p><strong>Customer:</strong> {assignModalOrder.customer?.name} ({assignModalOrder.customer?.mobile || "N/A"})</p>
                <p><strong>Current Status:</strong> {assignModalOrder.status}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-muted mb-1.5">
                  Select Delivery Boy
                </label>
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface border border-border-main rounded-lg text-sm text-text-main focus:outline-none focus:border-primary font-medium"
                >
                  <option value="" disabled>Choose an active delivery boy...</option>
                  {assignModalOrder.deliveryPartner && (
                    <option value="UNASSIGN" className="text-rose-600">
                      ⚠️ Unassign Current Partner (Revert to Confirmed)
                    </option>
                  )}
                  {deliveryBoys
                    .filter((b) => b.active)
                    .map((boy) => (
                      <option key={boy._id} value={boy._id}>
                        {boy.name} — {boy.availability} ({boy.activeDeliveries || 0} active orders)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-muted mb-1.5">
                  Internal Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Reason for assignment / handover instructions..."
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface border border-border-main rounded-lg text-sm text-text-main focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-border-main bg-surface">
              <button
                onClick={() => setAssignModalOrder(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border-main hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSubmit}
                disabled={assigningLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-50"
              >
                {assigningLoading ? "Updating..." : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {statusModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background-main w-full max-w-lg rounded-2xl shadow-2xl flex flex-col border border-border-main overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-border-main bg-surface">
              <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                <span>Update Order Status</span>
              </h3>
              <button onClick={() => setStatusModalOrder(null)} className="text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-surface border border-border-main rounded-xl text-xs space-y-1">
                <p><strong>Order ID:</strong> #{statusModalOrder._id.slice(-6).toUpperCase()}</p>
                <p><strong>Current Status:</strong> <OrderStatusBadge status={statusModalOrder.status} /></p>
                <p><strong>Assigned Partner:</strong> {statusModalOrder.deliveryPartner?.name || "Unassigned"}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-muted mb-1.5">
                  Select New Status
                </label>
                <select
                  value={selectedNewStatus}
                  onChange={(e) => setSelectedNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface border border-border-main rounded-lg text-sm text-text-main focus:outline-none focus:border-primary font-medium"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PROCESSING">PROCESSING (Preparing)</option>
                  <option value="READY_FOR_PICKUP">READY FOR PICKUP</option>
                  <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY (Dispatched)</option>
                  <option value="DELIVERED">DELIVERED (Completed)</option>
                  <option value="FAILED">FAILED (Delivery Failed)</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              {/* Failure Reason if FAILED */}
              {selectedNewStatus === "FAILED" && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-rose-600 mb-1.5">
                    Failure Reason (Required)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Customer unavailable, invalid address, rejected delivery"
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    className="w-full px-3.5 py-2 bg-surface border border-rose-300 rounded-lg text-sm text-text-main focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              {/* Cancel Reason if CANCELLED */}
              {selectedNewStatus === "CANCELLED" && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-rose-600 mb-1.5">
                    Cancellation Reason
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Customer requested cancellation, out of stock"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3.5 py-2 bg-surface border border-border-main rounded-lg text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase text-muted mb-1.5">
                  Internal Audit Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Reason for manual override..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface border border-border-main rounded-lg text-sm text-text-main focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-border-main bg-surface">
              <button
                onClick={() => setStatusModalOrder(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border-main hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusSubmit}
                disabled={updatingStatusLoading || (selectedNewStatus === "FAILED" && !failureReason.trim())}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-50"
              >
                {updatingStatusLoading ? "Updating..." : "Save Status Transition"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE ORDER TRACKING MODAL */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background-main w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col border border-border-main overflow-hidden max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-border-main bg-surface">
              <div>
                <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>Live Tracking: Order #{trackingModalOrder._id.slice(-6).toUpperCase()}</span>
                </h3>
                <p className="text-xs text-muted">
                  Assigned Partner: {trackingData?.deliveryPartner?.name || "Unassigned"}
                </p>
              </div>
              <button onClick={() => setTrackingModalOrder(null)} className="text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {trackingLoading ? (
                <div className="p-12 text-center text-muted">
                  <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
                  <p>Fetching GPS coordinates...</p>
                </div>
              ) : (
                <>
                  {/* Status Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-surface border border-border-main rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-main">Delivery Status:</span>
                      <OrderStatusBadge status={trackingData?.status || trackingModalOrder.status} />
                    </div>
                    {trackingData?.lastLocationUpdate && (
                      <span className="text-muted">
                        Last GPS ping: {new Date(trackingData.lastLocationUpdate).toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  {/* Leaflet Map Component */}
                  <LiveOrderMap
                    currentLocation={trackingData?.currentLocation}
                    customerLocation={trackingData?.customerLocation}
                    deliveryAddress={trackingData?.deliveryAddress || trackingModalOrder.deliveryAddress}
                    deliveryPartnerName={trackingData?.deliveryPartner?.name}
                    isLocationStale={trackingData?.isLocationStale}
                    orderStatus={trackingData?.status || trackingModalOrder.status}
                    height="360px"
                  />

                  {/* Delivery Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-surface border border-border-main rounded-xl">
                      <span className="font-semibold text-text-main block mb-1">Customer Delivery Address</span>
                      <p className="text-muted">
                        {typeof trackingModalOrder.deliveryAddress === "object"
                          ? `${trackingModalOrder.deliveryAddress.fullName} • ${trackingModalOrder.deliveryAddress.houseNo}, ${trackingModalOrder.deliveryAddress.area}, ${trackingModalOrder.deliveryAddress.city} - ${trackingModalOrder.deliveryAddress.pincode}`
                          : trackingModalOrder.deliveryAddress}
                      </p>
                      <p className="text-muted mt-1 font-medium">
                        Mobile: {trackingModalOrder.deliveryAddress?.mobile || trackingModalOrder.customer?.mobile}
                      </p>
                    </div>

                    <div className="p-3 bg-surface border border-border-main rounded-xl">
                      <span className="font-semibold text-text-main block mb-1">Delivery Partner Details</span>
                      <p className="text-text-main font-medium">
                        {trackingData?.deliveryPartner?.name || "Not Assigned"}
                      </p>
                      <p className="text-muted mt-0.5">
                        Phone: {trackingData?.deliveryPartner?.mobile || "N/A"}
                      </p>
                      <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {trackingData?.deliveryPartner?.isOnline ? "Partner App Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-border-main bg-surface">
              <Link
                href={`/admin/orders/${trackingModalOrder._id}`}
                className="px-4 py-2 text-sm font-medium rounded-lg text-primary border border-primary/30 hover:bg-primary/10 transition-colors flex items-center gap-1.5"
              >
                <span>Full Order Details</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setTrackingModalOrder(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border-main hover:bg-black/5 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
