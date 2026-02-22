"use client";

import { useEffect, useState } from "react";
import { Package, ClipboardList, DollarSign, TrendingUp } from "lucide-react";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

interface OrderPreview {
  _id: string;
  customerInfo: { name: string };
  totalPrice: number;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<OrderPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/orders").then((r) => r.json()),
    ])
      .then(([products, orders]) => {
        const prods = Array.isArray(products) ? products : [];
        const ords = Array.isArray(orders) ? orders : [];

        setStats({
          totalProducts: prods.length,
          totalOrders: ords.length,
          totalRevenue: ords.reduce(
            (sum: number, o: OrderPreview) => sum + (o.totalPrice || 0),
            0
          ),
          pendingOrders: ords.filter(
            (o: OrderPreview) => o.status === "pending"
          ).length,
        });
        setRecentOrders(ords.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "bg-blue-500/10 text-blue-400",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: ClipboardList,
      color: "bg-green-500/10 text-green-400",
    },
    {
      label: "Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "bg-amber-500/10 text-amber-400",
    },
    {
      label: "Pending Orders",
      value: stats.pendingOrders,
      icon: TrendingUp,
      color: "bg-purple-500/10 text-purple-400",
    },
  ];

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-400",
    confirmed: "bg-blue-500/10 text-blue-400",
    shipped: "bg-purple-500/10 text-purple-400",
    delivered: "bg-green-500/10 text-green-400",
    cancelled: "bg-red-500/10 text-red-400",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted mt-1">
          Overview of your store performance
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-card border border-border animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-2xl bg-card border border-border p-5 transition-all hover:border-primary/20"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted">{label}</span>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent Orders */}
      <div className="rounded-2xl bg-card border border-border">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="font-semibold text-sm text-foreground">Recent Orders</h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-surface rounded animate-pulse" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted">
            No orders yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-card-hover transition-colors">
                    <td className="px-6 py-3.5 font-medium text-foreground">
                      {order.customerInfo?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-3.5 text-foreground">
                      ${order.totalPrice?.toFixed(2)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${
                          statusColor[order.status] || "bg-gray-500/10 text-gray-400"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-muted">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
