"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  MapPin, 
  Truck, 
  Calendar, 
  Phone, 
  Mail, 
  ShieldCheck, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Star,
  RefreshCw,
  Printer
} from "lucide-react";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { useToast } from "@/components/ToastContext";
import { LiveOrderMap } from "@/components/ui/LiveOrderMap";

export default function AdminOrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [noteText, setNoteText] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    targetStatus: string;
    reason?: string;
  } | null>(null);
  const { showToast } = useToast();

  const loadOrder = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        headers: { Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}` },
      });
      if (res.status === 401) {
        document.cookie = "adminAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();

    // Fetch delivery boys
    fetch(`/api/admin/delivery-boys`, {
      headers: { Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setDeliveryBoys(data.data.filter((db: any) => db.active));
      })
      .catch((e) => console.error(e));
  }, [id]);

  const executeStatusChange = async (newStatus: string, failureReason?: string) => {
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}`,
        },
        body: JSON.stringify({ 
          status: newStatus,
          failureReason: newStatus === "FAILED" ? failureReason : undefined
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
        showToast("Order status updated to " + newStatus, "success");
        setStatusModal(null);
      } else {
        showToast(data.message || "Failed to update status", "error");
      }
    } catch (error) {
      showToast("Network error while updating status", "error");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleStatusSelectChange = (newStatus: string) => {
    if (newStatus === "FAILED") {
      setStatusModal({ isOpen: true, targetStatus: "FAILED", reason: "" });
    } else if (newStatus === "CANCELLED") {
      setStatusModal({ isOpen: true, targetStatus: "CANCELLED" });
    } else {
      executeStatusChange(newStatus);
    }
  };

  const handleAssignDeliveryBoy = async (deliveryPartnerId: string) => {
    if (!deliveryPartnerId) return;

    try {
      if (deliveryPartnerId === "UNASSIGN") {
        const res = await fetch(`/api/admin/orders/${id}/unassign`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}`,
          },
          body: JSON.stringify({ note: "Unassigned by admin" }),
        });
        const data = await res.json();
        if (data.success) {
          setOrder(data.data);
          showToast("Delivery partner unassigned", "success");
        } else {
          showToast(data.message || "Failed to unassign", "error");
        }
      } else {
        const res = await fetch(`/api/admin/orders/${id}/assign`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}`,
          },
          body: JSON.stringify({ deliveryPartnerId }),
        });
        const data = await res.json();
        if (data.success) {
          setOrder(data.data);
          showToast("Delivery boy assigned successfully", "success");
        } else {
          showToast(data.message || "Failed to assign delivery boy", "error");
        }
      }
    } catch (error) {
      showToast("Network error while assigning delivery boy", "error");
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSubmittingNote(true);

    try {
      const res = await fetch(`/api/admin/orders/${id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}`,
        },
        body: JSON.stringify({ note: noteText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder({ ...order, internalNotes: data.data });
        setNoteText("");
        showToast("Internal note recorded", "success");
      } else {
        showToast(data.message || "Failed to add note", "error");
      }
    } catch (e) {
      showToast("Network error adding note", "error");
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) return <div className="p-8">Loading order details...</div>;
  if (!order) return <div className="p-8 text-red-500">Order not found.</div>;

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex justify-between items-center print:hidden">
        <Link href="/admin/orders" className="inline-flex items-center text-sm font-medium text-muted hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders Operations
        </Link>
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-1.5 px-3.5 py-2 border border-border-main rounded-lg text-xs font-semibold bg-surface hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      {/* Main Order Container */}
      <div className="space-y-6 print:hidden">
        {/* Order Header Card */}
        <div className="premium-card p-4 sm:p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-main">
                  Order #{order._id.slice(-6).toUpperCase()}
                </h1>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="text-xs text-muted mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Placed on {new Date(order.createdAt).toLocaleString()}</span>
              </p>
            </div>

            {/* Quick Status and Assignment Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <div className="flex-1 sm:flex-initial">
                <label className="block text-[10px] font-semibold uppercase text-muted mb-1">Update Status</label>
                <select 
                  value={order.status} 
                  onChange={(e) => handleStatusSelectChange(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 border border-border-main rounded-lg text-xs font-semibold bg-surface text-text-main focus:outline-none focus:border-primary"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="READY_FOR_PICKUP">READY FOR PICKUP</option>
                  <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                  <option value="ARRIVED">ARRIVED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="flex-1 sm:flex-initial">
                <label className="block text-[10px] font-semibold uppercase text-muted mb-1">Delivery Partner</label>
                <select 
                  value={order.deliveryPartner?._id || ""} 
                  onChange={(e) => handleAssignDeliveryBoy(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 border border-border-main rounded-lg text-xs font-semibold bg-surface text-text-main focus:outline-none focus:border-primary"
                >
                  <option value="" disabled>Select Delivery Boy</option>
                  {order.deliveryPartner && (
                    <option value="UNASSIGN">⚠️ Unassign Current Partner</option>
                  )}
                  {deliveryBoys.map(db => (
                    <option key={db._id} value={db._id}>
                      {db.name} ({db.availability})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Failure or Cancellation Alert */}
          {order.failureReason && (
            <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Delivery Failure Reason:</span> {order.failureReason}
                <p className="mt-0.5 opacity-90">Admin can reassign another delivery partner or set order back to Processing.</p>
              </div>
            </div>
          )}

          {order.cancelReason && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl flex items-start gap-2.5 text-xs text-gray-700 dark:text-gray-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Cancellation Reason:</span> {order.cancelReason}
              </div>
            </div>
          )}
        </div>

        {/* 4 Details Cards: Customer, Address, Partner, Age Check */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Customer Details */}
          <div className="premium-card p-5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
              <span>Customer Details</span>
            </h3>
            <p className="font-semibold text-text-main text-sm">{order.customer?.name || "Customer"}</p>
            <p className="text-xs text-muted mt-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> {order.customer?.mobile || "N/A"}
            </p>
            <p className="text-xs text-muted mt-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> {order.customer?.email || "N/A"}
            </p>
          </div>

          {/* Delivery Address */}
          <div className="premium-card p-5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>Delivery Address</span>
            </h3>
            {typeof order.deliveryAddress === 'object' ? (
              <div className="text-xs space-y-0.5 text-muted">
                <p className="font-semibold text-text-main">{order.deliveryAddress.fullName}</p>
                <p>{order.deliveryAddress.houseNo}, {order.deliveryAddress.area}</p>
                <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</p>
                <p className="pt-1 text-[11px] font-medium text-text-main">Phone: {order.deliveryAddress.mobile}</p>
              </div>
            ) : (
              <p className="text-xs text-muted">{order.deliveryAddress}</p>
            )}
          </div>

          {/* Delivery Partner */}
          <div className="premium-card p-5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-primary" />
              <span>Assigned Partner</span>
            </h3>
            {order.deliveryPartner ? (
              <div className="text-xs space-y-1">
                <p className="font-semibold text-text-main text-sm">{order.deliveryPartner.name}</p>
                <p className="text-muted flex items-center gap-1"><Phone className="w-3 h-3" /> {order.deliveryPartner.mobile}</p>
                {order.assignedAt && (
                  <p className="text-[11px] text-muted">
                    Assigned: {new Date(order.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
                <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {order.deliveryPartner.isOnline ? "Online" : "Offline"}
                </span>
              </div>
            ) : (
              <div className="text-xs text-amber-600 font-semibold">
                <p>Not Assigned Yet</p>
                <p className="text-[11px] font-normal text-muted mt-1">Select a partner from the dropdown above</p>
              </div>
            )}
          </div>

          {/* Delivery Age Verification & Rating */}
          <div className="premium-card p-5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Verification & Rating</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-muted block text-[11px]">Age Verification:</span>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                  order.deliveryAgeVerification?.status === 'VERIFIED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {order.deliveryAgeVerification?.status || 'PENDING'}
                </span>
              </div>
              {order.deliveryRating?.score ? (
                <div>
                  <span className="text-muted block text-[11px]">Customer Rating:</span>
                  <div className="flex items-center gap-1 text-amber-600 font-bold mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{order.deliveryRating.score}/5</span>
                  </div>
                  {order.deliveryRating.review && (
                    <p className="text-[11px] italic text-muted mt-0.5">&quot;{order.deliveryRating.review}&quot;</p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Live GPS Order Tracking Map */}
        <div className="premium-card p-6">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Live GPS Map & Route Tracking</span>
              </h3>
              <p className="text-xs text-muted">Real-time coordinates of delivery partner and destination</p>
            </div>
            {order.currentLocation?.timestamp && (
              <span className="text-xs text-muted">
                Last ping: {new Date(order.currentLocation.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
          <LiveOrderMap
            currentLocation={order.currentLocation}
            customerLocation={order.customer?.location}
            deliveryAddress={order.deliveryAddress}
            deliveryPartnerName={order.deliveryPartner?.name}
            isLocationStale={
              order.currentLocation?.timestamp
                ? Date.now() - new Date(order.currentLocation.timestamp).getTime() > 15 * 60 * 1000
                : true
            }
            orderStatus={order.status}
            height="320px"
          />
        </div>

        {/* Order Items Table & Financial Summary */}
        <div className="premium-card p-4 sm:p-6">
          <h3 className="font-bold text-sm text-text-main mb-4 border-b border-border-main pb-3">
            Order Items ({order.products?.length || 0})
          </h3>
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="text-xs text-muted uppercase border-b border-border-main">
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Qty</th>
                  <th className="pb-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {order.products?.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg bg-surface border border-border-main shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-surface border border-border-main flex items-center justify-center text-xs text-muted shrink-0">
                            Img
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-text-main truncate">{item.name}</p>
                          {item.volume && <p className="text-xs text-muted">Vol: {item.volume}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-muted">₹{(item.price || 0).toFixed(2)}</td>
                    <td className="py-3 text-muted font-medium">{item.quantity}</td>
                    <td className="py-3 text-right font-semibold text-text-main">
                      ₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 border-t border-border-main pt-6 flex justify-end">
            <div className="w-full sm:w-72 space-y-2 text-sm">
              <div className="flex justify-between text-muted text-xs">
                <span>Subtotal:</span>
                <span>₹{(order.subtotal || 0).toFixed(2)}</span>
              </div>
              {order.appliedOffer && (
                <div className="flex justify-between text-rose-600 text-xs font-semibold">
                  <span>Offer ({order.appliedOffer.offerCode}):</span>
                  <span>-₹{(order.appliedOffer.discountAmount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted text-xs">
                <span>Delivery Fee:</span>
                <span>₹{(order.deliveryFee || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-border-main pt-2">
                <span>Total Amount:</span>
                <span className="text-primary">₹{(order.totalAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted pt-1">
                <span>Payment Method:</span>
                <span className="font-semibold text-text-main">{order.paymentMethod} ({order.paymentStatus})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Trail & Internal Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status History & Audit Log */}
          <div className="premium-card p-6">
            <h3 className="font-bold text-sm text-text-main mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Status Transition Audit Trail</span>
            </h3>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {order.statusHistory && order.statusHistory.length > 0 ? (
                order.statusHistory.map((hist: any, index: number) => (
                  <div key={index} className="p-3 bg-surface border border-border-main rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-text-main">{hist.status}</span>
                      <span className="text-muted text-[11px]">
                        {new Date(hist.changedAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                    <p className="text-muted">{hist.note}</p>
                    <p className="text-[10px] text-muted opacity-80">
                      Actor: {hist.changerName || "Admin"} ({hist.changerRole || "system"})
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-muted bg-surface rounded-xl border border-border-main">
                  Order was placed in {order.status} state. No manual overrides yet.
                </div>
              )}
            </div>
          </div>

          {/* Internal Notes */}
          <div className="premium-card p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-text-main mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Internal Staff Notes</span>
              </h3>

              <div className="space-y-2.5 max-h-48 overflow-y-auto mb-4">
                {order.internalNotes && order.internalNotes.length > 0 ? (
                  order.internalNotes.map((note: any, idx: number) => (
                    <div key={idx} className="p-2.5 bg-surface border border-border-main rounded-lg text-xs">
                      <p className="text-text-main font-medium">{note.note}</p>
                      <div className="flex justify-between text-[10px] text-muted mt-1">
                        <span>By {note.addedByName || "Staff"}</span>
                        <span>{new Date(note.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted italic">No internal notes added yet.</p>
                )}
              </div>
            </div>

            <form onSubmit={handleAddNote} className="flex gap-2 pt-2 border-t border-border-main">
              <input
                type="text"
                placeholder="Add an internal note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="flex-1 px-3 py-2 bg-surface border border-border-main rounded-lg text-xs text-text-main focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={submittingNote || !noteText.trim()}
                className="px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors shrink-0"
              >
                {submittingNote ? "..." : "Add"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* PRINT RECEIPT UI */}
      <div className="hidden print:block p-8 bg-white text-black min-h-screen">
        <div className="text-center border-b border-gray-300 pb-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">DaaruDoor</h1>
          <p className="text-gray-600">Premium Drinks Delivery</p>
          <h2 className="text-xl font-semibold mt-4">Order Receipt</h2>
        </div>

        <div className="flex justify-between mb-8">
          <div>
            <p className="font-semibold mb-1">Receipt / Order No:</p>
            <p>#{order._id.slice(-6).toUpperCase()}</p>
            <p className="font-semibold mt-4 mb-1">Date & Time:</p>
            <p>{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold mb-1">Customer Details:</p>
            <p>{order.customer?.name}</p>
            <p>{order.customer?.mobile}</p>
            <p className="font-semibold mt-4 mb-1">Delivery Address:</p>
            {typeof order.deliveryAddress === 'object' ? (
              <>
                <p>{order.deliveryAddress.houseNo}, {order.deliveryAddress.area}</p>
                <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</p>
              </>
            ) : (
              <p>{order.deliveryAddress}</p>
            )}
          </div>
        </div>

        <table className="w-full text-left mb-8 border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="py-2">Item</th>
              <th className="py-2">Qty</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.products?.map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="py-3">
                  <p className="font-medium">{item.name}</p>
                  {item.volume && <p className="text-sm text-gray-500">{item.volume}</p>}
                </td>
                <td className="py-3">{item.quantity}</td>
                <td className="py-3 text-right">₹{item.price?.toFixed(2)}</td>
                <td className="py-3 text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between">
          <div className="w-1/2">
            <p className="font-semibold">Payment Method: {order.paymentMethod}</p>
            <p>Payment Status: {order.paymentStatus}</p>
            <p>Delivery Partner: {order.deliveryPartner?.name || 'Unassigned'}</p>
          </div>
          <div className="w-5/12 text-right space-y-1">
            <p>Subtotal: ₹{order.subtotal?.toFixed(2)}</p>
            <p>Delivery Fee: ₹{order.deliveryFee?.toFixed(2)}</p>
            <p className="font-bold text-lg border-t border-gray-300 pt-2">
              Total: ₹{order.totalAmount?.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {statusModal && (
        <ConfirmationModal
          isOpen={statusModal.isOpen}
          title={statusModal.targetStatus === 'FAILED' ? 'Mark Order as Failed?' : 'Cancel This Order?'}
          description={
            statusModal.targetStatus === 'FAILED'
              ? 'Please provide a clear failure reason so the customer and delivery team understand why this order could not be fulfilled.'
              : 'Are you sure you want to cancel this order? This will mark the order as cancelled in the system.'
          }
          confirmText={statusModal.targetStatus === 'FAILED' ? 'Confirm Failure' : 'Cancel Order'}
          cancelText="Go Back"
          variant="danger"
          loading={statusUpdating}
          disableBackdropDismiss={statusUpdating}
          onConfirm={() => {
            if (statusModal.targetStatus === 'FAILED' && !statusModal.reason?.trim()) {
              showToast('Please enter a reason for the delivery failure', 'error');
              return;
            }
            executeStatusChange(statusModal.targetStatus, statusModal.reason);
          }}
          onClose={() => {
            if (!statusUpdating) {
              setStatusModal(null);
            }
          }}
        >
          {statusModal.targetStatus === 'FAILED' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-main">Reason for failure:</label>
              <input
                type="text"
                value={statusModal.reason || ''}
                onChange={(e) => setStatusModal({ ...statusModal, reason: e.target.value })}
                placeholder="e.g. Customer unavailable / Incorrect address"
                className="w-full px-3 py-2 text-sm border border-border-main rounded-xl bg-surface text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                autoFocus
              />
            </div>
          )}
        </ConfirmationModal>
      )}
    </div>
  );
}
