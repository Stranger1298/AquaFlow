
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { CartItem, CartSummary } from './CartContext';
import { supabase } from "@/integrations/supabase/client";

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

// Create context
const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Provider component
export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load orders from both localStorage and Supabase
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        console.log('Fetching orders for user:', user.id);
        
        // First load from localStorage for backward compatibility
        const savedOrders = localStorage.getItem('aquaflow_orders');
        let allOrders = savedOrders ? JSON.parse(savedOrders) : [];
        
        // Then fetch from Supabase
        const { data: supabaseOrders, error } = await supabase
          .from('full_orders')
          .select(`
            id,
            status,
            subtotal,
            delivery_fee,
            total,
            created_at,
            updated_at,
            user_id,
            customer_name,
            delivery_address,
            payment_method,
            order_items (*)
          `)
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error fetching orders:', error);
          throw error;
        }
        
        console.log('Retrieved orders from Supabase:', supabaseOrders);
        
        // Transform Supabase data to match our Order interface
        if (supabaseOrders && supabaseOrders.length > 0) {
          const transformedOrders = supabaseOrders.map(order => {
            const orderItems = order.order_items.map((item: any) => ({
              id: item.id,
              productId: item.product_id,
              name: item.product_name,
              price: item.price,
              amount: item.quantity,
              quantity: item.quantity,
              vendorId: item.vendor_id,
              vendorName: item.vendor_name,
              image: item.image || null
            }));
            
            return {
              id: order.id,
              customerId: order.user_id,
              customerName: order.customer_name,
              items: orderItems,
              summary: {
                subtotal: order.subtotal,
                deliveryFee: order.delivery_fee,
                total: order.total,
                isDeliveryFeeWaived: order.delivery_fee === 0,
                itemCount: orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
              },
              status: order.status as OrderStatus,
              createdAt: order.created_at,
              updatedAt: order.updated_at,
              deliveryAddress: order.delivery_address,
              paymentMethod: order.payment_method
            };
          });
          
          console.log('Transformed orders:', transformedOrders);
          
          // Merge and deduplicate orders from both sources
          const orderIds = new Set(allOrders.map((o: Order) => o.id));
          for (const order of transformedOrders) {
            if (!orderIds.has(order.id)) {
              allOrders.push(order);
              orderIds.add(order.id);
            }
          }
        }
        
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
      console.log('Creating order with items:', items);
      
      // Create order in Supabase
      const { data: orderData, error: orderError } = await supabase
        .from('full_orders')
        .insert({
          user_id: customerId,
          customer_name: customerName,
          delivery_address: deliveryAddress,
          payment_method: paymentMethod,
          status: 'processing',
          subtotal: summary.subtotal,
          delivery_fee: summary.deliveryFee,
          total: summary.total
        })
        .select()
        .single();
      
      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error(`Failed to create order: ${orderError.message}`);
      }
      
      console.log('Created order:', orderData);
      
      // Create order items in Supabase - Fix the product ID issue here
      const orderItems = items.map(item => {
        // Convert numeric IDs to UUID format if needed
        // This ensures IDs are in the proper UUID format
        const processedProductId = item.productId.includes('-') ? item.productId : undefined;
        const processedVendorId = item.vendorId.includes('-') ? item.vendorId : undefined;

        return {
          order_id: orderData.id,
          product_id: processedProductId || crypto.randomUUID(), // Generate UUID if invalid
          product_name: item.name,
          quantity: item.quantity,
          amount: item.quantity,
          price: item.price,
          vendor_id: processedVendorId || "00000000-0000-0000-0000-000000000000", // Default UUID if invalid
          vendor_name: item.vendorName,
          image: item.image
        };
      });
      
      console.log('Creating order items:', orderItems);
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) {
        console.error('Order items creation error:', itemsError);
        await supabase
          .from('full_orders')
          .update({ status: 'cancelled' })
          .eq('id', orderData.id);
        throw new Error(`Failed to create order items: ${itemsError.message}`);
      }
      
      // Create payment transaction record
      const { error: paymentError } = await supabase
        .from('payment_transactions')
        .insert({
          order_id: orderData.id,
          payment_method: paymentMethod,
          amount: summary.total,
          status: paymentMethod === 'cash' ? 'cash_on_delivery' : 'completed',
          transaction_id: `tr_${Date.now()}`,
          transaction_data: { 
            payment_details: paymentMethod === 'cash' ? 'Cash on delivery' : 'Payment processed' 
          }
        });
      
      if (paymentError) {
        console.error('Payment transaction error:', paymentError);
        await supabase
          .from('full_orders')
          .update({ status: 'payment_failed' })
          .eq('id', orderData.id);
        throw new Error(`Failed to create payment transaction: ${paymentError.message}`);
      }
      
      // Create the order object to return
      const newOrder: Order = {
        id: orderData.id,
        customerId,
        customerName,
        items,
        summary,
        status: 'processing',
        createdAt: orderData.created_at,
        updatedAt: orderData.created_at,
        deliveryAddress,
        paymentMethod,
      };
      
      // Update local state
      setOrders(prevOrders => [...prevOrders, newOrder]);
      
      toast({
        title: "Order placed",
        description: `Your order #${newOrder.id.slice(-8)} has been placed successfully and is being processed.`,
      });
      
      return newOrder;
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Order failed",
        description: `Order placement failed: ${error.message}`,
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
      // Update order status in Supabase
      const { error } = await supabase
        .from('full_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Update local state for backward compatibility
      setOrders(prevOrders => prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, status, updatedAt: new Date().toISOString() } 
          : order
      ));
      
      toast({
        title: "Order updated",
        description: `Order #${orderId.slice(-8)} status changed to ${status}`,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Update failed",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
      throw error;
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
