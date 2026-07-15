"use client";

import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/utils";
import { Users, Mail, Phone, Loader2, Search } from "lucide-react";

interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  defaultAddress: string | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(search))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-[#A6822E] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-sm text-gray-400 mt-1">
            {customers.length} registered customer{customers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-64 pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#A6822E] transition-all"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">
            {search ? "No customers match your search" : "No customers yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((customer) => (
            <div key={customer.id} className="bg-[#16213e] rounded-xl border border-white/5 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#A6822E]/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-[#A6822E]">
                    {customer.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{customer.fullName}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mb-3">
                <div className="flex-1 bg-white/5 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-white">{customer.orderCount}</p>
                  <p className="text-[10px] text-gray-400">Orders</p>
                </div>
                <div className="flex-1 bg-white/5 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-[#A6822E]">{formatPrice(customer.totalSpent)}</p>
                  <p className="text-[10px] text-gray-400">Total Spent</p>
                </div>
              </div>

              {customer.phone && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Phone className="h-3 w-3" />
                  <span>{customer.phone}</span>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                Joined {new Date(customer.createdAt).toLocaleDateString("en-NG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
