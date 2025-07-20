
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { NavigationBar } from '@/components/NavigationBar';
import { useOrders } from '@/contexts/OrderContext';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";

interface OrderItem {
  id: string;
  product_name: string;
  amount: number;
  price: number;
}

interface OrderDetails {
  id: string;
  customer_name: string;
  delivery_address: string;
  payment_method: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  items: OrderItem[];
}

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const { getOrder, updateOrderStatus } = useOrders();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Fetch order details from Supabase
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        navigate('/');
        return;
      }

      try {
        setIsLoading(true);
        console.log('Fetching order details for orderID:', orderId);
        
        // Try to get the order from Supabase
        const { data: orderData, error: orderError } = await supabase
          .from('full_orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderError) {
          console.error('Error fetching order:', orderError);
          
          // If not found in Supabase, try from context (legacy)
          const contextOrder = getOrder(orderId);
          if (contextOrder) {
            console.log('Found order in context:', contextOrder);
            setOrder({
              id: contextOrder.id,
              customer_name: contextOrder.customerName,
              delivery_address: contextOrder.deliveryAddress,
              payment_method: contextOrder.paymentMethod,
              status: contextOrder.status,
              subtotal: contextOrder.summary.subtotal,
              delivery_fee: contextOrder.summary.deliveryFee,
              total: contextOrder.summary.total,
              created_at: contextOrder.createdAt,
              items: contextOrder.items.map(item => ({
                id: item.id,
                product_name: item.name,
                amount: item.amount,
                price: item.price
              }))
            });
          } else {
            console.error('Order not found in context either');
            navigate('/');
          }
          setIsLoading(false);
          return;
        }

        console.log('Order data from Supabase:', orderData);

        // If found in Supabase, get the order items
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);

        if (itemsError) {
          console.error('Error fetching order items:', itemsError);
          setIsLoading(false);
          return;
        }

        console.log('Order items from Supabase:', itemsData);

        setOrder({
          ...orderData,
          items: itemsData as OrderItem[]
        });
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, navigate, getOrder]);

  // Auto-complete order after a certain time (30 seconds for demo purposes)
  useEffect(() => {
    if (!order || order.status !== 'pending') return;

    // Set initial time left for demo purposes (30 seconds)
    const initialTimeLeft = 30;
    setTimeLeft(initialTimeLeft);
    
    // Start countdown
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          // Update order status to completed
          if (orderId) {
            updateOrderInDb();
            return 0;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const updateOrderInDb = async () => {
      try {
        // Try to update in Supabase first
        const { error } = await supabase
          .from('full_orders')
          .update({ status: 'completed' })
          .eq('id', orderId);
        
        if (error) {
          console.error('Failed to update order in Supabase:', error);
          // Fall back to context update
          if (updateOrderStatus) {
            updateOrderStatus(orderId as string, 'completed');
          }
        }
        
        // Update local state
        setOrder(prev => prev ? { ...prev, status: 'completed' } : null);
        
        toast({
          title: "Order Completed!",
          description: "Your order has been marked as completed.",
        });
      } catch (error) {
        console.error('Error updating order status:', error);
      }
    };

    return () => clearInterval(interval);
  }, [order, orderId, toast, updateOrderStatus]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavigationBar />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  // Determine status color and icon
  const getStatusDisplay = () => {
    const statusMap: Record<string, { color: string, iconClass: string }> = {
      'pending': { color: 'bg-yellow-100 text-yellow-600', iconClass: 'text-yellow-600' },
      'processing': { color: 'bg-blue-100 text-blue-600', iconClass: 'text-blue-600' },
      'delivering': { color: 'bg-purple-100 text-purple-600', iconClass: 'text-purple-600' },
      'completed': { color: 'bg-green-100 text-green-600', iconClass: 'text-green-600' },
      'cancelled': { color: 'bg-red-100 text-red-600', iconClass: 'text-red-600' },
      'payment_failed': { color: 'bg-red-100 text-red-600', iconClass: 'text-red-600' }
    };

    return statusMap[order.status] || { color: 'bg-gray-100 text-gray-600', iconClass: 'text-gray-600' };
  };

  const statusDisplay = getStatusDisplay();
  const isSuccessful = order.status !== 'payment_failed' && order.status !== 'cancelled';

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />
      
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-8">
            {isSuccessful ? (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-600"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
            ) : (
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-600"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </div>
            )}
            
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {isSuccessful ? "Order Confirmed!" : "Payment Failed"}
            </h1>
            <p className="text-gray-600">
              {isSuccessful 
                ? "Thank you for your order. Your order has been placed successfully."
                : "There was an error processing your payment. Please try again."
              }
            </p>
          </div>
          
          <div className="mb-8 text-left border rounded-md p-4">
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">{order.id.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Date:</span>
                <span className="font-medium">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Order Status:</span>
                <div className="flex items-center space-x-2">
                  <span className={`font-medium capitalize px-2 py-1 rounded-full text-sm ${statusDisplay.color}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                  {order.status === 'pending' && timeLeft !== null && (
                    <span className="text-xs text-gray-500">
                      (Completing in {timeLeft}s)
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium">${order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium capitalize">{order.payment_method}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {isSuccessful ? (
              <p className="text-gray-600">
                We've sent a confirmation email to your registered email address.
                You can also track your order status in your account.
              </p>
            ) : (
              <p className="text-gray-600">
                You can try placing your order again with a different payment method.
                If you continue to experience issues, please contact customer support.
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Button asChild variant="outline">
                <Link to="/">Continue Shopping</Link>
              </Button>
              {isSuccessful ? (
                <Button asChild>
                  <Link to="/orders">View My Orders</Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/cart">Return to Cart</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
