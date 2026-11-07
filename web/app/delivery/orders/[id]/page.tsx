"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, User, Package, Truck, CheckCircle2 } from "lucide-react";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
import { ConfirmationModal, ConfirmationVariant } from "@/components/ui/ConfirmationModal";
import { useToast } from "@/components/ToastContext";

interface ConfirmModalConfig {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  icon?: React.ReactNode;
  action: () => Promise<void>;
}

export default function DeliveryOrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalConfig | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const token = document.cookie.split("deliveryAuth=")[1]?.split(";")[0] || document.cookie.split("DELIVERY=")[1]?.split(";")[0];
    fetch(`/api/delivery/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOrder(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const executeStatusChange = async (newStatus: string, successMessage: string) => {
    setStatusUpdating(true);
    try {
      const token = document.cookie.split("deliveryAuth=")[1]?.split(";")[0] || document.cookie.split("DELIVERY=")[1]?.split(";")[0];
      const res = await fetch(`/api/delivery/orders/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder({ ...order, status: newStatus });
        showToast(successMessage, "success");
        setConfirmModal(null);
      } else {
        showToast(data.message || "Failed to update status", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("An error occurred while updating status. Please retry.", "error");
    } finally {
      setStatusUpdating(false);
    }
  };

  const promptAcceptOrder = () => {
    setConfirmModal({
      isOpen: true,
      title: "Accept Order Assignment?",
      description: "Do you want to accept this delivery assignment?",
      confirmText: "Accept Order",
      variant: "primary",
      icon: <CheckCircle2 className="w-7 h-7" />,
      action: () => executeStatusChange("ACCEPTED", "Order accepted successfully!"),
    });
  };

  const promptStartDelivery = () => {
    setConfirmModal({
      isOpen: true,
      title: "Start Delivery?",
      description: "This will notify the customer that you are on the way to their address.",
      confirmText: "Yes, Start Delivery",
      variant: "primary",
      icon: <Truck className="w-7 h-7" />,
      action: () => executeStatusChange("OUT_FOR_DELIVERY", "Delivery started! Customer notified."),
    });
  };

  const promptArrivedAtCustomer = () => {
    setConfirmModal({
      isOpen: true,
      title: "Arrived at Customer Location?",
      description: "Please confirm that you have reached the customer's delivery address.",
      confirmText: "Yes, I've Arrived",
      cancelText: "Cancel",
      variant: "primary",
      icon: <MapPin className="w-7 h-7" />,
      action: () => executeStatusChange("ARRIVED", "Marked as arrived! Customer notified."),
    });
  };

  const promptMarkDelivered = () => {
    const isCodUnpaid = order.paymentMethod === "COD" && order.paymentStatus !== "PAID";
    setConfirmModal({
      isOpen: true,
      title: "Confirm Delivery?",
      description: isCodUnpaid
        ? `Have you collected ₹${order.totalAmount?.toFixed(2)} cash from the customer and handed over the order?`
        : "Please confirm that you have successfully delivered this order to the customer.",
      confirmText: "Yes, Delivered",
      variant: "success",
      icon: <CheckCircle2 className="w-7 h-7" />,
      action: () => executeStatusChange("DELIVERED", "Order marked as delivered successfully!"),
    });
  };

  if (loading) return <div className="p-8">Loading order...</div>;
  if (!order) return <div className="p-8 text-red-500">Order not found.</div>;

  const isDelivered = order.status === "DELIVERED";
  const isCancelled = order.status === "CANCELLED" || order.status === "RETURNED";
  const canUpdateStatus = !isDelivered && !isCancelled;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/delivery/orders" className="inline-flex items-center text-muted hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Orders
      </Link>

      <div className="bg-surface dark:bg-surface rounded-xl shadow-sm border border-border-main p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 pb-6 border-b border-border-main">
          <div>
            <h2 className="text-2xl font-bold">Order #{order._id.slice(-6).toUpperCase()}</h2>
            <p className="text-muted text-sm mt-1">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col items-end">
            <div className="mb-3">
              <OrderStatusBadge status={order.status} />
            </div>
            
            {canUpdateStatus && (
              <div className="flex flex-wrap gap-2">
                {['CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'ASSIGNED'].includes(order.status) && (
                  <button 
                    type="button"
                    disabled={statusUpdating}
                    onClick={promptAcceptOrder}
                    className="px-4 py-2 bg-[#6A0409] hover:bg-[#9D0208] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                  >
                    Accept Order
                  </button>
                )}

                {order.status === 'ACCEPTED' && (
                  <button 
                    type="button"
                    disabled={statusUpdating}
                    onClick={promptStartDelivery}
                    className="px-4 py-2 bg-[#6A0409] hover:bg-[#9D0208] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                  >
                    Start Delivery (On the Way)
                  </button>
                )}

                {order.status === 'OUT_FOR_DELIVERY' && (
                  <button 
                    type="button"
                    disabled={statusUpdating}
                    onClick={promptArrivedAtCustomer}
                    className="px-4 py-2 bg-[#6A0409] hover:bg-[#9D0208] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                  >
                    I Have Arrived at Customer Location
                  </button>
                )}

                {order.status === 'ARRIVED' && (
                  <button 
                    type="button"
                    disabled={statusUpdating}
                    onClick={promptMarkDelivered}
                    className="px-4 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary" /> Customer Info
            </h3>
            <div className="space-y-2 bg-black/5 dark:bg-white/5 p-4 rounded-lg">
              <p className="font-medium text-text-main">{order.customer?.name}</p>
              <div className="flex items-center gap-2 text-muted">
                <Phone className="w-4 h-4" />
                <a href={`tel:${order.customer?.mobile}`} className="hover:text-primary">{order.customer?.mobile}</a>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-primary" /> Delivery Address
            </h3>
            <div className="space-y-2 bg-black/5 dark:bg-white/5 p-4 rounded-lg">
              {typeof order.deliveryAddress === 'object' ? (
                <>
                  <p className="font-medium text-text-main">{order.deliveryAddress.fullName}</p>
                  <p className="text-muted">{order.deliveryAddress.houseNo}, {order.deliveryAddress.building}</p>
                  <p className="text-muted">{order.deliveryAddress.area}, {order.deliveryAddress.landmark}</p>
                  <p className="text-muted">{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</p>
                  <div className="flex items-center gap-2 text-muted mt-2 pt-2 border-t border-border-main/50">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${order.deliveryAddress.mobile}`} className="hover:text-primary">{order.deliveryAddress.mobile}</a>
                  </div>
                </>
              ) : (
                <p className="text-muted">{order.deliveryAddress}</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary" /> Order Items
          </h3>
          <div className="border border-border-main rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/5 dark:bg-white/5 border-b border-border-main">
                <tr className="text-muted">
                  <th className="p-3 font-medium">Item</th>
                  <th className="p-3 font-medium text-center">Qty</th>
                  <th className="p-3 font-medium text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {order.products?.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-border-main/50 last:border-0">
                    <td className="p-3">
                      <p className="font-medium text-text-main">{item.name}</p>
                      {item.volume && <p className="text-xs text-muted mt-0.5">{item.volume}</p>}
                    </td>
                    <td className="p-3 text-center">{item.quantity}</td>
                    <td className="p-3 text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-lg">
          <div>
            <p className="text-sm text-muted mb-1">Payment Method</p>
            <p className="font-medium px-3 py-1 bg-surface border border-border-main rounded-full inline-block">
              {order.paymentMethod}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted mb-1">Total Amount to Collect/Verify</p>
            <p className="text-2xl font-bold text-primary">₹{order.totalAmount?.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {confirmModal && (
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText || "Cancel"}
          variant={confirmModal.variant || "primary"}
          icon={confirmModal.icon}
          loading={statusUpdating}
          disableBackdropDismiss={statusUpdating}
          onConfirm={confirmModal.action}
          onClose={() => {
            if (!statusUpdating) {
              setConfirmModal(null);
            }
          }}
        />
      )}
    </div>
  );
}
