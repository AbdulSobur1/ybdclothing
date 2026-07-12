"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, Mail, Phone, MapPin, Lock, Save, Loader2 } from "lucide-react";

interface Profile {
  full_name: string;
  email: string;
  phone: string | null;
  default_address: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Editable fields
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data);
      setPhone(data.phone ?? "");
      setAddress(data.default_address ?? "");
    }

    setLoading(false);
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        phone: phone || null,
        default_address: address || null,
      })
      .eq("id", user.id);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Profile updated successfully!" });
    }

    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
    }

    setChangingPassword(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F2EDE1]">
        <Loader2 className="h-8 w-8 text-[#4A6B6D] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#F2EDE1] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1
          className="text-3xl font-bold text-[#2C2C2C] mb-8"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          My Profile
        </h1>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm mb-6 ${
              message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-[#E0D8C8] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-[#4A6B6D]" /> Personal Information
          </h2>

          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-[#8A9283]" />
              <span className="text-[#5A5A4A]">{profile?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-[#8A9283]" />
              <span className="text-[#5A5A4A]">{profile?.full_name}</span>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[#5A5A4A] mb-1">
                <Phone className="h-4 w-4 inline mr-1" /> Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-[#E0D8C8] bg-white text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#4A6B6D]/30 focus:border-[#4A6B6D] transition-all"
              />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-[#5A5A4A] mb-1">
                <MapPin className="h-4 w-4 inline mr-1" /> Default Delivery Address
              </label>
              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-[#E0D8C8] bg-white text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#4A6B6D]/30 focus:border-[#4A6B6D] transition-all resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#4A6B6D] text-white font-medium hover:bg-[#3A5557] transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#E0D8C8] p-6">
          <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#4A6B6D]" /> Change Password
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-[#5A5A4A] mb-1">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-lg border border-[#E0D8C8] bg-white text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#4A6B6D]/30 focus:border-[#4A6B6D] transition-all"
                placeholder="Min. 6 characters"
              />
            </div>
            <button
              type="submit"
              disabled={changingPassword || !newPassword}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#A6822E] text-white font-medium hover:bg-[#8E6E1F] transition-all disabled:opacity-50"
            >
              {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
