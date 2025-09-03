
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { realmApp, getMongoClient } from '@/integrations/mongodb/client';
import { CartItem, CartSummary } from './CartContext';
// Supabase removed; using localStorage and MongoDB Atlas (Realm) will be wired server-side later.

// Types
export type OrderStatus = 'pending' | 'processing' | 'delivering' | 'completed' | 'cancelled' | 'payment_failed';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: CartItem[];
  summary: CartSummary;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  deliveryAddress: string;
  paymentMethod: string;
}

interface OrderContextType {
  orders: Order[];
  customerOrders: Order[];
  vendorOrders: Order[];
  isLoading: boolean;
  error: string | null;
  createOrder: (
    customerId: string,
    customerName: string,
    items: CartItem[],
    summary: CartSummary,
    deliveryAddress: string,
    paymentMethod: string
  ) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  getOrdersByCustomer: (customerId: string) => Order[];
  getOrdersByVendor: (vendorId: string) => Order[];
  getOrder: (orderId: string) => Order | undefined;
}

// DB shapes
interface DbOrderRecord {
  id: string;
  user_id?: string;
  customer_name?: string;
  delivery_address?: string;
  payment_method?: string;
  status?: OrderStatus;
  subtotal?: number;
  delivery_fee?: number;
  total?: number;
  created_at?: string;
  updated_at?: string;
}

interface DbOrderItemRecord {
  id: string;
  order_id: string;
  product_id?: string;
  product_name?: string;
  quantity?: number;
  amount?: number;
  price?: number;
  vendor_id?: string;
  vendor_name?: string;
  image?: string;
}

