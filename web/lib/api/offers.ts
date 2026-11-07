const API_URL = "/api/admin/offers";

const defaultHeaders = {
  "Content-Type": "application/json",
};

export const fetchOffers = async () => {
  const res = await fetch(API_URL, {
    method: "GET",
    headers: defaultHeaders,
    credentials: "include",
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      document.cookie = "adminAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error("Failed to fetch offers");
  return res.json();
};

export const createOffer = async (data: any) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: defaultHeaders,
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      document.cookie = "adminAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error("Failed to create offer");
  return res.json();
};

export const updateOffer = async (id: string, data: any) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: defaultHeaders,
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      document.cookie = "adminAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error("Failed to update offer");
  return res.json();
};

export const deleteOffer = async (id: string) => {
  const res = await fetch(`${API_URL}/${id}/soft-delete`, {
    method: "PATCH",
    headers: defaultHeaders,
    credentials: "include",
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      document.cookie = "adminAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error("Failed to soft delete offer");
  return res.json();
};

export const fetchDeletedOffers = async () => {
  const res = await fetch(`${API_URL}/trash`, {
    method: "GET",
    headers: defaultHeaders,
    credentials: "include",
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      document.cookie = "adminAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error("Failed to fetch deleted offers");
  return res.json();
};

export const restoreOffer = async (id: string) => {
  const res = await fetch(`${API_URL}/${id}/restore`, {
    method: "PATCH",
    headers: defaultHeaders,
    credentials: "include",
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      document.cookie = "adminAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error("Failed to restore offer");
  return res.json();
};

export const permanentDeleteOffer = async (id: string) => {
  const res = await fetch(`${API_URL}/${id}/permanent`, {
    method: "DELETE",
    headers: defaultHeaders,
    credentials: "include",
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      document.cookie = "adminAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error("Failed to permanently delete offer");
  return res.json();
};
