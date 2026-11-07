"use client";



import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Gift, CheckCircle, AlertTriangle, RefreshCw, Trash } from "lucide-react";
import { fetchOffers, deleteOffer, createOffer, updateOffer, fetchDeletedOffers, restoreOffer, permanentDeleteOffer } from "@/lib/api/offers";
import { useToast } from "@/components/ToastContext";
import { OfferModal } from "@/app/admin/offers/OfferModal";

export default function OffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "TRASH">("ACTIVE");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);
  const [deleteAction, setDeleteAction] = useState<"SOFT" | "PERMANENT">("SOFT");

  const { showToast } = useToast();

  const loadOffers = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "ACTIVE") {
        const res = await fetchOffers();
        if (res.success) setOffers(res.data);
      } else {
        const res = await fetchDeletedOffers();
        if (res.success) setOffers(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch offers", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, [activeTab]);

  const handleOpenCreateModal = () => {
    setEditingOffer(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (offer: any) => {
    setEditingOffer(offer);
    setIsModalOpen(true);
  };

  const confirmDelete = (id: string, action: "SOFT" | "PERMANENT") => {
    setOfferToDelete(id);
    setDeleteAction(action);
    setDeleteModalOpen(true);
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await restoreOffer(id);
      if (res.success) {
        showToast("Offer restored successfully.", "success");
        loadOffers();
      } else {
        showToast(res.message || "Failed to restore offer", "error");
      }
    } catch (err) {
      showToast("Failed to restore offer", "error");
    }
  };

  const handleDelete = async () => {
    if (offerToDelete) {
      try {
        let res;
        if (deleteAction === "SOFT") {
          res = await deleteOffer(offerToDelete);
        } else {
          res = await permanentDeleteOffer(offerToDelete);
        }

        if (res.success) {
          showToast(deleteAction === "SOFT" ? "Offer moved to trash" : "Offer permanently deleted", "success");
        } else {
          showToast(res.message || "Failed to delete offer", "error");
        }
      } catch (err) {
        showToast("Failed to delete offer", "error");
      }
      setDeleteModalOpen(false);
      setOfferToDelete(null);
      loadOffers();
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingOffer) {
        const res = await updateOffer(editingOffer._id, data);
        if (res.success) showToast("Offer updated successfully!", "success");
        else showToast(res.message || "Update failed", "error");
      } else {
        const res = await createOffer(data);
        if (res.success) showToast("Offer created successfully!", "success");
        else showToast(res.message || "Creation failed", "error");
      }
      loadOffers();
    } catch (err) {
      showToast("An error occurred while saving", "error");
      throw err; 
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-main dark:text-text-main">
            Offers & Promotions
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">Manage dynamic offers, discounts, and promotions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex gap-1.5 p-1 bg-surface border border-border-main rounded-xl">
            <button
              onClick={() => setActiveTab("ACTIVE")}
              className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === "ACTIVE" ? "bg-background shadow-xs text-text-main" : "text-muted hover:text-text-main"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab("TRASH")}
              className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === "TRASH" ? "bg-background shadow-xs text-text-main" : "text-muted hover:text-text-main"
              }`}
            >
              Trash
            </button>
          </div>
          {activeTab === "ACTIVE" && (
            <button
              onClick={handleOpenCreateModal}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-primary text-white rounded-xl hover:bg-primary-light active:bg-primary-dark transition-all shadow-sm hover:shadow-md font-medium text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Offer 🎁</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface dark:bg-surface border border-border-main rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left border-collapse">
            <thead>
              <tr className="border-b border-border-main bg-background/50">
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Offer</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Discount</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Validity</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-12 bg-background rounded-xl w-48"></div></td>
                    <td className="px-6 py-4"><div className="h-5 bg-background rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-5 bg-background rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-background rounded-full w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-background rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Gift className="w-12 h-12 text-muted mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold text-text-main">No offers found</h3>
                      <p className="text-muted mt-1">Create an offer to boost sales!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                offers.map((offer) => (
                  <tr key={offer._id} className="hover:bg-background/50 dark:hover:bg-background/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-10 rounded-xl overflow-hidden border border-border-main bg-white shrink-0 relative shadow-sm">
                          {offer.image?.secure_url ? (
                            <img src={offer.image.secure_url} alt={offer.title} className="w-full h-full object-cover object-center" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                              <Gift className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-text-main line-clamp-1">{offer.title}</p>
                          {offer.code && <p className="text-xs text-primary font-bold mt-0.5">{offer.code}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-text-main">
                        {offer.discountType === 'PERCENTAGE' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-sm text-muted">
                        <span>{new Date(offer.startDate).toLocaleDateString()} -</span>
                        <span>{new Date(offer.endDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${offer.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        }`}>
                        {offer.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {activeTab === "ACTIVE" ? (
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditModal(offer)}
                            className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Edit Offer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(offer._id, "SOFT")}
                            className="p-2 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Move to Trash"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleRestore(offer._id)}
                            className="p-2 text-muted hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Restore Offer"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(offer._id, "PERMANENT")}
                            className="p-2 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete Permanently"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingOffer}
      />

      {deleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-surface border border-border-main w-full max-w-sm rounded-2xl shadow-xl p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-center text-text-main mb-2">
              {deleteAction === "SOFT" ? "Move to Trash" : "Permanent Delete"}
            </h3>
            <p className="text-sm text-center text-muted mb-6">
              {deleteAction === "SOFT" 
                ? "Are you sure you want to move this offer to Trash? You can restore it later."
                : "Are you sure? This offer and its image will be permanently deleted and cannot be restored."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 border border-border-main rounded-xl text-text-main font-medium hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                {deleteAction === "SOFT" ? "Move to Trash" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
