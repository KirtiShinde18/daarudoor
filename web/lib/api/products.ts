const API_URL = "/api/admin/products";

// Add credentials to ensure admin cookies are sent if any
const defaultHeaders = {
  "Content-Type": "application/json",
};

export const fetchProducts = async (search = "", category = "", status = "") => {
  const query = new URLSearchParams();
  if (search) query.append("search", search);
  if (category) query.append("category", category);
  if (status) query.append("status", status);

  const res = await fetch(`${API_URL}?${query.toString()}`, {
    method: "GET",
    headers: defaultHeaders, credentials: "include",
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      document.cookie = "adminAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
};

export const fetchProductById = async (id: string) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "GET",
    headers: defaultHeaders, credentials: "include",
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      document.cookie = "adminAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error("Failed to fetch product");
  return res.json();
};

export const createProduct = async (data: any) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: defaultHeaders, credentials: "include",
    body: JSON.stringify(data),
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      document.cookie = "adminAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error("Failed to create product");
  return res.json();
};

export const updateProduct = async (id: string, data: any) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: defaultHeaders, credentials: "include",
    body: JSON.stringify(data),
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      document.cookie = "adminAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error("Failed to update product");
  return res.json();
};

export const deleteProduct = async (id: string) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: defaultHeaders, credentials: "include",
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      document.cookie = "adminAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error("Failed to delete product");
  return res.json();
};
