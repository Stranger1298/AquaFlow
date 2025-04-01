
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { CartItem, CartSummary } from './CartContext';

// Types
export type OrderStatus = 'pending' | 'processing' | 'delivering' | 'completed' | 'cancelled';

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

  // Load orders from localStorage
  useEffect(() => {
    const savedOrders = localStorage.getItem('hydrate_orders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  }, []);

  // Save orders to localStorage
  useEffect(() => {
    localStorage.setItem('hydrate_orders', JSON.stringify(orders));
  }, [orders]);

  // Get orders for current customer
  const customerOrders = (customerId: string) => {
    return orders.filter(order => order.customerId === customerId);
  };

  // Get orders for current vendor
  const vendorOrders = (vendorId: string) => {
    return orders.filter(order => 
      order.items.some(item => item.vendorId === vendorId)
    );
  };

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
    
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const now = new Date().toISOString();
        const newOrder: Order = {
          id: `order_${Date.now()}`,
          customerId,
          customerName,
          items,
          summary,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
          deliveryAddress,
          paymentMethod,
        };
        
        setOrders(prevOrders => [...prevOrders, newOrder]);
        
        toast({
          title: "Order placed",
          description: `Your order #${newOrder.id.slice(-5)} has been placed successfully`,
        });
        
        setIsLoading(false);
        resolve(newOrder);
      }, 1000);
    });
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
    setIsLoading(true);
    
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const orderIndex = orders.findIndex(order => order.id === orderId);
        
        if (orderIndex === -1) {
          toast({
            title: "Update failed",
            description: "Order not found",
            variant: "destructive",
          });
          setIsLoading(false);
          reject(new Error('Order not found'));
          return;
        }
        
        const updatedOrders = [...orders];
        updatedOrders[orderIndex] = {
          ...updatedOrders[orderIndex],
          status,
          updatedAt: new Date().toISOString(),
        };
        
        setOrders(updatedOrders);
        
        toast({
          title: "Order updated",
          description: `Order #${orderId.slice(-5)} status changed to ${status}`,
        });
        
        setIsLoading(false);
        resolve();
      }, 500);
    });
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
        customerOrders: [],
        vendorOrders: [],
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
