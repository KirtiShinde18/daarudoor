"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, MapPin, Phone, Eye } from "lucide-react";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";

export default function DeliveryOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = document.cookie.split("deliveryAuth=")[1]?.split(";")[0] || document.cookie.split("DELIVERY=")[1]?.split(";")[0];
        const res = await fetch("/api/delivery/orders", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setOrders(data.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o => 
    o._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.deliveryAddress?.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">My Orders</h1>
          <p className="text-muted text-sm mt-1">Manage your assigned deliveries</p>
        </div>
      </div>

      <div className="premium-card p-6">
        <div className="relative w-full sm:max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by ID, name or city..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface dark:bg-surface border border-border-main rounded-lg text-text-main dark:text-text-main focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-muted py-8">Loading orders...</p>
          ) : filteredOrders.length === 0 ? (
            <p className="text-center text-muted py-8">No assigned orders found.</p>
          ) : (
            filteredOrders.map(order => (
              <div key={order._id} className="border border-border-main rounded-lg p-4 hover:border-primary/50 transition-colors bg-surface">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-text-main">#{order._id.slice(-6).toUpperCase()}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-sm font-medium text-text-main">{order.customer?.name}</p>
                    <div className="flex flex-col gap-1 mt-2 text-sm text-muted">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{typeof order.deliveryAddress === 'object' ? `${order.deliveryAddress.houseNo}, ${order.deliveryAddress.area}, ${order.deliveryAddress.city}` : order.deliveryAddress}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{order.customer?.mobile}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-row sm:flex-col justify-between items-end sm:items-end w-full sm:w-auto mt-2 sm:mt-0">
                    <p className="font-bold text-lg text-primary">₹{order.totalAmount?.toFixed(2)}</p>
                    <Link 
                      href={`/delivery/orders/${order._id}`}
                      className="flex items-center gap-2 bg-black/5 dark:bg-white/5 hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors mt-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
