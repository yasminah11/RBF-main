import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Eye,
  Calendar,
  Download,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type FulfillmentStatus =
  | "processing"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";
type PaymentStatus = "paid" | "pending" | "refunded";

interface OrderItem {
  id: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
  variantLabel?: string;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  district: string;
  total_amount: number;
  payment_method: string;
  payment_status: PaymentStatus;
  status: FulfillmentStatus;
  items: OrderItem[];
  notes?: string;
}

export function OrdersManager() {
  const { t, formatPrice } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch orders: " + error.message);
    } else {
      setOrders((data || []) as Order[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPayment =
        paymentFilter === "all" || o.payment_status === paymentFilter;
      const matchesFulfillment =
        fulfillmentFilter === "all" || o.status === fulfillmentFilter;
      return matchesSearch && matchesPayment && matchesFulfillment;
    });
  }, [orders, searchQuery, paymentFilter, fulfillmentFilter]);

  const handleStatusChange = async (
    orderId: string,
    status: FulfillmentStatus,
  ) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update status: " + error.message);
      return;
    }
    toast.success("Status updated");
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
    );
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status } : prev));
    }
  };

  const handlePaymentStatusChange = async (
    orderId: string,
    payment_status: PaymentStatus,
  ) => {
    const { error } = await supabase
      .from("orders")
      .update({ payment_status })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update payment status: " + error.message);
      return;
    }
    toast.success("Payment status updated");
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, payment_status } : o)),
    );
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, payment_status } : prev));
    }
  };

  const getStatusIcon = (status: FulfillmentStatus) => {
    switch (status) {
      case "processing":
        return <Clock className="h-3 w-3" />;
      case "confirmed":
        return <CheckCircle2 className="h-3 w-3" />;
      case "shipped":
        return <Truck className="h-3 w-3" />;
      case "delivered":
        return <Package className="h-3 w-3" />;
      case "cancelled":
        return <XCircle className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: FulfillmentStatus) => {
    switch (status) {
      case "processing":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "confirmed":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "shipped":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "delivered":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-500 border-red-500/20";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl text-primary">
          {t.admin.orders.title}
        </h1>
        <p className="text-muted-foreground">
          {filteredOrders.length} total orders found
        </p>
      </div>

      <Card className="bg-card border-border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order # or customer..."
              className="pl-10 bg-background border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[160px] bg-background border-border">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={fulfillmentFilter}
              onValueChange={setFulfillmentFilter}
            >
              <SelectTrigger className="w-[180px] bg-background border-border">
                <SelectValue placeholder="Fulfillment" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className="bg-background border-border"
              onClick={fetchOrders}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border bg-muted/30">
              <tr>
                <th className="px-6 py-4 font-medium">Order #</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Method</th>
                <th className="px-6 py-4 font-medium">Total</th>
                <th className="px-6 py-4 font-medium">Payment</th>
                <th className="px-6 py-4 font-medium">Fulfillment</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-muted/20 transition-colors group cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-6 py-4 font-bold text-foreground">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">
                          {order.customer_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {order.customer_email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="text-[10px] uppercase tracking-widest bg-muted text-muted-foreground border-border">
                        {order.payment_method}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">
                      {formatPrice(order.total_amount)}
                    </td>
                    <td
                      className="px-6 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Select
                        value={order.payment_status}
                        onValueChange={(val) =>
                          handlePaymentStatusChange(
                            order.id,
                            val as PaymentStatus,
                          )
                        }
                      >
                        <SelectTrigger
                          className={cn(
                            "h-8 w-[110px] text-[10px] uppercase font-bold tracking-widest",
                            order.payment_status === "paid"
                              ? "bg-green-500/10 text-green-500 border-green-500/20"
                              : order.payment_status === "pending"
                                ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                : "bg-red-500/10 text-red-500 border-red-500/20",
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem
                            value="paid"
                            className="text-[10px] uppercase font-bold"
                          >
                            Paid
                          </SelectItem>
                          <SelectItem
                            value="pending"
                            className="text-[10px] uppercase font-bold"
                          >
                            Pending
                          </SelectItem>
                          <SelectItem
                            value="refunded"
                            className="text-[10px] uppercase font-bold"
                          >
                            Refunded
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td
                      className="px-6 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Select
                        value={order.status}
                        onValueChange={(val) =>
                          handleStatusChange(order.id, val as FulfillmentStatus)
                        }
                      >
                        <SelectTrigger
                          className={cn(
                            "h-8 w-[140px] text-[10px] uppercase font-bold tracking-widest",
                            getStatusColor(order.status),
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {getStatusIcon(order.status)}
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem
                            value="processing"
                            className="text-[10px] uppercase font-bold"
                          >
                            Processing
                          </SelectItem>
                          <SelectItem
                            value="confirmed"
                            className="text-[10px] uppercase font-bold"
                          >
                            Confirmed
                          </SelectItem>
                          <SelectItem
                            value="shipped"
                            className="text-[10px] uppercase font-bold"
                          >
                            Shipped
                          </SelectItem>
                          <SelectItem
                            value="delivered"
                            className="text-[10px] uppercase font-bold"
                          >
                            Delivered
                          </SelectItem>
                          <SelectItem
                            value="cancelled"
                            className="text-[10px] uppercase font-bold"
                          >
                            Cancelled
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order Details Modal */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="font-display text-2xl text-primary">
                Order {selectedOrder?.order_number}
              </DialogTitle>
              {selectedOrder && (
                <Badge
                  className={cn(
                    "text-[10px] uppercase tracking-widest",
                    getStatusColor(selectedOrder.status),
                  )}
                >
                  {selectedOrder.status}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-8 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                      Customer Information
                    </h3>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground">
                        {selectedOrder.customer_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedOrder.customer_email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedOrder.customer_phone}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                      Shipping Address
                    </h3>
                    <p className="text-sm text-foreground leading-relaxed">
                      {selectedOrder.shipping_address}
                      <br />
                      {selectedOrder.district}, {selectedOrder.city}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                      Payment Method
                    </h3>
                    <Badge className="text-[10px] uppercase tracking-widest bg-muted text-muted-foreground border-border">
                      {selectedOrder.payment_method}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-6">
                  <Card className="bg-background/50 border-border shadow-none">
                    <CardHeader className="py-4">
                      <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Order Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="text-foreground">
                          {formatPrice(selectedOrder.total_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="text-green-500 uppercase text-[10px] font-bold">
                          Free
                        </span>
                      </div>
                      <Separator className="bg-border" />
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-primary font-display">Total</span>
                        <span className="text-foreground">
                          {formatPrice(selectedOrder.total_amount)}
                        </span>
                      </div>
                      <div className="pt-2">
                        <Select
                          value={selectedOrder.payment_status}
                          onValueChange={(val) =>
                            handlePaymentStatusChange(
                              selectedOrder.id,
                              val as PaymentStatus,
                            )
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              "w-full text-[10px] uppercase font-bold tracking-widest",
                              selectedOrder.payment_status === "paid"
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : selectedOrder.payment_status === "pending"
                                  ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                  : "bg-red-500/10 text-red-500 border-red-500/20",
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem
                              value="paid"
                              className="text-[10px] uppercase font-bold"
                            >
                              Paid
                            </SelectItem>
                            <SelectItem
                              value="pending"
                              className="text-[10px] uppercase font-bold"
                            >
                              Pending
                            </SelectItem>
                            <SelectItem
                              value="refunded"
                              className="text-[10px] uppercase font-bold"
                            >
                              Refunded
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Items
                </h3>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-muted/30 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 font-medium">Product</th>
                        <th className="px-4 py-3 font-medium">Price</th>
                        <th className="px-4 py-3 font-medium text-center">
                          Qty
                        </th>
                        <th className="px-4 py-3 font-medium text-right">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedOrder.items.map((item, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {item.image && (
                                <div className="h-10 w-10 rounded bg-muted overflow-hidden border border-border">
                                  <img
                                    src={item.image}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}
                              <div>
                                <span className="font-medium text-foreground block">
                                  {item.name}
                                </span>
                                {item.variantLabel && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {item.variantLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatPrice(item.price)}
                          </td>
                          <td className="px-4 py-3 text-center text-foreground font-bold">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-foreground">
                            {formatPrice(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="bg-primary/5 border border-primary/10 p-4 rounded-lg">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-2">
                    Notes
                  </h3>
                  <p className="text-sm text-muted-foreground italic">
                    "{selectedOrder.notes}"
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                  className="bg-background border-border"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
