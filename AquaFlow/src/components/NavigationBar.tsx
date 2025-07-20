
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, User, LogIn, Droplets } from 'lucide-react';

export function NavigationBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const { user, isAuthenticated, logout } = useAuth();
  const { summary } = useCart();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <nav className="bg-white py-4 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mr-2 shadow-lg">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            AquaFlow
          </Link>
          
          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 mx-8 relative">
            <Input
              type="text"
              placeholder="Search for water products..."
              className="w-full max-w-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button type="submit" className="absolute right-0">
              Search
            </Button>
          </form>
          
          {/* Navigation Links and Auth */}
          <div className="flex items-center space-x-4">
            <Link to="/products" className="text-gray-600 hover:text-blue-600">
              Products
            </Link>
            
            {user?.role === 'vendor' && (
              <Link to="/vendor/dashboard" className="text-gray-600 hover:text-blue-600">
                Vendor Dashboard
              </Link>
            )}
            
            {/* Cart */}
            <Link to="/cart" className="relative">
              <ShoppingCart className="h-6 w-6 text-gray-600 hover:text-blue-600" />
              {summary.itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {summary.itemCount}
                </span>
              )}
            </Link>
            
            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-4 py-2">
                    <p className="text-sm font-medium">
                      {user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">My Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders">My Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => navigate('/login')}>
                <LogIn className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
