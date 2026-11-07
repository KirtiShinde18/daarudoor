"use client";

import { useState, useEffect, useRef } from "react";
import { X, UploadCloud, Image as ImageIcon, Trash2, ArrowLeft, CheckCircle2, AlertTriangle, Package, Plus, Heart } from "lucide-react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
}

export function ProductModal({ isOpen, onClose, onSubmit, initialData }: ProductModalProps) {
  const defaultState = {
    name: "",
    description: "",
    category: "",
    brand: "",
    price: "",
    discountPrice: "",
    stock: "",
    status: "Active",
    volume: "",
    image: "",
  };

  const [formData, setFormData] = useState(defaultState);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        category: initialData.category || "",
        brand: initialData.brand || "",
        price: initialData.price || "",
        discountPrice: initialData.discountPrice || "",
        stock: initialData.stock || "",
        volume: initialData.volume || "",
        status: initialData.status || "Active",
        image: initialData.image || "",
      });
      setPreview(initialData.image || "");
    } else {
      setFormData(defaultState);
      setPreview("");
    }
    setIsDirty(false);
    setShowExitConfirm(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        handleChange("image", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPreview("");
    handleChange("image", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit({
        ...formData,
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
        stock: Number(formData.stock),
      });
      setIsDirty(false);
      onClose();
    } catch (error) {
      console.error(error);
      // Handled by Toast in page
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentPrice = Number(formData.price) || 0;
  const currentDiscountPrice = formData.discountPrice ? Number(formData.discountPrice) : null;
  const currentStock = Number(formData.stock) || 0;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background dark:bg-background animate-in fade-in duration-300">

      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-surface dark:bg-surface border-b border-border-main shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 pr-2">
          <button
            type="button"
            onClick={handleCloseAttempt}
            className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 rounded-full hover:bg-background text-muted hover:text-text-main transition-colors shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 sm:w-6 h-5 sm:h-6" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-text-main truncate">
              {initialData ? "Edit Product" : "Add New Product"}
            </h1>
            <p className="text-xs sm:text-sm text-muted hidden sm:block truncate">
              {initialData ? "Update the details, pricing, and inventory." : "Fill in the details to list a new product in the catalog."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCloseAttempt}
            className="hidden sm:block px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-border-main text-text-main font-medium hover:bg-background transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || (!isDirty && !initialData)}
            className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary-light active:bg-primary-dark transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-primary/20 hover:shadow-md flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
          >
            {isLoading ? (
              <> <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving... </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{initialData ? "Save Changes" : "Save Product"}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* Left Column: Form Sections */}
            <div className="w-full lg:w-2/3 space-y-8 pb-20">

              {/* Image Upload Card */}
              <section className="bg-surface dark:bg-surface rounded-2xl border border-border-main shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border-main">
                  <h2 className="text-lg font-bold text-text-main">Product Image 🥃</h2>
                  <p className="text-sm text-muted mt-1">Upload a high-quality image of the product.</p>
                </div>
                <div className="p-6">
                  {preview ? (
                    <div className="relative w-full max-w-sm mx-auto aspect-square rounded-2xl overflow-hidden border border-border-main bg-white shadow-inner group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="Product Preview" className="w-full h-full object-contain object-center p-4" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center gap-2 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                        >
                          <ImageIcon className="w-6 h-6" />
                          <span className="text-xs font-medium">Replace</span>
                        </button>
                        <button
                          type="button"
                          onClick={removeImage}
                          className="flex flex-col items-center gap-2 p-3 bg-red-500/80 hover:bg-red-600 rounded-xl text-white transition-colors"
                        >
                          <Trash2 className="w-6 h-6" />
                          <span className="text-xs font-medium">Remove</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded-2xl border-2 border-dashed border-border-main hover:border-primary/50 flex flex-col items-center justify-center bg-background/50 hover:bg-primary/5 cursor-pointer transition-all py-16 group"
                    >
                      <div className="w-16 h-16 bg-white dark:bg-surface rounded-full shadow-sm flex items-center justify-center mb-4 text-primary group-hover:scale-110 group-hover:shadow-md transition-all">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-semibold text-text-main">Click to upload image</h3>
                      <p className="text-sm text-muted mt-1">PNG, JPG, WEBP up to 5MB</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </section>

              {/* Basic Information Card */}
              <section className="bg-surface dark:bg-surface rounded-2xl border border-border-main shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border-main">
                  <h2 className="text-lg font-bold text-text-main">Basic Information ℹ️</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-text-main">Product Name *</label>
                      <input
                        required
                        value={formData.name}
                        onChange={e => handleChange("name", e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-main transition-all placeholder:text-muted/60 font-medium"
                        placeholder="e.g. Jack Daniels Old No. 7"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-text-main">Category *</label>
                      <select
                        required
                        value={formData.category}
                        onChange={e => handleChange("category", e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-main appearance-none transition-all cursor-pointer"
                      >
                        <option value="" disabled>Select Category</option>
                        <option value="Whiskey">Whiskey</option>
                        <option value="Vodka">Vodka</option>
                        <option value="Rum">Rum</option>
                        <option value="Beer">Beer</option>
                        <option value="Wine">Wine</option>
                        {/* <option value="Gin">Gin</option>
                        <option value="Tequila">Tequila</option> */}
                        <option value="Mixers">Mixers</option>
                        <option value="Snacks">Snacks</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-text-main">Brand Name</label>
                      <input
                        value={formData.brand}
                        onChange={e => handleChange("brand", e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-main transition-all placeholder:text-muted/60"
                        placeholder="e.g. Jack Daniels"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-text-main">Volume / Size</label>
                      <input
                        value={formData.volume}
                        onChange={e => handleChange("volume", e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-main transition-all placeholder:text-muted/60"
                        placeholder="e.g. 750 ml, 1 L"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-main">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={e => handleChange("description", e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-main min-h-[140px] transition-all resize-y placeholder:text-muted/60 leading-relaxed"
                      placeholder="Enter a detailed description of the product, tasting notes, and specifications..."
                    />
                  </div>
                </div>
              </section>

              {/* Pricing & Inventory Card */}
              <section className="bg-surface dark:bg-surface rounded-2xl border border-border-main shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border-main">
                  <h2 className="text-lg font-bold text-text-main">Pricing & Inventory 💰</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-main">Regular Price *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-medium">₹</span>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={e => handleChange("price", e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-background border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-main transition-all font-semibold"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-main">Discount Price</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-medium">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discountPrice}
                        onChange={e => handleChange("discountPrice", e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-background border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-main transition-all font-semibold"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-muted mt-1">Leave empty if no discount</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-main">Stock Quantity *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={e => handleChange("stock", e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-main transition-all font-semibold"
                      placeholder="0"
                    />
                  </div>
                </div>
              </section>

              {/* Settings Card */}
              <section className="bg-surface dark:bg-surface rounded-2xl border border-border-main shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border-main">
                  <h2 className="text-lg font-bold text-text-main">Product Settings ⚙️</h2>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background border border-border-main rounded-xl gap-3">
                    <div>
                      <h4 className="font-semibold text-text-main">Product Status</h4>
                      <p className="text-sm text-muted">Determine if this product is visible to customers.</p>
                    </div>

                    {/* Beautiful Toggle */}
                    <div className="relative inline-flex h-10 w-full sm:w-48 rounded-lg bg-border-main/50 p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleChange("status", "Active")}
                        className={`flex-1 rounded-md text-sm font-medium transition-all ${formData.status === "Active"
                          ? "bg-white dark:bg-surface shadow-sm text-text-main"
                          : "text-muted hover:text-text-main"
                          }`}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChange("status", "Inactive")}
                        className={`flex-1 rounded-md text-sm font-medium transition-all ${formData.status === "Inactive"
                          ? "bg-white dark:bg-surface shadow-sm text-text-main"
                          : "text-muted hover:text-text-main"
                          }`}
                      >
                        Inactive
                      </button>
                    </div>

                  </div>
                </div>
              </section>

            </div>

            {/* Right Column: Live Preview (Sticky) */}
            <div className="w-full lg:w-1/3 lg:sticky lg:top-28">
              <div className="bg-surface dark:bg-surface rounded-2xl border border-border-main shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border-main bg-background/50">
                  <h3 className="text-sm font-bold text-muted uppercase tracking-wider text-center">Live Preview</h3>
                </div>

                {/* Simulated App Card */}
                <div className="p-6 bg-background flex justify-center">
                  <div className="w-full max-w-[280px] bg-white rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100">

                    {/* Image Area */}
                    <div className="aspect-square bg-gray-50 relative overflow-hidden border-b border-gray-100">
                      {preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={preview} alt="Preview" className="w-full h-full object-contain object-center p-4" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-16 h-16 text-gray-300" />
                        </div>
                      )}

                      {/* Status Badges on Image */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {formData.category && (
                          <span className="px-2.5 py-1 bg-white/90 backdrop-blur text-xs font-bold text-gray-800 rounded-md shadow-sm border border-gray-100">
                            {formData.category}
                          </span>
                        )}
                        {currentDiscountPrice ? (
                          <span className="px-2.5 py-1 bg-[#6A0409] text-white text-xs font-bold rounded-md shadow-sm">
                            Sale
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                          {formData.category || "Category"}
                        </div>
                        <Heart className="w-4 h-4 text-gray-300" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-base leading-tight mb-1 line-clamp-2 min-h-[20px]">
                        {formData.name || "Product Title Goes Here"}
                      </h4>
                      {formData.volume && (
                        <div className="text-xs font-medium text-gray-500 mb-3">
                          {formData.volume}
                        </div>
                      )}

                      <div className="flex items-end justify-between mt-4">
                        <div>
                          {currentDiscountPrice ? (
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-400 line-through font-medium">₹{currentPrice.toFixed(2)}</span>
                              <span className="text-lg font-black text-[#6A0409]">₹{currentDiscountPrice.toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="text-lg font-black text-gray-900">₹{currentPrice.toFixed(2)}</span>
                          )}
                        </div>

                        {currentStock > 0 ? (
                          <div className="w-10 h-10 rounded-full bg-[#6A0409] text-white flex items-center justify-center shadow-md">
                            <Plus className="w-5 h-5" />
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">Out of Stock</span>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                <div className="p-4 bg-background/50 border-t border-border-main">
                  <p className="text-xs text-center text-muted">This preview roughly illustrates how the product will appear in the Customer App.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Unsaved Changes Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface dark:bg-surface border border-border-main w-full max-w-sm rounded-2xl shadow-xl overflow-hidden transform animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-4 mx-auto">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
              </div>
              <h3 className="text-lg font-bold text-center text-text-main mb-2">Unsaved Changes</h3>
              <p className="text-sm text-center text-muted">
                You have unsaved changes. Are you sure you want to discard them and leave?
              </p>
            </div>
            <div className="p-4 bg-background/50 border-t border-border-main flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-4 py-2 bg-surface border border-border-main rounded-xl text-text-main font-medium hover:bg-background transition-colors"
              >
                Keep Editing
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  onClose();
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors shadow-sm shadow-red-600/20"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