// Create context
const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Provider component
export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load orders from localStorage (Supabase removed)
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        console.log('Fetching orders for user:', user.id);
        // If Realm is configured and the current user is authenticated, try fetching from MongoDB Atlas
        if (realmApp && realmApp.currentUser) {
          try {
            const db = getMongoClient();
            const ordersColl = db.collection('full_orders');
            const itemsColl = db.collection('order_items');

            const ordersData = await ordersColl.find({ user_id: user.id }, { sort: { created_at: -1 } });
            const ordersWithItems = await Promise.all(
              ordersData.map(async (o: DbOrderRecord) => {
                const items = await itemsColl.find({ order_id: o.id }) as DbOrderItemRecord[];
                return ({
                  id: o.id,
                  customerId: o.user_id || user.id,
                  customerName: o.customer_name || user.name,
                  items: items.map((it: DbOrderItemRecord) => ({
                    id: it.id,
                    name: it.product_name || '',
                    amount: it.amount || 1,
                    price: it.price || 0,
                    productId: it.product_id || '',
                    vendorId: it.vendor_id || '',
                    vendorName: it.vendor_name || '',
                    image: it.image || ''
                  })),
                  summary: {
                    subtotal: o.subtotal || 0,
                    deliveryFee: o.delivery_fee || 0,
                    total: o.total || 0
                  },
                  status: o.status || 'processing',
                  createdAt: o.created_at || new Date().toISOString(),
                  updatedAt: o.updated_at || o.created_at || new Date().toISOString(),
                  deliveryAddress: o.delivery_address || '',
                  paymentMethod: o.payment_method || ''
                });
              })
            );

            setOrders(ordersWithItems as Order[]);
            setIsLoading(false);
            return;
          } catch (err) {
            console.warn('Failed to fetch orders from Atlas, falling back to localStorage', err);
          }
        }

        // Fallback: First load from localStorage for backward compatibility
        const savedOrders = localStorage.getItem('aquaflow_orders');
        const allOrders = savedOrders ? JSON.parse(savedOrders) : [];
        setOrders(allOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load orders");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrders();
  }, [user]);

  // Create a new order
  const createOrder = async (
    customerId: string,
    customerName: string,
    items: CartItem[],
    summary: CartSummary,
    deliveryAddress: string,
    paymentMethod: string
  ): Promise<Order> => {
    setIsLoading(true);
    
    try {
      // Build local order
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const newOrder: Order = {
        id,
        customerId,
        customerName,
        items,
        summary,
        status: 'processing',
        createdAt: now,
        updatedAt: now,
        deliveryAddress,
        paymentMethod,
      };

      // If Realm is configured and authenticated, persist to MongoDB Atlas (full_orders + order_items)
      if (realmApp && realmApp.currentUser) {
        try {
          const db = getMongoClient();
          const ordersColl = db.collection('full_orders');
          const itemsColl = db.collection('order_items');

          const orderDoc = {
            id,
            user_id: customerId,
            customer_name: customerName,
            delivery_address: deliveryAddress,
            payment_method: paymentMethod,
            status: newOrder.status,
            subtotal: summary.subtotal,
            delivery_fee: summary.deliveryFee,
            total: summary.total,
            created_at: now,
            updated_at: now
          };

          await ordersColl.insertOne(orderDoc);

          const itemsDocs = items.map(item => ({
            id: item.id || crypto.randomUUID(),
            order_id: id,
            product_id: (item as unknown as Record<string, unknown>).productId as string || item.id || '',
            product_name: item.name,
            quantity: item.amount,
            amount: item.amount,
            price: item.price,
            vendor_id: (item as unknown as Record<string, unknown>).vendorId as string || '',
            vendor_name: (item as unknown as Record<string, unknown>).vendorName as string || '',
            image: (item as unknown as Record<string, unknown>).image as string || ''
          }));

          if (itemsDocs.length > 0) await itemsColl.insertMany(itemsDocs);

          // Update local state with the created order
          setOrders(prev => [...prev, newOrder]);
        } catch (err) {
          console.error('Failed to persist order to Atlas, falling back to localStorage', err);
          setOrders(prev => {
            const next = [...prev, newOrder];
            localStorage.setItem('aquaflow_orders', JSON.stringify(next));
            return next;
          });
        }
      } else {
        // Persist locally
        setOrders(prev => {
          const next = [...prev, newOrder];
          localStorage.setItem('aquaflow_orders', JSON.stringify(next));
          return next;
        });
      }

      toast({ title: 'Order placed', description: `Your order #${id.slice(-8)} has been placed successfully.` });
      return newOrder;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('Error creating order:', errMsg);
      toast({
        title: "Order failed",
        description: `Order placement failed: ${errMsg}`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Update local state
      const updatedAt = new Date().toISOString();
      // First try to update in Atlas if available
      if (realmApp && realmApp.currentUser) {
        try {
          const db = getMongoClient();
          const ordersColl = db.collection('full_orders');
          await ordersColl.updateOne({ id: orderId }, { $set: { status, updated_at: updatedAt } });
        } catch (err) {
          console.warn('Failed to update order in Atlas, will update local state only', err);
        }
      }

      setOrders(prev => {
        const next = prev.map(o => o.id === orderId ? { ...o, status, updatedAt } : o);
        localStorage.setItem('aquaflow_orders', JSON.stringify(next));
        return next;
      });

      toast({ title: 'Order updated', description: `Order #${orderId.slice(-8)} status changed to ${status}` });
    } catch (err) {
      console.error('Error updating order status:', err);
      toast({ title: 'Update failed', description: 'Failed to update order status. Please try again.', variant: 'destructive' });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get orders by customer
  const getOrdersByCustomer = (customerId: string): Order[] => {
    return orders.filter(order => order.customerId === customerId);
  };

  // Get orders by vendor
  const getOrdersByVendor = (vendorId: string): Order[] => {
    return orders.filter(order => 
      order.items.some(item => item.vendorId === vendorId)
    );
  };

  // Get a single order
  const getOrder = (orderId: string): Order | undefined => {
    return orders.find(order => order.id === orderId);
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        customerOrders: orders,
        vendorOrders: orders,
        isLoading,
        error,
        createOrder,
        updateOrderStatus,
        getOrdersByCustomer,
        getOrdersByVendor,
        getOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

// Custom hook to use the order context
export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
