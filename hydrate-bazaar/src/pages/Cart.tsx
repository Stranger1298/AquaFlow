
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { NavigationBar } from '@/components/NavigationBar';
import { AdPlayer } from '@/components/AdPlayer';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Minus, Trash2 } from 'lucide-react';

export default function Cart() {
  const { items, summary, updateItemAmount, removeItem, clearCart, waiveDeliveryFee } = useCart();
  const { isAuthenticated } = useAuth();
  const [showAdDialog, setShowAdDialog] = useState(false);
  const navigate = useNavigate();
  
  const handleQuantityChange = (itemId: string, newAmount: number) => {
    updateItemAmount(itemId, newAmount);
  };
  
  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };
  
  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    
    navigate('/checkout');
  };

  const handleWatchAdComplete = () => {
    waiveDeliveryFee();
    setShowAdDialog(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Cart</h1>
        
        {items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Shopping Cart ({summary.itemCount} items)</h2>
                    <Button variant="outline" size="sm" onClick={clearCart}>
                      Clear Cart
                    </Button>
                  </div>
                  
                  <Separator className="mb-6" />
                  
                  <div className="space-y-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex space-x-4">
                        <div className="w-24 h-24 rounded-md overflow-hidden">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h3 className="font-medium text-gray-800">{item.name}</h3>
                            <p className="font-semibold">${(item.price * item.amount).toFixed(2)}</p>
                          </div>
                          
                          <p className="text-sm text-gray-500">
                            {item.quantity}L • ${item.price.toFixed(2)} each
                          </p>
                          
                          <p className="text-xs text-gray-500 mb-2">
                            Sold by {item.vendorName}
                          </p>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7 rounded-full" 
                                onClick={() => handleQuantityChange(item.id, item.amount - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-5 text-center">
                                {item.amount}
                              </span>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7 rounded-full" 
                                onClick={() => handleQuantityChange(item.id, item.amount + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50" 
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${summary.subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-600">Delivery Fee</span>
                      {summary.isDeliveryFeeWaived && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Waived
                        </span>
                      )}
                    </div>
                    <span className="font-medium">
                      {summary.isDeliveryFeeWaived ? (
                        <span className="line-through text-gray-400 mr-1">${summary.deliveryFee.toFixed(2)}</span>
                      ) : (
                        `$${summary.deliveryFee.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${summary.total.toFixed(2)}</span>
                  </div>
                </div>
                
                {!summary.isDeliveryFeeWaived && (
                  <div className="mt-4 p-3 bg-water-50 rounded-md text-sm">
                    <p className="text-water-800 font-medium">Save on delivery!</p>
                    <p className="text-water-700 text-xs mb-2">
                      Watch a short advertisement to waive the delivery fee.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-water-600 border-water-300 hover:bg-water-100"
                      onClick={() => setShowAdDialog(true)}
                    >
                      Watch Ad
                    </Button>
                  </div>
                )}
                
                <Button 
                  className="w-full mt-6"
                  disabled={items.length === 0}
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </Button>
                
                <div className="mt-4 text-center">
                  <Button 
                    variant="link" 
                    className="text-sm"
                    onClick={() => navigate('/products')}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-gray-100 p-6 mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400"
                >
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">
                Looks like you haven't added any water products to your cart yet.
              </p>
              <Button onClick={() => navigate('/products')}>
                Browse Products
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Ad Dialog */}
      <Dialog open={showAdDialog} onOpenChange={setShowAdDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Watch Ad to Waive Delivery Fee</DialogTitle>
            <DialogDescription>
              Watch this short advertisement to have your delivery fee waived.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <AdPlayer onClose={handleWatchAdComplete} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
