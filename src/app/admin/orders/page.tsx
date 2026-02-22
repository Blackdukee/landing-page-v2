"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList,
  Search,
  Eye,
  X,
  ChevronDown,
  Trash2,
} from "lucide-react";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  customerInfo: {
    name: string;
    address: string;
    phone: string;
    email?: string;
    notes?: string;
  };
  items: OrderItem[];
  totalPrice: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
}

const statusOptions = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const statusColor: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  shipped: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  delivered: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId ? { ...o, status: newStatus as Order["status"] } : o
          )
        );
        if (selectedOrder?._id === orderId) {
          setSelectedOrder((prev) =>
            prev ? { ...prev, status: newStatus as Order["status"] } : null
          );
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      fetchOrders();
      if (selectedOrder?._id === orderId) setSelectedOrder(null);
    } catch (error) {
      console.error(error);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.customerInfo?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o._id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Orders</h1>
        <p className="text-sm text-muted mt-1">
          Track and manage customer orders
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search by customer or order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none rounded-xl border border-border bg-surface text-foreground px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all capitalize"
          >
            <option value="all">All Statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-surface rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <ClipboardList className="h-10 w-10 text-muted mx-auto mb-3" />
            <p className="text-sm text-muted">
              {search || filterStatus !== "all"
                ? "No orders match your filters"
                : "No orders yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Order
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Items
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((order) => (
                  <tr key={order._id} className="hover:bg-card-hover transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono text-muted">
                        #{order._id.slice(-6)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {order.customerInfo?.name}
                        </p>
                        <p className="text-[11px] text-muted">
                          {order.customerInfo?.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {order.items?.length || 0} item
                      {(order.items?.length || 0) !== 1 ? "s" : ""}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-foreground">
                      ${order.totalPrice?.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="relative inline-block">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order._id, e.target.value)
                          }
                          disabled={updatingStatus === order._id}
                          className={`appearance-none rounded-full border px-3 py-1 pr-7 text-[11px] font-medium capitalize cursor-pointer focus:outline-none disabled:opacity-50 ${
                            statusColor[order.status] || ""
                          }`}
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s} className="capitalize">
                              {s}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted text-xs">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-card-hover hover:text-foreground transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(order._id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-base text-foreground">
                Order #{selectedOrder._id.slice(-6)}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Status
                </h3>
                <span
                  className={`inline-block rounded-full border px-3 py-1 text-[11px] font-medium capitalize ${
                    statusColor[selectedOrder.status] || ""
                  }`}
                >
                  {selectedOrder.status}
                </span>
              </div>

              {/* Customer */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Customer
                </h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium text-foreground">{selectedOrder.customerInfo?.name}</p>
                  <p className="text-muted">{selectedOrder.customerInfo?.phone}</p>
                  {selectedOrder.customerInfo?.email && (
                    <p className="text-muted">{selectedOrder.customerInfo.email}</p>
                  )}
                  <p className="text-muted">{selectedOrder.customerInfo?.address}</p>
                  {selectedOrder.customerInfo?.notes && (
                    <p className="text-xs text-muted italic mt-2">
                      Notes: {selectedOrder.customerInfo.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Items
                </h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted">
                          Qty: {item.quantity} &times; ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium text-foreground">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-lg font-bold text-foreground">
                  ${selectedOrder.totalPrice?.toFixed(2)}
                </span>
              </div>

              {/* Date */}
              <p className="text-xs text-muted">
                Ordered: {new Date(selectedOrder.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
