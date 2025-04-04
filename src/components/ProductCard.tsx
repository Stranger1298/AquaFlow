
import { Button } from "@/components/ui/button";
import { Product } from '@/contexts/ProductContext';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, items, updateItemAmount } = useCart();
  const navigate = useNavigate();
  
  const cartItem = items.find(item => item.productId === product.id);
  
  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      amount: 1,
      vendorId: product.vendorId,
      vendorName: product.vendorName,
      image: product.image
    });
  };
  
  const handleIncrease = () => {
    if (cartItem) {
      updateItemAmount(cartItem.id, cartItem.amount + 1);
    } else {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        amount: 1,
        vendorId: product.vendorId,
        vendorName: product.vendorName,
        image: product.image
      });
    }
  };
  
  const handleDecrease = () => {
    if (cartItem && cartItem.amount > 1) {
      updateItemAmount(cartItem.id, cartItem.amount - 1);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02]">
      <div className="relative">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 text-xs font-bold text-water-800">
          {product.quantity}L
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg line-clamp-1 text-gray-800">{product.name}</h3>
          <span className="font-bold text-water-600">${product.price.toFixed(2)}</span>
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{product.description}</p>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">By {product.vendorName}</span>
          
          {cartItem ? (
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-7 w-7 rounded-full" 
                onClick={handleDecrease}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-sm font-medium w-5 text-center">
                {cartItem.amount}
              </span>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-7 w-7 rounded-full" 
                onClick={handleIncrease}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button 
              size="sm" 
              className="bg-water-500 hover:bg-water-600 text-white" 
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-1 h-4 w-4" />
              Add
            </Button>
          )}
        </div>
      </div>
      
      <div 
        className="p-2 cursor-pointer bg-gray-50 text-center text-sm text-gray-600 hover:bg-gray-100"
        onClick={() => navigate(`/products/${product.id}`)}
      >
        View Details
      </div>
    </div>
  );
}
