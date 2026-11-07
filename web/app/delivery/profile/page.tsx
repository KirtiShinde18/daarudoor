"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Calendar, Camera } from "lucide-react";
import { useToast } from "@/components/ToastContext";

export default function DeliveryProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    address: "",
    password: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = document.cookie.split("deliveryAuth=")[1]?.split(";")[0] || document.cookie.split("DELIVERY=")[1]?.split(";")[0];
        const res = await fetch("/api/delivery/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setProfile(data.data);
          setFormData({
            name: data.data.name || "",
            mobile: data.data.mobile || "",
            address: data.data.address || "",
            password: "",
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = document.cookie.split("deliveryAuth=")[1]?.split(";")[0] || document.cookie.split("DELIVERY=")[1]?.split(";")[0];
      
      const payload: any = { ...formData };
      if (!payload.password) delete payload.password; // Don't send empty password

      const res = await fetch("/api/delivery/profile", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast("Profile updated successfully", "success");
        setProfile(data.data);
      } else {
        showToast(data.message || "Failed to update profile", "error");
      }
    } catch (error) {
      showToast("An error occurred", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading profile...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text-main">My Profile</h1>
        <p className="text-muted text-sm mt-1">Manage your personal information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="premium-card p-6 flex flex-col items-center text-center">
            <div className="relative w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center mb-4 border-4 border-surface shadow-lg">
              {profile?.profilePic ? (
                <img src={profile.profilePic} alt={profile.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-primary" />
              )}
            </div>
            <h2 className="text-xl font-bold text-text-main">{profile?.name}</h2>
            <p className="text-muted text-sm">Delivery Partner</p>
            <div className="mt-4 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-medium border border-green-500/20">
              Active Account
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="premium-card p-6">
            <h3 className="text-lg font-bold text-text-main mb-6 border-b border-border-main pb-4">Personal Details</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 bg-surface border border-border-main rounded-lg focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                    <input 
                      type="tel" 
                      value={formData.mobile} 
                      onChange={e => setFormData({...formData, mobile: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 bg-surface border border-border-main rounded-lg focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                  <input 
                    type="email" 
                    value={profile?.email} 
                    disabled
                    className="w-full pl-10 pr-4 py-2 bg-surface border border-border-main rounded-lg text-muted cursor-not-allowed opacity-70"
                  />
                </div>
                <p className="text-xs text-muted mt-1">Email cannot be changed.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                  <input 
                    type="text" 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 bg-surface border border-border-main rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border-main mt-4">
                <h4 className="text-sm font-bold text-text-main mb-4">Security</h4>
                <label className="block text-sm font-medium text-text-main mb-1">New Password (leave blank to keep current)</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2 bg-surface border border-border-main rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border-main mt-6">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
