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
  CheckCircle2,
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
  PackageCheck,
  LayoutGrid,
  List,
  User,
  Calendar,
  Eye,
  EyeOff,
  Truck,
  Activity,
  Sparkles
} from "lucide-react";
import { useToast } from "@/components/ToastContext";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";

export default function DeliveryBoysPage() {
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [deletedBoys, setDeletedBoys] = useState<any[]>([]);
  const [viewFilter, setViewFilter] = useState<"ALL" | "AVAILABLE" | "BUSY" | "INACTIVE" | "TRASH">("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Create / Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBoy, setEditingBoy] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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
    setFormError(null);
    setShowPassword(false);
    setFormData({ name: "", email: "", mobile: "", password: "", address: "", birthYear: "", active: true });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (boy: any) => {
    setEditingBoy(boy);
    setFormError(null);
    setShowPassword(false);
    setFormData({
      name: boy.name || "",
      email: boy.email || "",
      mobile: boy.mobile || "",
      password: "",
      address: boy.address || "",
      birthYear: boy.birthYear ? String(boy.birthYear) : "",
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
          showToast("Delivery staff moved to trash", "success");
          loadDeliveryBoys();
        } else {
          showToast("Failed to delete delivery staff", "error");
        }
      } catch (error) {
        showToast("Error deleting delivery staff", "error");
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
          showToast(data.message || "Delivery staff permanently deleted", "success");
          loadDeletedBoys();
        } else {
          showToast(data.message || "Failed to permanently delete", "error");
        }
      } catch (error) {
        showToast("Error permanently deleting delivery staff", "error");
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
        showToast("Delivery staff restored successfully", "success");
        loadDeletedBoys();
      } else {
        showToast("Failed to restore delivery staff", "error");
      }
    } catch (error) {
      showToast("Error restoring delivery staff", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.name.trim()) {
      setFormError("Full name is required");
      return;
    }
    if (!formData.mobile.trim() || formData.mobile.replace(/\D/g, '').length < 10) {
      setFormError("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!editingBoy && !formData.email.trim()) {
      setFormError("Email address is required");
      return;
    }
    if (!editingBoy && (!formData.password || formData.password.length < 6)) {
      setFormError("Password must be at least 6 characters long");
      return;
    }
    if (formData.birthYear && (Number(formData.birthYear) < 1940 || Number(formData.birthYear) > new Date().getFullYear() - 18)) {
      setFormError(`Birth year must indicate age 18+ (before ${new Date().getFullYear() - 18})`);
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingBoy ? `/api/admin/delivery-boys/${editingBoy._id}` : "/api/admin/delivery-boys";
      const method = editingBoy ? "PUT" : "POST";

      const payload: any = { ...formData };
      if (editingBoy && !payload.password) delete payload.password;
      if (payload.birthYear) payload.birthYear = Number(payload.birthYear);

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
        setFormError(data.message || "Action failed");
        showToast(data.message || "Action failed", "error");
      }
    } catch (error) {
      setFormError("Network connection error. Please try again.");
      showToast("Network error", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter list
  const activeList = deliveryBoys.filter(boy => {
    if (viewFilter === "AVAILABLE") return boy.availability === "AVAILABLE";
    if (viewFilter === "BUSY") return boy.availability === "BUSY";
    if (viewFilter === "INACTIVE") return !boy.active;
    return true;
  });

  const displayList = (viewFilter === "TRASH" ? deletedBoys : activeList).filter(boy =>
    boy.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    boy.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    boy.mobile?.includes(searchTerm) ||
    boy.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // High-level fleet metrics
  const totalStaffCount = deliveryBoys.length;
  const availableCount = deliveryBoys.filter(b => b.availability === "AVAILABLE").length;
  const busyCount = deliveryBoys.filter(b => b.availability === "BUSY").length;
  const inactiveCount = deliveryBoys.filter(b => !b.active).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-main">
                Delivery Fleet Management
              </h1>
              <p className="text-muted text-xs sm:text-sm mt-0.5">
                Manage delivery staff, track real-time assignments, and configure accounts
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              if (viewFilter === "TRASH") loadDeletedBoys();
              else loadDeliveryBoys();
            }}
            className="p-2.5 border border-border-main bg-surface rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-muted hover:text-text-main shadow-xs"
            title="Refresh fleet data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-primary" : ""}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-[#370617] text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg text-sm active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Delivery Boy</span>
          </button>
        </div>
      </div>

      {/* Fleet KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface dark:bg-card border border-border-main p-4 rounded-2xl shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">Total Fleet</p>
            <h3 className="text-xl font-bold text-text-main mt-0.5">{totalStaffCount}</h3>
          </div>
        </div>

        <div className="bg-surface dark:bg-card border border-border-main p-4 rounded-2xl shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">Available</p>
            <div className="flex items-center gap-2 mt-0.5">
              <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{availableCount}</h3>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Ready
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface dark:bg-card border border-border-main p-4 rounded-2xl shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">On Delivery</p>
            <div className="flex items-center gap-2 mt-0.5">
              <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400">{busyCount}</h3>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Dispatched
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface dark:bg-card border border-border-main p-4 rounded-2xl shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center border border-gray-200 dark:border-gray-700 shrink-0">
            <UserX className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">Inactive</p>
            <h3 className="text-xl font-bold text-text-main mt-0.5">{inactiveCount}</h3>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-surface dark:bg-card border border-border-main rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center bg-background dark:bg-surface border border-border-main rounded-xl p-1 gap-1 text-xs font-semibold">
            <button
              onClick={() => setViewFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewFilter === "ALL" 
                  ? "bg-primary text-white shadow-xs" 
                  : "text-muted hover:text-text-main"
              }`}
            >
              All Staff ({deliveryBoys.length})
            </button>
            <button
              onClick={() => setViewFilter("AVAILABLE")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewFilter === "AVAILABLE" 
                  ? "bg-emerald-600 text-white shadow-xs" 
                  : "text-muted hover:text-text-main"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Available ({deliveryBoys.filter(b => b.availability === "AVAILABLE").length})
            </button>
            <button
              onClick={() => setViewFilter("BUSY")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewFilter === "BUSY" 
                  ? "bg-amber-600 text-white shadow-xs" 
                  : "text-muted hover:text-text-main"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Busy ({deliveryBoys.filter(b => b.availability === "BUSY").length})
            </button>
            <button
              onClick={() => setViewFilter("INACTIVE")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewFilter === "INACTIVE" 
                  ? "bg-gray-700 text-white shadow-xs" 
                  : "text-muted hover:text-text-main"
              }`}
            >
              Inactive ({deliveryBoys.filter(b => !b.active).length})
            </button>
            <button
              onClick={() => setViewFilter("TRASH")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewFilter === "TRASH" 
                  ? "bg-rose-700 text-white shadow-xs" 
                  : "text-muted hover:text-text-main"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Trash ({deletedBoys.length})
            </button>
          </div>

          {/* Search & View Mode Switcher */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, phone, area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background dark:bg-surface border border-border-main rounded-xl text-sm text-text-main placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text-main"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center bg-background dark:bg-surface border border-border-main rounded-xl p-1 shrink-0">
              <button
                onClick={() => setViewMode("GRID")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "GRID" 
                    ? "bg-surface dark:bg-card text-primary shadow-xs font-semibold" 
                    : "text-muted hover:text-text-main"
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("TABLE")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "TABLE" 
                    ? "bg-surface dark:bg-card text-primary shadow-xs font-semibold" 
                    : "text-muted hover:text-text-main"
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 border border-primary/20">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <p className="font-semibold text-text-main">Loading Delivery Fleet...</p>
            <p className="text-xs text-muted mt-1">Fetching live staff status and assignments</p>
          </div>
        ) : displayList.length === 0 ? (
          /* EMPTY STATE */
          <div className="py-16 text-center border-2 border-dashed border-border-main rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 border border-primary/20">
              <Truck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-text-main">No Delivery Personnel Found</h3>
            <p className="text-xs sm:text-sm text-muted mt-1 max-w-sm mx-auto">
              {searchTerm 
                ? `No delivery staff matched "${searchTerm}". Try a different search term or filter.`
                : "No delivery boys currently registered. Click below to add a new delivery partner."}
            </p>
            {!searchTerm && viewFilter !== "TRASH" && (
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 inline-flex items-center gap-2 bg-primary hover:bg-[#370617] text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Delivery Boy
              </button>
            )}
          </div>
        ) : viewMode === "GRID" ? (
          /* ========================================================
             PREMIUM CARD GRID VIEW (DESKTOP, TABLET & MOBILE)
             ======================================================== */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
            {displayList.map((boy) => {
              const isAvailable = boy.availability === "AVAILABLE";
              const isBusy = boy.availability === "BUSY";
              const isActive = boy.active;

              return (
                <div
                  key={boy._id}
                  className="bg-surface dark:bg-card border border-border-main rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Top Burgundy Accent Indicator */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary-light to-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div>
                    {/* Card Header: Avatar, Name & Status */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/25 text-primary flex items-center justify-center font-bold text-base border border-primary/20 shrink-0 shadow-xs">
                          {boy.profilePic ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={boy.profilePic} alt={boy.name} className="w-full h-full object-cover rounded-2xl" />
                          ) : (
                            boy.name?.charAt(0).toUpperCase() || "D"
                          )}
                          <span 
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-surface dark:border-card ${
                              isActive ? "bg-emerald-500" : "bg-gray-400"
                            }`}
                            title={isActive ? "Account Active" : "Account Inactive"}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <button
                            onClick={() => openPerformanceDrawer(boy._id)}
                            className="font-bold text-text-main hover:text-primary transition-colors text-left text-base truncate block w-full group/name"
                            title={boy.name}
                          >
                            <span className="truncate">{boy.name}</span>
                          </button>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-mono text-muted">#{boy._id.slice(-5).toUpperCase()}</span>
                            {boy.birthYear && (
                              <span className="text-[11px] text-muted font-medium">
                                • Age {new Date().getFullYear() - Number(boy.birthYear)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-semibold border ${
                        viewFilter === "TRASH"
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                          : isAvailable
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                          : isBusy
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800/80 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          viewFilter === "TRASH" ? "bg-rose-500"
                          : isAvailable ? "bg-emerald-500 animate-pulse"
                          : isBusy ? "bg-amber-500"
                          : "bg-gray-400"
                        }`} />
                        {viewFilter === "TRASH" ? "Trash"
                          : isAvailable ? "Available"
                          : isBusy ? `Busy (${boy.activeDeliveries || 0})`
                          : "Inactive"}
                      </span>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-2 py-3 border-y border-border-main/70 text-xs">
                      <div className="flex items-center gap-2.5 text-text-main font-medium">
                        <div className="w-6 h-6 rounded-lg bg-background dark:bg-surface border border-border-main flex items-center justify-center shrink-0 text-muted">
                          <Phone className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <a href={`tel:${boy.mobile}`} className="hover:text-primary transition-colors truncate">
                          {boy.mobile || "No phone provided"}
                        </a>
                      </div>

                      <div className="flex items-center gap-2.5 text-muted">
                        <div className="w-6 h-6 rounded-lg bg-background dark:bg-surface border border-border-main flex items-center justify-center shrink-0 text-muted">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate" title={boy.email}>{boy.email}</span>
                      </div>

                      <div className="flex items-center gap-2.5 text-muted">
                        <div className="w-6 h-6 rounded-lg bg-background dark:bg-surface border border-border-main flex items-center justify-center shrink-0 text-muted">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate" title={boy.address || "No address assigned"}>
                          {boy.address || "Coverage: Unassigned"}
                        </span>
                      </div>
                    </div>

                    {/* Micro Performance Metrics */}
                    <div className="grid grid-cols-3 gap-2 py-3 text-center">
                      <div className="bg-background/80 dark:bg-surface/50 border border-border-main/70 rounded-xl p-2">
                        <p className="text-[11px] text-muted font-medium">Active</p>
                        <p className="text-sm font-bold text-text-main mt-0.5">{boy.activeDeliveries || 0}</p>
                      </div>
                      <div className="bg-background/80 dark:bg-surface/50 border border-border-main/70 rounded-xl p-2">
                        <p className="text-[11px] text-muted font-medium">Done</p>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {boy.completedDeliveries || 0}
                        </p>
                      </div>
                      <div className="bg-background/80 dark:bg-surface/50 border border-border-main/70 rounded-xl p-2">
                        <p className="text-[11px] text-muted font-medium">Rating</p>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-bold text-text-main">{(boy.avgRating || 5.0).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 mt-1 border-t border-border-main/70 flex items-center justify-between gap-2">
                    {viewFilter !== "TRASH" ? (
                      <>
                        <button
                          onClick={() => openPerformanceDrawer(boy._id)}
                          className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1 shadow-xs"
                        >
                          <span>Profile</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleActive(boy)}
                            className={`p-2 rounded-xl border border-border-main transition-colors ${
                              boy.active
                                ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-200/50"
                                : "text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5"
                            }`}
                            title={boy.active ? "Account Active (Click to Deactivate)" : "Account Deactivated (Click to Activate)"}
                          >
                            {boy.active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(boy)}
                            className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-xl border border-border-main transition-colors"
                            title="Edit Staff Credentials"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(boy._id)}
                            className="p-2 text-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-border-main transition-colors"
                            title="Move to Trash"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRestore(boy._id)}
                          className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition-all flex items-center justify-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore Staff</span>
                        </button>
                        <button
                          onClick={() => confirmPermanentDelete(boy._id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 transition-colors"
                          title="Delete Permanently"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ========================================================
             POLISHED TABLE VIEW
             ======================================================== */
          <div className="overflow-x-auto rounded-xl border border-border-main">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted uppercase bg-background dark:bg-surface border-b border-border-main">
                <tr>
                  <th className="px-4 py-3.5">Delivery Boy</th>
                  <th className="px-4 py-3.5">Contact</th>
                  <th className="px-4 py-3.5">Availability</th>
                  <th className="px-4 py-3.5 text-center">Active Deliveries</th>
                  <th className="px-4 py-3.5 text-center">Completed</th>
                  <th className="px-4 py-3.5 text-center">Completion Rate</th>
                  <th className="px-4 py-3.5 text-center">Rating</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main bg-surface dark:bg-card">
                {displayList.map((boy) => (
                  <tr key={boy._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 shrink-0">
                          {boy.profilePic ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={boy.profilePic} alt={boy.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            boy.name?.charAt(0).toUpperCase() || "D"
                          )}
                        </div>
                        <div>
                          <button
                            onClick={() => openPerformanceDrawer(boy._id)}
                            className="font-bold text-text-main hover:text-primary transition-colors text-left flex items-center gap-1 group"
                          >
                            <span>{boy.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                          </button>
                          <p className="text-xs text-muted truncate max-w-xs">{boy.address || "Coverage: Unassigned"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-text-main font-medium">{boy.mobile}</div>
                      <div className="text-xs text-muted truncate max-w-[180px]">{boy.email}</div>
                    </td>

                    <td className="px-4 py-4">
                      {viewFilter === "TRASH" ? (
                        <span className="px-2.5 py-1 text-xs rounded-full font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
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
                                ? "bg-emerald-500 animate-pulse"
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

                    <td className="px-4 py-4 text-center font-bold text-text-main">
                      {boy.activeDeliveries || 0}
                    </td>

                    <td className="px-4 py-4 text-center font-semibold text-text-main">
                      {boy.completedDeliveries || 0}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {boy.completionRate ?? 100}%
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{(boy.avgRating || 5.0).toFixed(1)}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {viewFilter !== "TRASH" ? (
                          <>
                            <button
                              onClick={() => openPerformanceDrawer(boy._id)}
                              className="px-2.5 py-1 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-lg transition-colors"
                              title="Performance & Order History"
                            >
                              Profile
                            </button>
                            <button
                              onClick={() => handleToggleActive(boy)}
                              className={`p-1.5 rounded-lg border border-border-main transition-colors ${
                                boy.active
                                  ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-200/50"
                                  : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                              }`}
                              title={boy.active ? "Click to Deactivate" : "Click to Activate"}
                            >
                              {boy.active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(boy)}
                              className="p-1.5 text-muted hover:text-primary transition-colors rounded-lg border border-border-main hover:bg-black/5 dark:hover:bg-white/5"
                              title="Edit Details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => confirmDelete(boy._id)}
                              className="p-1.5 text-muted hover:text-rose-600 transition-colors rounded-lg border border-border-main hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              title="Move to Trash"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRestore(boy._id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                              title="Restore Staff"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => confirmPermanentDelete(boy._id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                              title="Delete Permanently"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          PREMIUM ADD / EDIT DELIVERY BOY MODAL
          ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in-0 duration-200">
          <div className="bg-surface dark:bg-card w-full max-w-xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] border border-border-main overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-border-main bg-background/60 dark:bg-surface/50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-main">
                    {editingBoy ? "Edit Delivery Partner" : "Add New Delivery Partner"}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    {editingBoy ? "Update staff account credentials and coverage area" : "Register a new delivery boy to handle customer dispatches"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-9 h-9 rounded-xl border border-border-main flex items-center justify-center text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form id="delivery-boy-form" onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name & Mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-1.5">
                      Full Name <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full pl-10 pr-4 py-2.5 bg-background dark:bg-surface border border-border-main rounded-xl text-sm text-text-main placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-1.5">
                      Mobile Number <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                      <input
                        type="tel"
                        required
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        placeholder="10-digit mobile number"
                        className="w-full pl-10 pr-4 py-2.5 bg-background dark:bg-surface border border-border-main rounded-xl text-sm text-text-main placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-text-main uppercase tracking-wider">
                      Email Address <span className="text-primary">*</span>
                    </label>
                    {editingBoy && (
                      <span className="text-[10px] text-muted font-medium bg-background px-2 py-0.5 rounded border border-border-main">
                        Account email cannot be modified
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                    <input
                      type="email"
                      required
                      disabled={!!editingBoy}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. delivery@daarudoor.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-background dark:bg-surface border border-border-main rounded-xl text-sm text-text-main placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Password with Visibility Toggle */}
                <div>
                  <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-1.5">
                    {editingBoy ? "Password (Leave blank to keep unchanged)" : "Password *"}
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required={!editingBoy}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingBoy ? "••••••••" : "Minimum 6 characters"}
                      className="w-full pl-10 pr-11 py-2.5 bg-background dark:bg-surface border border-border-main rounded-xl text-sm text-text-main placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-text-main transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Address & Birth Year */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-1.5">
                      Service Area / Coverage Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="e.g. Sambhaji Nagar, Harsul"
                        className="w-full pl-10 pr-4 py-2.5 bg-background dark:bg-surface border border-border-main rounded-xl text-sm text-text-main placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-1.5">
                      Birth Year
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                      <input
                        type="number"
                        min="1950"
                        max={new Date().getFullYear() - 18}
                        value={formData.birthYear}
                        onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                        placeholder="e.g. 1998"
                        className="w-full pl-10 pr-4 py-2.5 bg-background dark:bg-surface border border-border-main rounded-xl text-sm text-text-main placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Account Active Status Toggle Card */}
                <div 
                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    formData.active
                      ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                      : "bg-background dark:bg-surface border-border-main"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      formData.active
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "bg-gray-200 dark:bg-gray-800 text-gray-500"
                    }`}>
                      {formData.active ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-main">
                        {formData.active ? "Account Active & Ready for Orders" : "Account Deactivated (Standby)"}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {formData.active 
                          ? "This delivery boy will be eligible for instant order dispatches."
                          : "Temporarily prevent orders from being routed to this staff member."}
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>
              </form>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-main bg-background/60 dark:bg-surface/50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-text-main bg-surface dark:bg-card border border-border-main rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="delivery-boy-form"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-[#370617] rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>{editingBoy ? "Save Changes" : "Create Account"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          DETAILED PROFILE & PERFORMANCE MODAL / DRAWER
          ======================================================== */}
      {selectedBoyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in-0 duration-200">
          <div className="bg-surface dark:bg-card w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] border border-border-main overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-border-main bg-background/50 dark:bg-surface/40">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/25 text-primary flex items-center justify-center font-bold text-xl border border-primary/20 shrink-0 shadow-xs">
                  {performanceData?.deliveryBoy?.profilePic ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={performanceData.deliveryBoy.profilePic} alt="" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    performanceData?.deliveryBoy?.name?.charAt(0).toUpperCase() || "D"
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-main flex items-center gap-2.5">
                    <span>{performanceData?.deliveryBoy?.name || "Delivery Partner"}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                      performanceData?.deliveryBoy?.active
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                        : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
                    }`}>
                      {performanceData?.deliveryBoy?.active ? "Active Staff" : "Deactivated"}
                    </span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted mt-1.5 font-medium">
                    <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-primary" /> {performanceData?.deliveryBoy?.mobile}</span>
                    <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {performanceData?.deliveryBoy?.email}</span>
                    {performanceData?.deliveryBoy?.address && (
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {performanceData?.deliveryBoy?.address}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedBoyId(null)}
                className="w-9 h-9 rounded-xl border border-border-main flex items-center justify-center text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Date Filter Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-background dark:bg-surface p-3.5 rounded-2xl border border-border-main">
                <span className="text-xs font-bold text-text-main uppercase tracking-wider">
                  Performance Window
                </span>
                <div className="flex gap-1.5 text-xs font-semibold">
                  {["ALL", "TODAY", "THIS_WEEK", "THIS_MONTH"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => handlePerfDateChange(filter)}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        perfDateFilter === filter
                          ? "bg-primary text-white shadow-xs"
                          : "text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      {filter.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* KPI Cards Grid */}
              {perfLoading ? (
                <div className="py-12 text-center text-muted">
                  <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
                  <p className="text-sm font-semibold">Calculating performance statistics...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl border border-border-main bg-background dark:bg-surface text-center shadow-xs">
                    <p className="text-2xl font-bold text-text-main">
                      {performanceData?.performance?.totalAssigned || 0}
                    </p>
                    <p className="text-xs text-muted font-medium mt-1">Total Assigned</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border-main bg-background dark:bg-surface text-center shadow-xs">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {performanceData?.performance?.activeDeliveries || 0}
                    </p>
                    <p className="text-xs text-muted font-medium mt-1">Currently Active</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border-main bg-background dark:bg-surface text-center shadow-xs">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {performanceData?.performance?.completedDeliveries || 0}
                    </p>
                    <p className="text-xs text-muted font-medium mt-1">Completed</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border-main bg-background dark:bg-surface text-center shadow-xs">
                    <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                      {performanceData?.performance?.failedDeliveries || 0}
                    </p>
                    <p className="text-xs text-muted font-medium mt-1">Failed Deliveries</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border-main bg-background dark:bg-surface text-center shadow-xs">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {performanceData?.performance?.completionRate ?? 100}%
                    </p>
                    <p className="text-xs text-muted font-medium mt-1">Completion Rate</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border-main bg-background dark:bg-surface text-center shadow-xs">
                    <p className="text-2xl font-bold text-text-main">
                      {performanceData?.performance?.avgDeliveryTimeMinutes || 25}m
                    </p>
                    <p className="text-xs text-muted font-medium mt-1">Avg Delivery Time</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border-main bg-background dark:bg-surface text-center sm:col-span-2 shadow-xs">
                    <div className="flex items-center justify-center gap-1.5">
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      <span className="text-2xl font-bold text-text-main">
                        {(performanceData?.performance?.avgRating || 5.0).toFixed(1)}
                      </span>
                      <span className="text-xs text-muted font-medium">
                        ({performanceData?.performance?.totalRatings || 0} reviews)
                      </span>
                    </div>
                    <p className="text-xs text-muted font-medium mt-1">Customer Rating Average</p>
                  </div>
                </div>
              )}

              {/* Order History Table */}
              <div>
                <h4 className="text-sm font-bold text-text-main mb-3 flex items-center justify-between">
                  <span>Assigned Order History</span>
                  <span className="text-xs font-normal text-muted">Latest deliveries handled by this partner</span>
                </h4>
                <div className="border border-border-main rounded-2xl overflow-hidden bg-background dark:bg-surface">
                  <div className="overflow-x-auto max-h-60">
                    <table className="w-full text-xs text-left">
                      <thead className="text-muted uppercase bg-surface dark:bg-card border-b border-border-main">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Order ID</th>
                          <th className="px-4 py-3 font-semibold">Customer</th>
                          <th className="px-4 py-3 font-semibold">Amount</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 font-semibold">Date</th>
                          <th className="px-4 py-3 text-right font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-main">
                        {ordersLoading ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-muted font-medium">
                              Loading order history...
                            </td>
                          </tr>
                        ) : boyOrders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-muted font-medium">
                              No orders assigned to this delivery boy yet.
                            </td>
                          </tr>
                        ) : (
                          boyOrders.map((ord: any) => (
                            <tr key={ord._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 font-bold text-primary">
                                #{ord._id.slice(-6).toUpperCase()}
                              </td>
                              <td className="px-4 py-3 font-medium text-text-main">{ord.customer?.name || "Customer"}</td>
                              <td className="px-4 py-3 font-bold text-text-main">₹{(ord.totalAmount || 0).toFixed(2)}</td>
                              <td className="px-4 py-3">
                                <OrderStatusBadge status={ord.status} />
                              </td>
                              <td className="px-4 py-3 text-muted">
                                {new Date(ord.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Link
                                  href={`/admin/orders/${ord._id}`}
                                  className="text-primary hover:underline font-bold"
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
            <div className="p-4 border-t border-border-main bg-background/50 dark:bg-surface/40 flex justify-end">
              <button
                onClick={() => setSelectedBoyId(null)}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-border-main bg-surface dark:bg-card hover:bg-black/5 dark:hover:bg-white/5 text-text-main transition-colors shadow-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SOFT DELETE CONFIRMATION MODAL
          ======================================================== */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in-0 duration-200">
          <div className="bg-surface dark:bg-card w-full max-w-md rounded-3xl shadow-2xl p-6 text-center border border-border-main animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-text-main mb-2">Move Staff to Trash?</h3>
            <p className="text-muted text-xs sm:text-sm mb-6 leading-relaxed">
              This delivery staff member will be moved to the Trash bin and disabled from order dispatches. You can restore them anytime.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-border-main bg-surface dark:bg-card text-text-main hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-md"
              >
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PERMANENT DELETE CONFIRMATION MODAL
          ======================================================== */}
      {permanentDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in-0 duration-200">
          <div className="bg-surface dark:bg-card w-full max-w-md rounded-3xl shadow-2xl p-6 text-center border border-border-main animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-800">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-text-main mb-2">Permanently Delete Staff?</h3>
            <p className="text-muted text-xs sm:text-sm mb-6 leading-relaxed">
              This action cannot be undone. All active credentials for this delivery personnel will be permanently purged.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setPermanentDeleteModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-border-main bg-surface dark:bg-card text-text-main hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-md"
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
