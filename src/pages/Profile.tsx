
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NavigationBar } from '@/components/NavigationBar';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/contexts/OrderContext';
import { Badge } from "@/components/ui/badge";
import { User, CircleUser, Package, MapPin, Mail, Phone, LogOut } from 'lucide-react';

// Define order stats interface
interface OrderStats {
  total: number;
  completed: number;
  processing: number;
  delivering: number;
  cancelled: number;
}

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const { orders, getOrdersByCustomer } = useOrders();
  const navigate = useNavigate();
  const [orderStats, setOrderStats] = useState<OrderStats>({
    total: 0,
    completed: 0,
    processing: 0,
    delivering: 0,
    cancelled: 0
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Get order statistics
  useEffect(() => {
    if (user) {
      const userOrders = getOrdersByCustomer(user.id);
      
      setOrderStats({
        total: userOrders.length,
        completed: userOrders.filter(order => order.status === 'completed').length,
        processing: userOrders.filter(order => order.status === 'processing').length,
        delivering: userOrders.filter(order => order.status === 'delivering').length,
        cancelled: userOrders.filter(order => order.status === 'cancelled').length
      });
    }
  }, [user, orders, getOrdersByCustomer]);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavigationBar />
        <div className="container mx-auto px-4 py-8 flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Loading Profile...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg">
              <CardHeader className="text-center border-b pb-6">
                <div className="mx-auto bg-water-100 w-24 h-24 rounded-full flex items-center justify-center mb-4">
                  <CircleUser className="h-16 w-16 text-water-600" />
                </div>
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-1 mt-1">
                  <Badge variant="outline" className="capitalize">{user.role || 'Customer'}</Badge>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <span>{user.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <span>Account ID: {user.id.substring(0, 8)}...</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-gray-500" />
                    <span>{orderStats.total} Orders Placed</span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="border-t pt-6 flex justify-center">
                <Button 
                  variant="outline" 
                  className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Order Statistics */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg h-full">
              <CardHeader>
                <CardTitle>Order Statistics</CardTitle>
                <CardDescription>Overview of your order history</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-sm text-gray-500">Total Orders</div>
                    <div className="text-2xl font-bold text-gray-800">{orderStats.total}</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-sm text-gray-500">Completed</div>
                    <div className="text-2xl font-bold text-green-600">{orderStats.completed}</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-sm text-gray-500">Processing</div>
                    <div className="text-2xl font-bold text-blue-600">{orderStats.processing}</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-sm text-gray-500">Cancelled</div>
                    <div className="text-2xl font-bold text-red-600">{orderStats.cancelled}</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <Button 
                    onClick={() => navigate('/orders')}
                    className="bg-water-600 hover:bg-water-700"
                  >
                    View All Orders
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
