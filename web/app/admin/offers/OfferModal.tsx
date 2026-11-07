import { useState, useEffect } from "react";
import { X, Upload, Loader2, Image as ImageIcon } from "lucide-react";

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
}

export function OfferModal({ isOpen, onClose, onSubmit, initialData }: OfferModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minOrderValue: "",
    maxDiscount: "",
    code: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        discountType: initialData.discountType || "PERCENTAGE",
        discountValue: initialData.discountValue?.toString() || "",
        minOrderValue: initialData.minOrderValue?.toString() || "",
        maxDiscount: initialData.maxDiscount?.toString() || "",
        code: initialData.code || "",
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : "",
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : "",
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
      });
      setImagePreview(initialData.image?.secure_url || null);
    } else {
      setFormData({
        title: "",
        description: "",
        discountType: "PERCENTAGE",
        discountValue: "",
        minOrderValue: "",
        maxDiscount: "",
        code: "",
        startDate: "",
        endDate: "",
        isActive: true,
      });
      setImagePreview(null);
    }
  }, [initialData, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submitData: any = {
        ...formData,
        discountValue: Number(formData.discountValue),
        minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : 0,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
      };

      if (imagePreview && imagePreview.startsWith("data:image")) {
        submitData.image = imagePreview;
      }

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface dark:bg-surface border border-border-main w-full max-w-2xl rounded-2xl shadow-xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-main shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-text-main">
              {initialData ? "Edit Offer" : "Create Offer"}
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-0.5">Fill in the offer details</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-text-main hover:bg-background rounded-xl transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <form id="offerForm" onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            
            <div className="flex flex-col items-center gap-4">
              <div className="w-full aspect-[21/9] bg-background border-2 border-dashed border-border-main rounded-xl overflow-hidden relative group transition-colors hover:border-primary/50">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white font-medium flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Change Banner
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <p className="font-medium text-sm">Upload Banner</p>
                    <p className="text-xs mt-1">Recommended size: 1200x500px</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required={!initialData}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-text-main">Offer Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-main"
                  placeholder="e.g. Weekend Special 20% Off"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-text-main">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-main min-h-[80px]"
                  placeholder="Short description of the offer..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">Discount Type *</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-main"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">Discount Value *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-main"
                  placeholder="e.g. 20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">Min Order Value (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.minOrderValue}
                  onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-main"
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">Max Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-main"
                  placeholder="Applicable for Percentage type"
                />
              </div>
              
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-text-main">Coupon Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 bg-background border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-main"
                  placeholder="e.g. WEEKEND20 (Leave blank for auto-apply)"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">Start Date *</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-main"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">End Date *</label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-main"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary bg-background border-border-main rounded focus:ring-primary/20"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-text-main select-none cursor-pointer">
                  Is Active?
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-5 border-t border-border-main bg-background/50 rounded-b-2xl shrink-0">
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 text-text-main font-medium border border-border-main rounded-xl hover:bg-background transition-colors disabled:opacity-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="offerForm"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-light active:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Offer"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
