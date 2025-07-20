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

// Free stock images from Unsplash
const WATER_IMAGES = [
  'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1610801264293-997f98d50294?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1559839914-17aae19cec71?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542013936693-884638332954?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1564419320461-6870880221ad?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1550353127-b0da3aeaa0ca?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1603890924686-c58538fc6564?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556401615-c909c3d67480?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1532938769389-77a8c2fc4d15?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500630417200-63156e226754?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1566931064303-2ecc0cfa0474?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556229162-5c63ed9c4efb?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1536939459926-301728717817?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1536746295297-3928a1334bc5?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1563351672-62b74891a28a?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1548192746-dd526f154ed9?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1566934639832-c6be959bd7a3?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1564775213453-d1256c36f5d1?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544021601-3025550de10b?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1590856863596-87427f0ab4b9?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1563207153-f403bf289096?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516912481808-3406841bd33c?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1552753966-adaca8fba31b?q=80&w=800&auto=format&fit=crop'
];

const SERVICE_IMAGES = [
  'https://images.unsplash.com/photo-1584155828260-3f5bcf73a647?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1574870111867-089730e5a72b?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1531873252757-8c22fa9e7a98?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1607582544956-76d28100e5b6?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1598965402089-897ce52e8355?q=80&w=800&auto=format&fit=crop'
];

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
    image: WATER_IMAGES[0],
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
    image: WATER_IMAGES[1],
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
    image: WATER_IMAGES[2],
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
    image: WATER_IMAGES[3],
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
    image: WATER_IMAGES[4],
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
    image: SERVICE_IMAGES[0],
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
    image: SERVICE_IMAGES[1],
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
    image: SERVICE_IMAGES[2],
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
    image: SERVICE_IMAGES[3],
    featured: false,
    isService: true,
    serviceType: 'installation'
  },
  {
    id: '10',
    name: 'Sparkling Water',
    description: 'Naturally carbonated spring water with a refreshing fizz',
    price: 14.99,
    vendorId: '1',
    vendorName: 'Water Corp',
    quantity: 15,
    image: WATER_IMAGES[5],
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
    image: WATER_IMAGES[6],
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
    image: WATER_IMAGES[7],
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
    image: WATER_IMAGES[8],
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
    image: WATER_IMAGES[9],
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
    image: WATER_IMAGES[10],
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
    image: WATER_IMAGES[11],
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
    image: WATER_IMAGES[12],
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
    image: SERVICE_IMAGES[2],
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
    image: WATER_IMAGES[13],
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
    image: SERVICE_IMAGES[3],
    featured: false,
    isService: true,
    serviceType: 'maintenance'
  },
  {
    id: '21',
    name: 'Premium Spring Water',
    description: 'Pure spring water from pristine mountain sources',
    price: 22.99,
    vendorId: '3',
    vendorName: 'Pure Hydration',
    quantity: 25,
    image: WATER_IMAGES[14],
    featured: true,
  },
  {
    id: '22',
    name: 'Alkaline Water Plus',
    description: 'High pH alkaline water with added minerals for maximum hydration',
    price: 19.99,
    vendorId: '1',
    vendorName: 'Water Corp',
    quantity: 15,
    image: WATER_IMAGES[15],
    featured: false,
  },
  {
    id: '23',
    name: 'Coconut Water',
    description: 'Natural coconut water, rich in electrolytes and refreshing taste',
    price: 24.99,
    vendorId: '3',
    vendorName: 'Pure Hydration',
    quantity: 5,
    image: WATER_IMAGES[16],
    featured: true,
  },
  {
    id: '24',
    name: 'Detox Water',
    description: 'Purified water with added natural detoxifying ingredients',
    price: 18.99,
    vendorId: '1',
    vendorName: 'Water Corp',
    quantity: 10,
    image: WATER_IMAGES[17],
    featured: false,
  },
  {
    id: '25',
    name: 'Trace Minerals Water',
    description: 'Enhanced with trace minerals essential for health',
    price: 27.99,
    vendorId: '3',
    vendorName: 'Pure Hydration',
    quantity: 15,
    image: WATER_IMAGES[18],
    featured: true,
  },
  {
    id: '26',
    name: 'Mountain Lake Water',
    description: 'Sourced from pristine alpine lakes with natural purity',
    price: 32.99,
    vendorId: '1',
    vendorName: 'Water Corp',
    quantity: 20,
    image: WATER_IMAGES[19],
    featured: false,
  },
  {
    id: '27',
    name: 'Oxygen-Enriched Water',
    description: 'Water with added oxygen for improved performance and recovery',
    price: 23.99,
    vendorId: '3',
    vendorName: 'Pure Hydration',
    quantity: 10,
    image: WATER_IMAGES[20],
    featured: true,
  },
  {
    id: '28',
    name: 'Reverse Osmosis Water',
    description: 'Ultra-pure water processed through advanced reverse osmosis',
    price: 16.99,
    vendorId: '1',
    vendorName: 'Water Corp',
    quantity: 25,
    image: WATER_IMAGES[21],
    featured: false,
  },
  {
    id: '29',
    name: 'Kids Spring Water',
    description: 'Specially packaged spring water perfect for children',
    price: 14.99,
    vendorId: '3',
    vendorName: 'Pure Hydration',
    quantity: 8,
    image: WATER_IMAGES[22],
    featured: true,
  },
  {
    id: '30',
    name: 'Home Water Delivery Service',
    description: 'Regular scheduled delivery of water directly to your home',
    price: 49.99,
    vendorId: '1',
    vendorName: 'Water Corp',
    quantity: 1,
    image: SERVICE_IMAGES[4],
    featured: true,
    isService: true,
    serviceType: 'delivery'
  },
  {
    id: '31',
    name: 'Water Dispenser Rental',
    description: 'Monthly rental of a premium water dispenser for home or office',
    price: 29.99,
    vendorId: '3',
    vendorName: 'Pure Hydration',
    quantity: 1,
    image: SERVICE_IMAGES[5],
    featured: false,
    isService: true,
    serviceType: 'rental'
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
      if (options.minPrice !== null && options.minPrice !== undefined && product.price < options.minPrice) {
        return false;
      }
      if (options.maxPrice !== null && options.maxPrice !== undefined && product.price > options.maxPrice) {
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
