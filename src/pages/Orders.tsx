
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { getMongoClient } from '@/integrations/mongodb/client';
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

// Types returned from MongoDB/Realm
interface DbOrder extends Record<string, unknown> {
  id: string;
  user_id: string;
  created_at: string;
}

interface DbOrderItem extends Record<string, unknown> {
  id: string;
  order_id: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    // Wait until auth finishes loading before redirecting to login
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch orders from MongoDB Atlas (Realm) or fall back to localStorage
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Try to fetch from MongoDB Atlas (Realm) if configured
        try {
          const db = getMongoClient();
          const ordersColl = db.collection('full_orders');
          const itemsColl = db.collection('order_items');

          // Realm's find accepts an options object for sorting
          const ordersData = await ordersColl.find({ user_id: user.id }, { sort: { created_at: -1 } }) as DbOrder[];

          const ordersWithItems = await Promise.all(
            ordersData.map(async (order: DbOrder) => {
              const itemsData = await itemsColl.find({ order_id: order.id }) as DbOrderItem[];
              // Cast via unknown to satisfy structural differences between DB rows and Order
              return ({ ...order, items: itemsData } as unknown) as Order;
            })
          );

          setOrders(ordersWithItems as Order[]);
        } catch (err) {
          console.warn('MongoDB Realm not configured or query failed, falling back to localStorage/context', err);

          // Fallback: read from localStorage if present
          const raw = localStorage.getItem('aquaflow_orders');
          if (raw) {
            try {
              const localOrders = JSON.parse(raw) as DbOrder[];
              const userOrders = localOrders.filter(o => o.user_id === user.id).map(o => ({
                id: o.id,
                customer_name: o.customer_name,
                delivery_address: o.delivery_address,
                payment_method: o.payment_method,
                status: o.status,
                subtotal: o.subtotal,
                delivery_fee: o.delivery_fee,
                total: o.total,
                created_at: o.created_at,
                items: o.items || []
              })) as Order[];
              setOrders(userOrders);
            } catch (parseErr) {
              console.error('Failed to parse local orders', parseErr);
            }
          }
        }
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>
          <Button variant="outline" asChild>
            <Link to="/profile">Edit Profile</Link>
          </Button>
        </div>
        
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
