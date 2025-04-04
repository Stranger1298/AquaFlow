
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useOrders } from '@/contexts/OrderContext';

// Types
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  amount: number;
  vendorId: string;
  vendorName: string;
  image: string | null;
}

export interface CartSummary {
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  isDeliveryFeeWaived: boolean;
}

interface CartContextType {
  items: CartItem[];
  summary: CartSummary;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItemAmount: (id: string, amount: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  waiveDeliveryFee: () => void;
}

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary>({
    subtotal: 0,
    deliveryFee: 10.00,
    total: 0,
    itemCount: 0,
    isDeliveryFeeWaived: false
  });
  const { toast } = useToast();
  const { orders } = useOrders();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('aquaflow_cart');
    
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
      } catch (error) {
        console.error('Failed to parse saved cart', error);
      }
    }
  }, []);

  // Empty cart after order is placed
  useEffect(() => {
    // Check if a new order was added
    if (orders.length > 0) {
      const lastOrder = orders[0];
      const orderTimestamp = new Date(lastOrder.createdAt).getTime();
      const currentTime = new Date().getTime();
      
      // If the order was placed in the last minute, clear the cart
      if (currentTime - orderTimestamp < 60000) {
        clearCart();
      }
    }
  }, [orders]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('aquaflow_cart', JSON.stringify(items));
    
    // Calculate summary
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Apply free delivery for orders over $50
    const isDeliveryFeeWaived = subtotal >= 50;
    const deliveryFee = isDeliveryFeeWaived ? 0 : 10.00;
    
    setSummary({
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      itemCount,
      isDeliveryFeeWaived
    });
  }, [items]);

  // Add item to cart
  const addItem = (item: Omit<CartItem, 'id'>) => {
    setItems(prevItems => {
      // Check if product already exists in cart
      const existingItem = prevItems.find(i => i.productId === item.productId);
      
      if (existingItem) {
        // Update existing item
        return prevItems.map(i => 
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      } else {
        // Add new item
        const newItem = {
          ...item,
          id: crypto.randomUUID() // Generate UUID for cart item
        };
        
        return [...prevItems, newItem];
      }
    });
    
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart`,
    });
  };

  // Update item quantity
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Update item amount - new function
  const updateItemAmount = (id: string, amount: number) => {
    if (amount <= 0) {
      removeItem(id);
      return;
    }
    
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id
          ? { ...item, amount }
          : item
      )
    );
  };

  // Remove item from cart
  const removeItem = (id: string) => {
    const itemToRemove = items.find(item => item.id === id);
    
    setItems(prevItems => prevItems.filter(item => item.id !== id));
    
    if (itemToRemove) {
      toast({
        title: "Removed from cart",
        description: `${itemToRemove.name} has been removed from your cart`,
      });
    }
  };

  // Clear cart
  const clearCart = () => {
    setItems([]);
  };

  // Check if product is in cart
  const isInCart = (productId: string): boolean => {
    return items.some(item => item.productId === productId);
  };

  // Waive delivery fee
  const waiveDeliveryFee = () => {
    setSummary(prevSummary => ({
      ...prevSummary,
      isDeliveryFeeWaived: true,
      deliveryFee: 0,
      total: prevSummary.subtotal // Update total to reflect waived fee
    }));
    
    toast({
      title: "Delivery fee waived",
      description: "Your delivery fee has been waived!",
    });
  };

  return (
    <CartContext.Provider
      value={{
        items,
        summary,
        addItem,
        updateQuantity,
        updateItemAmount,
        removeItem,
        clearCart,
        isInCart,
        waiveDeliveryFee,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
