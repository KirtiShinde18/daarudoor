"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  RotateCcw, 
  Trash, 
  ShieldAlert, 
  Key, 
  X, 
  Star, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Phone, 
  Mail, 
  MapPin, 
  UserCheck, 
  UserX,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  PackageCheck
} from "lucide-react";
import { useToast } from "@/components/ToastContext";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";

export default function DeliveryBoysPage() {
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [deletedBoys, setDeletedBoys] = useState<any[]>([]);
  const [viewFilter, setViewFilter] = useState<"ALL" | "AVAILABLE" | "BUSY" | "INACTIVE" | "TRASH">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Create / Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBoy, setEditingBoy] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    address: "",
    birthYear: "",
    active: true,
  });

  // Soft delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [boyToDelete, setBoyToDelete] = useState<string | null>(null);

  // Permanent delete confirmation
  const [permanentDeleteModalOpen, setPermanentDeleteModalOpen] = useState(false);
  const [boyToPermanentDelete, setBoyToPermanentDelete] = useState<string | null>(null);

  // Detailed Profile & Performance Drawer / Modal
  const [selectedBoyId, setSelectedBoyId] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfDateFilter, setPerfDateFilter] = useState<string>("ALL");
  const [boyOrders, setBoyOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const { showToast } = useToast();

  const loadDeliveryBoys = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/delivery-boys", {
        headers: { Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}` }
      });
      if (res.status === 401) {
        document.cookie = "adminAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      if (data.success) {
        setDeliveryBoys(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch delivery boys", error);
      showToast("Failed to load delivery staff", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDeletedBoys = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/delivery-boys/deleted", {
        headers: { Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}` }
      });
      const data = await res.json();
      if (data.success) {
        setDeletedBoys(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch deleted delivery boys", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (viewFilter === "TRASH") {
      loadDeletedBoys();
    } else {
      loadDeliveryBoys();
    }
  }, [viewFilter]);

  // Load Performance details when drawer is opened
  const openPerformanceDrawer = async (boyId: string) => {
    setSelectedBoyId(boyId);
    setPerfLoading(true);
    setOrdersLoading(true);

    try {
      const res = await fetch(`/api/admin/delivery-boys/${boyId}/performance?dateRange=${perfDateFilter}`, {
        headers: { Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}` }
      });
      const data = await res.json();
      if (data.success) {
        setPerformanceData(data.data);
      }

      // Load boy orders
      const ordersRes = await fetch(`/api/admin/delivery-boys/${boyId}/orders?limit=25`, {
        headers: { Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}` }
      });
      const ordersData = await ordersRes.json();
      if (ordersData.success) {
        setBoyOrders(ordersData.data);
      }
    } catch (err) {
      showToast("Failed to load performance report", "error");
    } finally {
      setPerfLoading(false);
      setOrdersLoading(false);
    }
  };

  const handlePerfDateChange = async (range: string) => {
    setPerfDateFilter(range);
    if (!selectedBoyId) return;
    setPerfLoading(true);
    try {
      const res = await fetch(`/api/admin/delivery-boys/${selectedBoyId}/performance?dateRange=${range}`, {
        headers: { Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}` }
      });
      const data = await res.json();
      if (data.success) {
        setPerformanceData(data.data);
      }
    } catch (err) {
      showToast("Error filtering performance", "error");
    } finally {
      setPerfLoading(false);
    }
  };

  const handleToggleActive = async (boy: any) => {
    try {
      const res = await fetch(`/api/admin/delivery-boys/${boy._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}`,
        },
        body: JSON.stringify({ active: !boy.active }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Account ${!boy.active ? "activated" : "deactivated"} successfully`, "success");
        loadDeliveryBoys();
      } else {
        showToast(data.message || "Failed to update status", "error");
      }
    } catch (err) {
      showToast("Error updating account status", "error");
    }
  };

  const handleOpenCreateModal = () => {
    setEditingBoy(null);
    setFormData({ name: "", email: "", mobile: "", password: "", address: "", birthYear: "", active: true });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (boy: any) => {
    setEditingBoy(boy);
    setFormData({
      name: boy.name || "",
      email: boy.email || "",
      mobile: boy.mobile || "",
      password: "",
      address: boy.address || "",
      birthYear: boy.birthYear || "",
      active: boy.active,
    });
    setIsModalOpen(true);
  };

  const confirmDelete = (id: string) => {
    setBoyToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (boyToDelete) {
      try {
        const res = await fetch(`/api/admin/delivery-boys/${boyToDelete}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}` }
        });
        if (res.ok) {
          showToast("Delivery boy moved to trash", "success");
          loadDeliveryBoys();
        } else {
          showToast("Failed to delete delivery boy", "error");
        }
      } catch (error) {
        showToast("Error deleting delivery boy", "error");
      } finally {
        setDeleteModalOpen(false);
        setBoyToDelete(null);
      }
    }
  };

  const confirmPermanentDelete = (id: string) => {
    setBoyToPermanentDelete(id);
    setPermanentDeleteModalOpen(true);
  };

  const handlePermanentDelete = async () => {
    if (boyToPermanentDelete) {
      try {
        const res = await fetch(`/api/admin/delivery-boys/${boyToPermanentDelete}/permanent`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}` }
        });
        const data = await res.json();
        if (res.ok) {
          showToast(data.message || "Delivery boy permanently deleted", "success");
          loadDeletedBoys();
        } else {
          showToast(data.message || "Failed to permanently delete", "error");
        }
      } catch (error) {
        showToast("Error permanently deleting delivery boy", "error");
      } finally {
        setPermanentDeleteModalOpen(false);
        setBoyToPermanentDelete(null);
      }
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/delivery-boys/${id}/restore`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}` }
      });
      if (res.ok) {
        showToast("Delivery boy restored successfully", "success");
        loadDeletedBoys();
      } else {
        showToast("Failed to restore delivery boy", "error");
      }
    } catch (error) {
      showToast("Error restoring delivery boy", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingBoy ? `/api/admin/delivery-boys/${editingBoy._id}` : "/api/admin/delivery-boys";
      const method = editingBoy ? "PUT" : "POST";

      const payload: any = { ...formData };
      if (editingBoy && !payload.password) delete payload.password;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Delivery staff ${editingBoy ? 'updated' : 'created'} successfully`, "success");
        setIsModalOpen(false);
        loadDeliveryBoys();
      } else {
        showToast(data.message || "Action failed", "error");
      }
    } catch (error) {
      showToast("Network error", "error");
    }
  };

  // Filter list
  const activeList = deliveryBoys.filter(boy => {
    if (viewFilter === "AVAILABLE") return boy.availability === "AVAILABLE";
    if (viewFilter === "BUSY") return boy.availability === "BUSY";
    if (viewFilter === "INACTIVE") return boy.availability === "INACTIVE";
    return true;
  });

  const displayList = (viewFilter === "TRASH" ? deletedBoys : activeList).filter(boy =>
    boy.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    boy.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    boy.mobile?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main dark:text-text-main">
            Delivery Fleet Management
          </h1>
          <p className="text-muted text-sm mt-1">
            Monitor live fleet availability, performance KPIs, order history, and staff accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadDeliveryBoys}
            className="p-2 border border-border-main bg-surface rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-muted"
            title="Refresh fleet data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Delivery Boy
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="premium-card p-5 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap bg-surface border border-border-main rounded-lg p-1 text-xs font-semibold">
            <button
              onClick={() => setViewFilter("ALL")}
              className={`px-3 py-1.5 rounded-md transition-all ${viewFilter === "ALL" ? "bg-primary text-white shadow-xs" : "text-muted hover:text-text-main"}`}
            >
              All Staff ({deliveryBoys.length})
            </button>
            <button
              onClick={() => setViewFilter("AVAILABLE")}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${viewFilter === "AVAILABLE" ? "bg-emerald-600 text-white shadow-xs" : "text-muted hover:text-text-main"}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Available ({deliveryBoys.filter(b => b.availability === "AVAILABLE").length})
            </button>
            <button
              onClick={() => setViewFilter("BUSY")}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${viewFilter === "BUSY" ? "bg-amber-600 text-white shadow-xs" : "text-muted hover:text-text-main"}`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Busy ({deliveryBoys.filter(b => b.availability === "BUSY").length})
            </button>
            <button
              onClick={() => setViewFilter("INACTIVE")}
              className={`px-3 py-1.5 rounded-md transition-all ${viewFilter === "INACTIVE" ? "bg-gray-600 text-white shadow-xs" : "text-muted hover:text-text-main"}`}
            >
              Inactive ({deliveryBoys.filter(b => !b.active).length})
            </button>
            <button
              onClick={() => setViewFilter("TRASH")}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${viewFilter === "TRASH" ? "bg-rose-700 text-white shadow-xs" : "text-muted hover:text-text-main"}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Trash ({deletedBoys.length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface border border-border-main rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Table of Delivery Boys */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted uppercase bg-surface border-b border-border-main">
              <tr>
                <th className="px-4 py-3">Delivery Boy</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Availability</th>
                <th className="px-4 py-3 text-center">Active Deliveries</th>
                <th className="px-4 py-3 text-center">Completed</th>
                <th className="px-4 py-3 text-center">Completion Rate</th>
                <th className="px-4 py-3 text-center">Rating</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-primary animate-spin mb-2" />
                      <p>Loading delivery fleet...</p>
                    </div>
                  </td>
                </tr>
              ) : displayList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <ShieldAlert className="w-10 h-10 text-muted mb-2" />
                      <p className="font-semibold text-text-main">No delivery boys found</p>
                      <p className="text-xs text-muted mt-1">Try adjusting your filters or search query</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayList.map((boy) => (
                  <tr key={boy._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    {/* Name & Photo */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 shrink-0">
                          {boy.profilePic ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={boy.profilePic} alt={boy.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            boy.name?.charAt(0).toUpperCase() || "D"
                          )}
                        </div>
                        <div>
                          <button
                            onClick={() => openPerformanceDrawer(boy._id)}
                            className="font-semibold text-text-main hover:text-primary transition-colors text-left flex items-center gap-1 group"
                          >
                            <span>{boy.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                          </button>
                          <p className="text-xs text-muted truncate max-w-xs">{boy.address || "No address specified"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-4">
                      <div className="text-text-main font-medium">{boy.mobile}</div>
                      <div className="text-xs text-muted truncate max-w-[180px]">{boy.email}</div>
                    </td>

                    {/* Availability */}
                    <td className="px-4 py-4">
                      {viewFilter === "TRASH" ? (
                        <span className="px-2.5 py-1 text-xs rounded-full font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                          Deleted
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-semibold border ${
                            boy.availability === "AVAILABLE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                              : boy.availability === "BUSY"
                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                              : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/60 dark:text-gray-400 dark:border-gray-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              boy.availability === "AVAILABLE"
                                ? "bg-emerald-500"
                                : boy.availability === "BUSY"
                                ? "bg-amber-500"
                                : "bg-gray-400"
                            }`}
                          />
                          {boy.availability === "AVAILABLE"
                            ? "Available"
                            : boy.availability === "BUSY"
                            ? `Busy (${boy.activeDeliveries || 0})`
                            : "Inactive"}
                        </span>
                      )}
                    </td>

                    {/* Active Deliveries */}
                    <td className="px-4 py-4 text-center font-semibold text-text-main">
                      {boy.activeDeliveries || 0}
                    </td>

                    {/* Completed */}
                    <td className="px-4 py-4 text-center font-medium text-text-main">
                      {boy.completedDeliveries || 0}
                    </td>

                    {/* Completion Rate */}
                    <td className="px-4 py-4 text-center">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {boy.completionRate ?? 100}%
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{(boy.avgRating || 5.0).toFixed(1)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {viewFilter !== "TRASH" ? (
                          <>
                            <button
                              onClick={() => openPerformanceDrawer(boy._id)}
                              className="px-2.5 py-1 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
                              title="Performance & Order History"
                            >
                              Profile
                            </button>
                            <button
                              onClick={() => handleToggleActive(boy)}
                              className={`p-1.5 rounded-md transition-colors ${
                                boy.active
                                  ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                  : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                              }`}
                              title={boy.active ? "Click to Deactivate" : "Click to Activate"}
                            >
                              {boy.active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(boy)}
                              className="p-1.5 text-muted hover:text-primary transition-colors rounded-md hover:bg-black/5 dark:hover:bg-white/5"
                              title="Edit Details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => confirmDelete(boy._id)}
                              className="p-1.5 text-muted hover:text-rose-600 transition-colors rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              title="Move to Trash"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRestore(boy._id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                              title="Restore Staff"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => confirmPermanentDelete(boy._id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Delete Permanently"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED PROFILE & PERFORMANCE MODAL / DRAWER */}
      {selectedBoyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background-main w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] border border-border-main overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-border-main bg-surface">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shrink-0">
                  {performanceData?.deliveryBoy?.profilePic ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={performanceData.deliveryBoy.profilePic} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    performanceData?.deliveryBoy?.name?.charAt(0).toUpperCase() || "D"
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                    <span>{performanceData?.deliveryBoy?.name || "Delivery Partner"}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                      performanceData?.deliveryBoy?.active
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                    }`}>
                      {performanceData?.deliveryBoy?.active ? "Active Account" : "Deactivated"}
                    </span>
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-muted mt-1">
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {performanceData?.deliveryBoy?.mobile}</span>
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {performanceData?.deliveryBoy?.email}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedBoyId(null)}
                className="p-2 text-muted hover:text-text-main rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Date Filter Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface p-3 rounded-xl border border-border-main">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Performance Date Window
                </span>
                <div className="flex gap-1.5 text-xs font-medium">
                  {["ALL", "TODAY", "THIS_WEEK", "THIS_MONTH"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => handlePerfDateChange(filter)}
                      className={`px-3 py-1.5 rounded-md transition-colors ${
                        perfDateFilter === filter
                          ? "bg-primary text-white shadow-xs"
                          : "text-muted hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      {filter.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* KPI Cards Grid */}
              {perfLoading ? (
                <div className="p-8 text-center text-muted">
                  <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
                  <p>Calculating performance statistics...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-border-main bg-card text-center">
                    <p className="text-2xl font-bold text-text-main">
                      {performanceData?.performance?.totalAssigned || 0}
                    </p>
                    <p className="text-xs text-muted mt-1">Total Assigned</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border-main bg-card text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {performanceData?.performance?.activeDeliveries || 0}
                    </p>
                    <p className="text-xs text-muted mt-1">Currently Active</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border-main bg-card text-center">
                    <p className="text-2xl font-bold text-emerald-600">
                      {performanceData?.performance?.completedDeliveries || 0}
                    </p>
                    <p className="text-xs text-muted mt-1">Completed</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border-main bg-card text-center">
                    <p className="text-2xl font-bold text-rose-600">
                      {performanceData?.performance?.failedDeliveries || 0}
                    </p>
                    <p className="text-xs text-muted mt-1">Failed Deliveries</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border-main bg-card text-center">
                    <p className="text-2xl font-bold text-text-main">
                      {performanceData?.performance?.completionRate ?? 100}%
                    </p>
                    <p className="text-xs text-muted mt-1">Completion Rate</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border-main bg-card text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {performanceData?.performance?.avgDeliveryTimeMinutes || 25}m
                    </p>
                    <p className="text-xs text-muted mt-1">Avg Delivery Time</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border-main bg-card text-center sm:col-span-2">
                    <div className="flex items-center justify-center gap-1.5">
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      <span className="text-2xl font-bold text-text-main">
                        {(performanceData?.performance?.avgRating || 5.0).toFixed(1)}
                      </span>
                      <span className="text-xs text-muted">
                        ({performanceData?.performance?.totalRatings || 0} reviews)
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1">Customer Rating Average</p>
                  </div>
                </div>
              )}

              {/* Order History Table */}
              <div>
                <h4 className="text-sm font-bold text-text-main mb-3 flex items-center justify-between">
                  <span>Assigned Order History</span>
                  <span className="text-xs font-normal text-muted">Latest deliveries handled</span>
                </h4>
                <div className="border border-border-main rounded-xl overflow-hidden bg-surface">
                  <div className="overflow-x-auto max-h-60">
                    <table className="w-full text-xs text-left">
                      <thead className="text-muted uppercase bg-card border-b border-border-main">
                        <tr>
                          <th className="px-3 py-2.5">Order ID</th>
                          <th className="px-3 py-2.5">Customer</th>
                          <th className="px-3 py-2.5">Amount</th>
                          <th className="px-3 py-2.5">Status</th>
                          <th className="px-3 py-2.5">Date</th>
                          <th className="px-3 py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-main">
                        {ordersLoading ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-6 text-center text-muted">
                              Loading orders...
                            </td>
                          </tr>
                        ) : boyOrders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-6 text-center text-muted">
                              No orders assigned to this delivery boy yet.
                            </td>
                          </tr>
                        ) : (
                          boyOrders.map((ord: any) => (
                            <tr key={ord._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                              <td className="px-3 py-2.5 font-medium text-primary">
                                #{ord._id.slice(-6).toUpperCase()}
                              </td>
                              <td className="px-3 py-2.5 text-text-main">{ord.customer?.name || "Customer"}</td>
                              <td className="px-3 py-2.5 font-semibold text-text-main">₹{(ord.totalAmount || 0).toFixed(2)}</td>
                              <td className="px-3 py-2.5">
                                <OrderStatusBadge status={ord.status} />
                              </td>
                              <td className="px-3 py-2.5 text-muted">
                                {new Date(ord.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <Link
                                  href={`/admin/orders/${ord._id}`}
                                  className="text-primary hover:underline font-medium"
                                >
                                  View
                                </Link>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border-main bg-surface flex justify-end">
              <button
                onClick={() => setSelectedBoyId(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border-main hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background-main w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] border border-border-main overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-border-main bg-surface">
              <h3 className="text-lg font-bold text-text-main">
                {editingBoy ? "Edit Delivery Partner" : "Add New Delivery Partner"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="delivery-boy-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface border border-border-main rounded-lg text-sm text-text-main focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted mb-1">Mobile</label>
                    <input
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface border border-border-main rounded-lg text-sm text-text-main focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-muted mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    disabled={!!editingBoy}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 bg-surface border border-border-main rounded-lg text-sm text-text-main focus:outline-none focus:border-primary disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-muted mb-1">
                    {editingBoy ? "Password (leave blank to keep current)" : "Password"}
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                    <input
                      type="text"
                      required={!editingBoy}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingBoy ? "••••••••" : "Temporary password"}
                      className="w-full pl-9 pr-3.5 py-2 bg-surface border border-border-main rounded-lg text-sm text-text-main focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-muted mb-1">Service Address / Area</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Harsul, Sambhaji Nagar"
                    className="w-full px-3.5 py-2 bg-surface border border-border-main rounded-lg text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="boy-active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-primary bg-surface border-border-main rounded focus:ring-primary"
                  />
                  <label htmlFor="boy-active" className="text-sm font-medium text-text-main cursor-pointer">
                    Account Active & Ready for Assignments
                  </label>
                </div>
              </form>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-border-main bg-surface">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-text-main bg-background-main border border-border-main rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="delivery-boy-form"
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
              >
                {editingBoy ? "Save Changes" : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOFT DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background-main w-full max-w-md rounded-2xl shadow-2xl p-6 text-center border border-border-main">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-text-main mb-2">Move to Trash?</h3>
            <p className="text-muted text-sm mb-6">
              This delivery staff member will be moved to the Trash bin and disabled from order dispatch. You can restore them at any time.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border-main bg-surface hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
              >
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT DELETE CONFIRMATION MODAL */}
      {permanentDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background-main w-full max-w-md rounded-2xl shadow-2xl p-6 text-center border border-border-main">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-text-main mb-2">Permanently Delete?</h3>
            <p className="text-muted text-sm mb-6">
              This action cannot be undone. Note: if this delivery boy has historical completed or active orders, the database will preserve them to maintain audit trails.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setPermanentDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border-main bg-surface hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
