
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/components/ui/use-toast";

// Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  vendorId: string;
  vendorName: string;
  quantity: number; // Water quantity in liters
  image: string;
  featured: boolean;
  isService?: boolean;
  serviceType?: string;
}

export type ProductFilterOptions = {
  quantity?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  vendorId?: string | null;
  search?: string | null;
  isService?: boolean | null;
};

interface ProductContextType {
  products: Product[];
  featuredProducts: Product[];
  services: Product[];
  isLoading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductsByVendor: (vendorId: string) => Product[];
  getProduct: (id: string) => Product | undefined;
  filterProducts: (options: ProductFilterOptions) => Product[];
}

// Mock data
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Mountain Fresh Water',
    description: 'Pure spring water from mountain sources',
    price: 15.99,
    vendorId: '1',
    vendorName: 'Water Corp',
    quantity: 20, // 20L
    image: '/placeholder.svg',
    featured: true,
  },
  {
    id: '2',
    name: 'Natural Spring Water',
    description: 'Clean and refreshing natural spring water',
    price: 8.99,
    vendorId: '1',
    vendorName: 'Water Corp',
    quantity: 10, // 10L
    image: '/placeholder.svg',
    featured: false,
  },
  {
    id: '3',
    name: 'Mineral Water',
    description: 'Enriched with essential minerals for health',
    price: 25.99,
    vendorId: '1',
    vendorName: 'Water Corp',
    quantity: 50, // 50L
    image: '/placeholder.svg',
    featured: true,
  },
  {
    id: '4',
    name: 'Alkaline Water',
    description: 'pH balanced water for optimal hydration',
    price: 12.99,
    vendorId: '3',
    vendorName: 'Pure Hydration',
    quantity: 10, // 10L
    image: '/placeholder.svg',
    featured: false,
  },
  {
    id: '5',
    name: 'Mountain Spring Water',
    description: 'Sourced from pristine mountain springs',
    price: 18.99,
    vendorId: '3',
    vendorName: 'Pure Hydration',
    quantity: 20, // 20L
    image: '/placeholder.svg',
    featured: true,
  },
  {
    id: '6',
    name: 'Water Filtration System Installation',
    description: 'Professional installation of home water filtration systems',
    price: 149.99,
    vendorId: '1',
    vendorName: 'Water Corp',
    quantity: 1,
    image: '/placeholder.svg',
    featured: true,
    isService: true,
    serviceType: 'installation'
  },
  {
    id: '7',
    name: 'Monthly Water Testing',
    description: 'Regular testing of your water quality',
    price: 29.99,
    vendorId: '1',
    vendorName: 'Water Corp',
    quantity: 1,
    image: '/placeholder.svg',
    featured: false,
    isService: true,
    serviceType: 'testing'
  },
  {
    id: '8',
    name: 'Water Cooler Maintenance',
    description: 'Cleaning and maintenance of water coolers',
    price: 59.99,
    vendorId: '3',
    vendorName: 'Pure Hydration',
    quantity: 1,
    image: '/placeholder.svg',
    featured: true,
    isService: true,
    serviceType: 'maintenance'
  },
  {
    id: '9',
    name: 'Water Softener Installation',
    description: 'Professional installation of water softening systems',
    price: 199.99,
    vendorId: '3',
    vendorName: 'Pure Hydration',
    quantity: 1,
    image: '/placeholder.svg',
    featured: false,
    isService: true,
    serviceType: 'installation'
  },
  // New water products
  {
    id: '10',
    name: 'Sparkling Water',
    description: 'Naturally carbonated spring water with a refreshing fizz',
    price: 14.99,
    vendorId: '1',
    vendorName: 'Water Corp',
    quantity: 15,
    image: '/placeholder.svg',
    featured: true,
  },
  {
    id: '11',
    name: 'Electrolyte Water',
    description: 'Enhanced with essential electrolytes for optimal hydration during workouts',
    price: 19.99,
    vendorId: '3',
    vendorName: 'Pure Hydration',
    quantity: 10,
    image: '/placeholder.svg',
    featured: true,
  },
  {
    id: '12',
    name: 'Distilled Water',
    description: 'Ultra-pure water ideal for appliances and medical use',
    price: 7.99,
    vendorId: '1',
    vendorName: 'Water Corp',
    quantity: 20,
    image: '/placeholder.svg',
    featured: false,
  },
  {
    id: '13',
    name: 'Hydrogen-Enriched Water',
    description: 'Infused with molecular hydrogen for antioxidant benefits',
    price: 26.99,
    vendorId: '3',
    vendorName: 'Pure Hydration',
    quantity: 5,
    image: '/placeholder.svg',
    featured: true,
  },
  {
    id: '14',
    name: 'Vitamin Water',
    description: 'Fortified with essential vitamins for an extra health boost',
    price: 17.99,
    vendorId: '1',
    vendorName: 'Water Corp',
    quantity: 10,
    image: '/placeholder.svg',
    featured: false,
  },
  {
    id: '15',
    name: 'Glacier Water',
    description: 'Collected from ancient glaciers for pristine purity',
    price: 29.99,
    vendorId: '3',
    vendorName: 'Pure Hydration',
    quantity: 10,
    image: '/placeholder.svg',
    featured: true,
  },
  {
    id: '16',
    name: 'Artesian Well Water',
    description: 'Naturally filtered through underground aquifers',
    price: 21.99,
    vendorId: '1',
    vendorName: 'Water Corp',
    quantity: 15,
    image: '/placeholder.svg',
    featured: false,
  },
  {
    id: '17',
    name: 'Fluoride-Free Water',
    description: 'Specially filtered to remove fluoride and other additives',
    price: 16.99,
    vendorId: '3',
    vendorName: 'Pure Hydration',
    quantity: 20,
    image: '/placeholder.svg',
    featured: false,
  },
  {
    id: '18',
    name: 'Water Delivery Subscription',
    description: 'Regular delivery of fresh water to your doorstep',
    price: 39.99,
    vendorId: '1',
    vendorName: 'Water Corp',
    quantity: 1,
    image: '/placeholder.svg',
    featured: true,
    isService: true,
    serviceType: 'delivery'
  },
  {
    id: '19',
    name: 'Emergency Water Supply',
    description: 'Long-term storage water for emergency preparedness',
    price: 45.99,
    vendorId: '3',
    vendorName: 'Pure Hydration',
    quantity: 50,
    image: '/placeholder.svg',
    featured: false,
  },
  {
    id: '20',
    name: 'Water Filter Replacement',
    description: 'Professional replacement of water filters in your system',
    price: 79.99,
    vendorId: '1',
    vendorName: 'Water Corp',
    quantity: 1,
    image: '/placeholder.svg',
    featured: false,
    isService: true,
    serviceType: 'maintenance'
  },
];

