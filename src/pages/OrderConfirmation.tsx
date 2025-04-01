
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { NavigationBar } from '@/components/NavigationBar';
import { useOrders } from '@/contexts/OrderContext';

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const { getOrder } = useOrders();
  const [order, setOrder] = useState(getOrder(orderId || ''));
  const navigate = useNavigate();

  useEffect(() => {
    if (!orderId || !order) {
      navigate('/');
    }
  }, [orderId, order, navigate]);

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
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Status:</span>
                <span className="font-medium capitalize">{order.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium">${order.summary.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium capitalize">{order.paymentMethod}</span>
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
