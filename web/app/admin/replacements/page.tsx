"use client";

import { useState, useEffect } from "react";
import { Package, Search, Filter } from "lucide-react";
import { useToast } from "@/components/ToastContext";

export default function ReplacementsPage() {
  const [replacements, setReplacements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  const fetchReplacements = async () => {
    try {
      const res = await fetch("/api/admin/replacements", {
        headers: {
          Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setReplacements(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplacements();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/replacements/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${document.cookie.split("adminAuth=")[1]?.split(";")[0]}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Replacement status updated", "success");
        setReplacements(replacements.map((r) => (r._id === id ? data.data : r)));
      } else {
        showToast(data.message || "Failed to update", "error");
      }
    } catch (error) {
      showToast("Network error", "error");
    }
  };

  const filteredReplacements = replacements.filter((r) =>
    r.order?._id.toLowerCase().includes(search.toLowerCase()) ||
    r.customer?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-main dark:text-text-main">
            Replacement Requests
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">Review and manage customer replacement inquiries.</p>
        </div>
        <div className="flex w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search order or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border-main bg-surface dark:bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-main"
            />
          </div>
        </div>
      </div>

      <div className="bg-surface dark:bg-surface rounded-xl shadow-sm border border-border-main overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-background dark:bg-black border-b border-border-main text-muted">
              <tr>
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Reason</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted">Loading replacements...</td>
                </tr>
              ) : filteredReplacements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted flex flex-col items-center">
                    <Package className="w-8 h-8 mb-2 opacity-50" />
                    No replacement requests found.
                  </td>
                </tr>
              ) : (
                filteredReplacements.map((req) => (
                  <tr key={req._id} className="hover:bg-background dark:hover:bg-black/50 transition-colors">
                    <td className="px-6 py-4 font-medium">#{req.order?._id.slice(-6).toUpperCase()}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{req.customer?.name}</p>
                        <p className="text-xs text-muted">{req.customer?.mobile}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {req.originalItemImage ? (
                          <img src={req.originalItemImage} alt={req.originalItemName} className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-border-main flex items-center justify-center">
                            <Package className="w-4 h-4 text-muted" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{req.originalItemName}</p>
                          <p className="text-xs text-muted">Qty: {req.quantity}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-text-main">{req.reason}</p>
                      {req.description && <p className="text-xs text-muted max-w-[200px] truncate">{req.description}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={req.status}
                        onChange={(e) => handleStatusChange(req._id, e.target.value)}
                        className={`px-2 py-1 rounded-md text-xs font-medium border border-border-main bg-background ${
                          req.status === 'Requested' ? 'text-amber-500' :
                          req.status === 'Approved' ? 'text-blue-500' :
                          req.status === 'Rejected' ? 'text-red-500' :
                          'text-green-500'
                        }`}
                      >
                        <option value="Requested">Requested</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Replacement Completed">Completed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-muted whitespace-nowrap">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