// Create context
const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Provider component
export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load products
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProducts(MOCK_PRODUCTS);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Get featured products
  const featuredProducts = products.filter(product => product.featured);
  
  // Get services
  const services = products.filter(product => product.isService);

  // Add a new product
  const addProduct = async (product: Omit<Product, 'id'>): Promise<void> => {
    setIsLoading(true);
    
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const newProduct = {
          ...product,
          id: `product_${Date.now()}`,
        };
        
        setProducts([...products, newProduct]);
        toast({
          title: "Product added",
          description: `${newProduct.name} has been added successfully`,
        });
        setIsLoading(false);
        resolve();
      }, 500);
    });
  };

  // Update a product
  const updateProduct = async (id: string, updates: Partial<Product>): Promise<void> => {
    setIsLoading(true);
    
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const productIndex = products.findIndex(p => p.id === id);
        
        if (productIndex === -1) {
          toast({
            title: "Update failed",
            description: "Product not found",
            variant: "destructive",
          });
          setIsLoading(false);
          reject(new Error('Product not found'));
          return;
        }
        
        const updatedProducts = [...products];
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          ...updates,
        };
        
        setProducts(updatedProducts);
        toast({
          title: "Product updated",
          description: `${updatedProducts[productIndex].name} has been updated`,
        });
        setIsLoading(false);
        resolve();
      }, 500);
    });
  };

  // Delete a product
  const deleteProduct = async (id: string): Promise<void> => {
    setIsLoading(true);
    
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const product = products.find(p => p.id === id);
        
        if (!product) {
          toast({
            title: "Delete failed",
            description: "Product not found",
            variant: "destructive",
          });
          setIsLoading(false);
          reject(new Error('Product not found'));
          return;
        }
        
        const updatedProducts = products.filter(p => p.id !== id);
        setProducts(updatedProducts);
        toast({
          title: "Product deleted",
          description: `${product.name} has been removed`,
        });
        setIsLoading(false);
        resolve();
      }, 500);
    });
  };

  // Get products by vendor
  const getProductsByVendor = (vendorId: string): Product[] => {
    return products.filter(product => product.vendorId === vendorId);
  };

  // Get a single product
  const getProduct = (id: string): Product | undefined => {
    return products.find(product => product.id === id);
  };

  // Filter products
  const filterProducts = (options: ProductFilterOptions): Product[] => {
    return products.filter(product => {
      // Filter by isService
      if (options.isService !== undefined && options.isService !== null) {
        if (options.isService && !product.isService) return false;
        if (!options.isService && product.isService) return false;
      }
      
      // Filter by quantity
      if (options.quantity && product.quantity !== options.quantity) {
        return false;
      }
      
      // Filter by price range
      if (options.minPrice && product.price < options.minPrice) {
        return false;
      }
      if (options.maxPrice && product.price > options.maxPrice) {
        return false;
      }
      
      // Filter by vendor
      if (options.vendorId && product.vendorId !== options.vendorId) {
        return false;
      }
      
      // Filter by search term
      if (options.search) {
        const searchTerm = options.search.toLowerCase();
        return (
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.vendorName.toLowerCase().includes(searchTerm)
        );
      }
      
      return true;
    });
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        featuredProducts,
        services,
        isLoading,
        error,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductsByVendor,
        getProduct,
        filterProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

// Custom hook to use the product context
export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
