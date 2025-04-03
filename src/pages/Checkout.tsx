
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { NavigationBar } from '@/components/NavigationBar';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/contexts/OrderContext';
import { useToast } from "@/hooks/use-toast";

export default function Checkout() {
  const { items, summary, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { createOrder } = useOrders();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  // Card payment details - Hardcoded values for testing
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/25');
  const [cardCvc, setCardCvc] = useState('123');
  const [cardName, setCardName] = useState('Test User');

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate('/login?redirectTo=/checkout');
    return null;
  }

  // Redirect to cart if there are no items
  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const validateCardDetails = () => {
    setPaymentError(null);
    
    if (!deliveryAddress) {
      setPaymentError("Please enter a delivery address");
      return false;
    }
    
    if (paymentMethod === 'card') {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
        setPaymentError("Please enter a valid card number");
        return false;
      }
      
      if (!cardExpiry || !cardExpiry.includes('/')) {
        setPaymentError("Please enter a valid expiry date (MM/YY)");
        return false;
      }
      
      if (!cardCvc || cardCvc.length < 3) {
        setPaymentError("Please enter a valid CVC code");
        return false;
      }
      
      if (!cardName) {
        setPaymentError("Please enter the cardholder name");
        return false;
      }
    }
    
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateCardDetails()) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      if (!user) {
        navigate('/login?redirectTo=/checkout');
        return;
      }

      console.log('Creating order for user:', user.id);
      console.log('Items to be ordered:', items);

      // Use the createOrder function from OrderContext
      const order = await createOrder(
        user.id,
        user.name || 'Customer',
        items,
        summary,
        deliveryAddress,
        paymentMethod
      );

      console.log('Order created successfully:', order);
      
      // Clear the cart
      clearCart();

      // Show success message
      toast({
        title: "Order placed successfully",
        description: paymentMethod === 'cash' 
          ? "Your cash on delivery order has been placed" 
          : "Your payment was successful",
      });

      // Navigate to order confirmation
      navigate(`/order-confirmation/${order.id}`);
    } catch (error: any) {
      console.error('Error placing order:', error);
      setPaymentError(error.message || "There was an error processing your order. Please try again.");
      
      toast({
        title: "Order placement failed",
        description: error.message || "There was an error processing your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Format card expiry date
  const formatCardExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length > 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return v;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Checkout</h1>

        {paymentError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment failed</AlertTitle>
            <AlertDescription>{paymentError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Delivery Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
                <CardDescription>Enter your delivery details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={user?.name || ''} readOnly />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Delivery Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your full delivery address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="min-h-24"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Choose how you want to pay</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="cash">Cash on Delivery</SelectItem>
                  </SelectContent>
                </Select>

                {paymentMethod === 'card' && (
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardName">Cardholder Name</Label>
                      <Input 
                        id="cardName" 
                        placeholder="John Doe" 
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        autoComplete="cc-name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input 
                        id="cardNumber" 
                        placeholder="1234 5678 9012 3456" 
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                        autoComplete="cc-number"
                      />
                      <p className="text-xs text-gray-500">
                        Using test card number: 4242 4242 4242 4242
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input 
                          id="expiry" 
                          placeholder="MM/YY" 
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatCardExpiry(e.target.value))}
                          maxLength={5}
                          autoComplete="cc-exp"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvc">CVC</Label>
                        <Input 
                          id="cvc" 
                          placeholder="123" 
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                          maxLength={4}
                          autoComplete="cc-csc"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.amount} × {item.name}</span>
                      <span>${(item.price * item.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${summary.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span>
                      {summary.isDeliveryFeeWaived ? (
                        <span className="line-through text-gray-400 mr-1">${summary.deliveryFee.toFixed(2)}</span>
                      ) : (
                        `$${summary.deliveryFee.toFixed(2)}`
                      )}
                      {summary.isDeliveryFeeWaived && (
                        <span className="text-green-600 text-xs ml-1">Waived</span>
                      )}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${summary.total.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || !deliveryAddress}
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    paymentMethod === 'cash' 
                      ? `Place Order ($${summary.total.toFixed(2)})` 
                      : `Pay $${summary.total.toFixed(2)}`
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
