"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Filter, Package, CheckCircle, AlertCircle, Tags, X, AlertTriangle, Wine } from "lucide-react";
import { fetchProducts, createProduct, updateProduct, deleteProduct } from "@/lib/api/products";
import { ProductModal } from "./ProductModal";
import { useToast } from "@/components/ToastContext";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Delete Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const { showToast } = useToast();


  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetchProducts(searchTerm, categoryFilter);
      if (res.success) {
        setProducts(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [searchTerm, categoryFilter]);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: any) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const confirmDelete = (id: string) => {
    setProductToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (productToDelete) {
      try {
        await deleteProduct(productToDelete);
        showToast("Product deleted successfully!", "success");
      } catch (err) {
        showToast("Failed to delete product", "error");
      }
      setDeleteModalOpen(false);
      setProductToDelete(null);
      loadProducts();
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct._id, data);
        showToast("Product updated successfully!", "success");
      } else {
        await createProduct(data);
        showToast("Product created successfully!", "success");
      }
      loadProducts();
    } catch (err) {
      showToast("An error occurred while saving", "error");
      throw err; // Re-throw to keep modal loading state if needed
    }
  };

  // Stats calculation
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === "Active").length;
  const outOfStock = products.filter(p => p.stock === 0).length;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="p-8 space-y-8 flex-1 w-full max-w-7xl mx-auto">

        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            {/* <h1 className="text-3xl font-bold text-text-main">Products 📦</h1> */}
            <p className="text-muted mt-1">Manage your catalog, pricing, and inventory.</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-light active:bg-primary-dark transition-all shadow-sm hover:shadow-md font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Product 📦
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface dark:bg-surface border border-border-main p-6 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted">Total Products</p>
              <h3 className="text-2xl font-bold text-text-main">{totalProducts}</h3>
            </div>
          </div>
          <div className="bg-surface dark:bg-surface border border-border-main p-6 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-500 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted">Active Listing</p>
              <h3 className="text-2xl font-bold text-text-main">{activeProducts}</h3>
            </div>
          </div>
          <div className="bg-surface dark:bg-surface border border-border-main p-6 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted">Out of Stock</p>
              <h3 className="text-2xl font-bold text-text-main">{outOfStock}</h3>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-surface dark:bg-surface border border-border-main p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Search products by name or brand..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-background border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-main transition-all"
            />
          </div>
          <div className="relative min-w-[200px] w-full md:w-auto">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-background border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-main appearance-none cursor-pointer transition-all"
            >
              <option value="">All Categories</option>
              <option value="Whiskey">Whiskey</option>
              <option value="Vodka">Vodka</option>
              <option value="Rum">Rum</option>
              <option value="Beer">Beer</option>
              <option value="Wine">Wine</option>
              <option value="Gin">Gin</option>
              <option value="Tequila">Tequila</option>
              <option value="Mixers">Mixers</option>
              <option value="Snacks">Snacks</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface dark:bg-surface border border-border-main rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-main bg-background/50">
                  <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-12 bg-background rounded-xl w-48"></div></td>
                      <td className="px-6 py-4"><div className="h-5 bg-background rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-5 bg-background rounded w-16"></div></td>
                      <td className="px-6 py-4"><div className="h-5 bg-background rounded w-12"></div></td>
                      <td className="px-6 py-4"><div className="h-6 bg-background rounded-full w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-8 bg-background rounded w-16 ml-auto"></div></td>
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Wine className="w-12 h-12 text-muted mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold text-text-main">No products found</h3>
                        <p className="text-muted mt-1">Try adjusting your filters or add a new product.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product._id} className="hover:bg-background/50 dark:hover:bg-background/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-border-main bg-white shrink-0 relative shadow-sm">
                            {product.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={product.image} alt={product.name} className="w-full h-full object-contain object-center p-1" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-text-main line-clamp-1">{product.name}</p>
                            {product.brand && <p className="text-xs text-muted mt-0.5">{product.brand}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-text-main">
                          <Tags className="w-3.5 h-3.5 text-muted" />
                          {product.category}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          {product.discountPrice ? (
                            <>
                              <span className="text-sm font-bold text-text-main">₹{product.discountPrice.toFixed(2)}</span>
                              <span className="text-xs text-muted line-through">₹{product.price.toFixed(2)}</span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-text-main">₹{product.price.toFixed(2)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold ${product.stock > 0 ? "text-text-main" : "text-red-500"}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${product.status === "Active"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                          }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(product._id)}
                            className="p-2 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingProduct}
      />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-surface border border-border-main w-full max-w-sm rounded-2xl shadow-xl p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-center text-text-main mb-2">Move to Trash</h3>
            <p className="text-sm text-center text-muted mb-6">
              Are you sure you want to move this product to Trash? You can restore it later if needed.
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
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
