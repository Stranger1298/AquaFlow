
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NavigationBar } from '@/components/NavigationBar';
import { ProductCard } from '@/components/ProductCard';
import { useProducts, ProductFilterOptions } from '@/contexts/ProductContext';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Products() {
  const [searchParams] = useSearchParams();
  const { products, filterProducts, isLoading } = useProducts();
  const initialSearch = searchParams.get('search') || '';
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [quantity, setQuantity] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // Available quantities (based on existing products)
  const availableQuantities = [...new Set(products.map(p => p.quantity))].sort((a, b) => a - b);
  
  // Find min and max price in products
  const minPrice = Math.floor(Math.min(...products.map(p => p.price), 0));
  const maxPrice = Math.ceil(Math.max(...products.map(p => p.price), 100));
  
  // Update price range based on products when they load
  useEffect(() => {
    if (products.length > 0) {
      setPriceRange([minPrice, maxPrice]);
    }
  }, [products, minPrice, maxPrice]);
  
  // Apply filters
  useEffect(() => {
    const options: ProductFilterOptions = {
      search: searchTerm || null,
      quantity: quantity ? Number(quantity) : null,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
    };
    
    const filtered = filterProducts(options);
    setFilteredProducts(filtered);
    console.log('Filtered products:', filtered.length);
  }, [searchTerm, quantity, priceRange, filterProducts, products]);

  // Generate search suggestions
  useEffect(() => {
    if (searchTerm.length > 0) {
      const allProductNames = [...new Set(products.map(p => p.name.toLowerCase()))];
      const allVendorNames = [...new Set(products.map(p => p.vendorName.toLowerCase()))];
      const allTerms = [...allProductNames, ...allVendorNames];
      
      const filtered = allTerms.filter(term => 
        term.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5);
      
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm, products]);

  const handleSelectSuggestion = (value: string) => {
    setSearchTerm(value);
    setOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Browse Water Products</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-4">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>
              
              <div className="space-y-6">
                {/* Search Filter with suggestions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Search products..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if (e.target.value.length > 0) {
                              setOpen(true);
                            }
                          }}
                          className="w-full pr-8"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-full" align="start">
                      <Command>
                        <CommandList>
                          <CommandGroup>
                            {suggestions.map((suggestion) => (
                              <CommandItem
                                key={suggestion}
                                onSelect={() => handleSelectSuggestion(suggestion)}
                              >
                                <span>{suggestion}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                        <CommandEmpty>No results found</CommandEmpty>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Quantity Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Water Quantity
                  </label>
                  <Select
                    value={quantity}
                    onValueChange={setQuantity}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select quantity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any quantity</SelectItem>
                      {availableQuantities.map((q) => (
                        <SelectItem key={q} value={q.toString()}>
                          {q}L
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="mb-2">
                    <Slider
                      defaultValue={[minPrice, maxPrice]}
                      max={maxPrice}
                      min={minPrice}
                      step={1}
                      value={priceRange}
                      onValueChange={(value) => setPriceRange(value as [number, number])}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
                
                {/* Clear Filters */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchTerm('');
                    setQuantity('');
                    setPriceRange([minPrice, maxPrice]);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
          
          {/* Products Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md h-72 animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setQuantity('');
                    setPriceRange([minPrice, maxPrice]);
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
