
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { NavigationBar } from '@/components/NavigationBar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

// Types
interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  amount: number;
  price: number;
  vendor_id: string;
  vendor_name: string;
  image: string;
}

interface Order {
  id: string;
  customer_name: string;
  delivery_address: string;
  payment_method: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  items?: OrderItem[];
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch orders from Supabase
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Fetch orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('full_orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (ordersError) {
          throw ordersError;
        }
        
        // Fetch order items for each order
        const ordersWithItems = await Promise.all(
          ordersData.map(async (order) => {
            const { data: itemsData, error: itemsError } = await supabase
              .from('order_items')
              .select('*')
              .eq('order_id', order.id);
              
            if (itemsError) {
              console.error('Error fetching order items:', itemsError);
              return { ...order, items: [] };
            }
            
            return { ...order, items: itemsData };
          })
        );
        
        setOrders(ordersWithItems);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error",
          description: "Failed to load orders. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrders();
  }, [user, toast]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500';
      case 'processing':
        return 'bg-blue-500';
      case 'delivering':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Orders</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-water-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl text-gray-600 mb-4">You haven't placed any orders yet</h2>
            <Button onClick={() => navigate('/products')}>
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b">
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">Order #{order.id.substring(0, 8)}</h2>
                      <p className="text-gray-500">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-700">Status:</span>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Delivery Address</h3>
                      <p className="text-gray-800">{order.delivery_address}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Payment Method</h3>
                      <p className="text-gray-800 capitalize">{order.payment_method}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items && order.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.product_name}</TableCell>
                            <TableCell>{item.amount}</TableCell>
                            <TableCell>${item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">${(item.price * item.amount).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="mt-6 border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span>Delivery Fee</span>
                      <span>${order.delivery_fee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold mt-2 text-lg">
                      <span>Total</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
