
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { NavigationBar } from '@/components/NavigationBar';
import { useOrders } from '@/contexts/OrderContext';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';

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
  const { getOrder } = useOrders();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch order details from Supabase
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        navigate('/');
        return;
      }

      try {
        // First, try to get the order from Supabase
        const { data: orderData, error: orderError } = await supabase
          .from('full_orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderError) {
          // If not found in Supabase, try from context (legacy)
          const contextOrder = getOrder(orderId);
          if (contextOrder) {
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
            navigate('/');
          }
          setIsLoading(false);
          return;
        }

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

        setOrder({
          ...orderData,
          items: itemsData
        });
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, navigate, getOrder]);

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

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />
      
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-8">
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600">
              Thank you for your order. Your order has been placed successfully.
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
              <div className="flex justify-between">
                <span className="text-gray-600">Order Status:</span>
                <span className="font-medium capitalize">{order.status}</span>
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
            <p className="text-gray-600">
              We've sent a confirmation email to your registered email address.
              You can also track your order status in your account.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Button asChild variant="outline">
                <Link to="/">Continue Shopping</Link>
              </Button>
              <Button asChild>
                <Link to="/orders">View My Orders</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
