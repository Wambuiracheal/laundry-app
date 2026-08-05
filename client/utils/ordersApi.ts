import { getJson } from "@/utils/apiClient";

export type OrderItem = {
  id: string;
  order_id: string;
  service_id: string;
  quantity: number;
  price: string | null;
  service: {
    id: string;
    name: string;
    description: string | null;
    price_type: string | null;
    base_price: string | null;
  };
};

export type OrderStatusHistoryEntry = {
  id: string;
  order_id: string;
  status: string;
  changed_by: string;
  timestamp: string;
};

export type Payment = {
  id: string;
  order_id: string;
  amount: string;
  payment_method: string;
  transaction_id: string | null;
  status: string;
  created_at: string;
};

export type Order = {
  id: string;
  user_id: string;
  pickup_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  pickup_time: string | null;
  delivery_time: string | null;
  status: string;
  deposit_amount: string | null;
  total_amount: string | null;
  remaining_amount: string | null;
  payment_status: string;
  orderItems: OrderItem[];
  statusHistory: OrderStatusHistoryEntry[];
  payments: Payment[];
  assignedRider?: { id: string; first_name: string; last_name: string; phone: string } | null;
  created_at: string;
  updated_at: string;
};

export async function listMyOrders(accessToken: string): Promise<Order[]> {
  return getJson<Order[]>("/orders/me", accessToken);
}

export async function getOrder(orderId: string): Promise<Order> {
  return getJson<Order>(`/orders/${orderId}`);
}
