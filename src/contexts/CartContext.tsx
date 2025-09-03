
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Product } from './ProductContext';

// Types
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number; // Water quantity in liters
  vendorId: string;
  vendorName: string;
  amount: number; // Number of this item in cart
  image: string;
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
  isLoading: boolean;
  addItem: (product: Product, amount?: number) => void;
  updateItemAmount: (itemId: string, amount: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  waiveDeliveryFee: () => void;
  restoreDeliveryFee: () => void;
}

// Configuration
const DELIVERY_FEE = 5.99;

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeliveryFeeWaived, setIsDeliveryFeeWaived] = useState(false);
  const { toast } = useToast();

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('aquaflow_cart');
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
    
    const savedWaiver = localStorage.getItem('aquaflow_waived_fee');
    if (savedWaiver) {
      setIsDeliveryFeeWaived(JSON.parse(savedWaiver));
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('aquaflow_cart', JSON.stringify(items));
  }, [items]);

  // Save waiver status to localStorage
  useEffect(() => {
    localStorage.setItem('aquaflow_waived_fee', JSON.stringify(isDeliveryFeeWaived));
  }, [isDeliveryFeeWaived]);

  // Listen for ad-viewed events to waive delivery fee
  useEffect(() => {
    const handler = () => setIsDeliveryFeeWaived(true);
    window.addEventListener('aquaflow:ad-viewed', handler as EventListener);
    return () => window.removeEventListener('aquaflow:ad-viewed', handler as EventListener);
  }, []);

  // Calculate cart summary
  const calculateSummary = (): CartSummary => {
    const itemCount = items.reduce((total, item) => total + item.amount, 0);
    const subtotal = items.reduce((total, item) => total + (item.price * item.amount), 0);
    const deliveryFee = isDeliveryFeeWaived ? 0 : DELIVERY_FEE;
    const total = subtotal + deliveryFee;
    
    return {
      subtotal,
      deliveryFee,
      total,
      itemCount,
      isDeliveryFeeWaived,
    };
  };

  // Add item to cart
  const addItem = (product: Product, amount: number = 1) => {
    setItems(prevItems => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex(item => item.productId === product.id);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          amount: updatedItems[existingItemIndex].amount + amount,
        };
        
        toast({
          title: "Cart updated",
          description: `${product.name} quantity increased`,
        });
        
        return updatedItems;
      } else {
        // Add new item
        const newItem: CartItem = {
          id: `cart_${Date.now()}`,
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: product.quantity,
          vendorId: product.vendorId,
          vendorName: product.vendorName,
          amount,
          image: product.image,
        };
        
        toast({
          title: "Added to cart",
          description: `${product.name} added to your cart`,
        });
        
        return [...prevItems, newItem];
      }
    });
  };

  // Update item amount
  const updateItemAmount = (itemId: string, amount: number) => {
    if (amount <= 0) {
      removeItem(itemId);
      return;
    }
    
    setItems(prevItems => {
      const itemIndex = prevItems.findIndex(item => item.id === itemId);
      
      if (itemIndex === -1) return prevItems;
      
      const updatedItems = [...prevItems];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        amount,
      };
      
      return updatedItems;
    });
  };

  // Remove item from cart
  const removeItem = (itemId: string) => {
    setItems(prevItems => {
      const item = prevItems.find(item => item.id === itemId);
      const updatedItems = prevItems.filter(item => item.id !== itemId);
      
      if (item) {
        toast({
          title: "Removed from cart",
          description: `${item.name} removed from your cart`,
        });
      }
      
      return updatedItems;
    });
  };

  // Clear cart
  const clearCart = () => {
    setItems([]);
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart",
    });
  };

  // Waive delivery fee
  const waiveDeliveryFee = () => {
    setIsDeliveryFeeWaived(true);
    toast({
      title: "Delivery fee waived",
      description: "You've successfully waived the delivery fee!",
    });
  };

  // Restore delivery fee
  const restoreDeliveryFee = () => {
    setIsDeliveryFeeWaived(false);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        summary: calculateSummary(),
        isLoading,
        addItem,
        updateItemAmount,
        removeItem,
        clearCart,
        waiveDeliveryFee,
        restoreDeliveryFee,
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
