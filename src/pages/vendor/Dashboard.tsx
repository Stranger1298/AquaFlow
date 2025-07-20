import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NavigationBar } from '@/components/NavigationBar';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts, Product } from '@/contexts/ProductContext';
import { Edit, Trash2, Plus } from 'lucide-react';
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/utils';

export default function VendorDashboard() {
  const { user } = useAuth();
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductsByVendor
  } = useProducts();
  const navigate = useNavigate();

  const vendorProducts = user ? getProductsByVendor(user.id) : [];

  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    description: '',
    price: 0,
    vendorId: user?.id || '',
    vendorName: user?.name || '',
    quantity: 10,
    image: DEFAULT_PRODUCT_IMAGE,
    featured: false,
  });

  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await addProduct(newProduct);
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        vendorId: user?.id || '',
        vendorName: user?.name || '',
        quantity: 10,
        image: DEFAULT_PRODUCT_IMAGE,
        featured: false,
      });
    } catch (error) {
      console.error('Failed to add product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editProduct) return;

    setIsLoading(true);

    try {
      await updateProduct(editProduct.id, editProduct);
      setEditProduct(null);
    } catch (error) {
      console.error('Failed to update product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  // Check if user is not logged in or not a vendor
  if (!user || user.role !== 'vendor') {
    return (
      <>
        <NavigationBar />
        <div className="container mx-auto px-4 py-16">
          <Card className="mx-auto max-w-lg text-center p-6">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You need to be logged in as a vendor to access this page.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate('/login')}>
                Login as Vendor
              </Button>
            </CardFooter>
          </Card>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Vendor Dashboard</h1>
        <p className="text-gray-600 mb-6">Manage your water products and view orders</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-water-600">
                {vendorProducts.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-water-600">
                0
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-water-600">
                $0.00
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products">
          <TabsList className="mb-6">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Products List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Products</CardTitle>
                    <CardDescription>
                      Manage your water products
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {vendorProducts.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-gray-500 mb-3">
                          You don't have any products yet
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const element = document.getElementById('add-product-form');
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Add your first product
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {vendorProducts.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-16 rounded-md overflow-hidden">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <h3 className="font-medium">{product.name}</h3>
                                <div className="flex space-x-3 text-sm text-gray-500">
                                  <span>{product.quantity}L</span>
                                  <span>${product.price.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditProduct(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Add/Edit Product Form */}
              <div className="lg:col-span-1">
                <Card id="add-product-form">
                  <CardHeader>
                    <CardTitle>{editProduct ? 'Edit Product' : 'Add New Product'}</CardTitle>
                    <CardDescription>
                      {editProduct
                        ? 'Update your product details'
                        : 'Add a new water product to your catalog'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={editProduct ? handleUpdateProduct : handleAddProduct} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="product-name">Product Name</Label>
                        <Input
                          id="product-name"
                          value={editProduct ? editProduct.name : newProduct.name}
                          onChange={(e) =>
                            editProduct
                              ? setEditProduct({ ...editProduct, name: e.target.value })
                              : setNewProduct({ ...newProduct, name: e.target.value })
                          }
                          placeholder="e.g. Mountain Spring Water"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="product-description">Description</Label>
                        <Textarea
                          id="product-description"
                          value={editProduct ? editProduct.description : newProduct.description}
                          onChange={(e) =>
                            editProduct
                              ? setEditProduct({ ...editProduct, description: e.target.value })
                              : setNewProduct({ ...newProduct, description: e.target.value })
                          }
                          placeholder="Describe your product..."
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="product-price">Price ($)</Label>
                          <Input
                            id="product-price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={editProduct ? editProduct.price : newProduct.price}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              editProduct
                                ? setEditProduct({ ...editProduct, price: value })
                                : setNewProduct({ ...newProduct, price: value });
                            }}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="product-quantity">Quantity (L)</Label>
                          <Input
                            id="product-quantity"
                            type="number"
                            min="1"
                            value={editProduct ? editProduct.quantity : newProduct.quantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              editProduct
                                ? setEditProduct({ ...editProduct, quantity: value })
                                : setNewProduct({ ...newProduct, quantity: value });
                            }}
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        {editProduct && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditProduct(null)}
                          >
                            Cancel
                          </Button>
                        )}
                        <Button type="submit" disabled={isLoading}>
                          {isLoading
                            ? 'Saving...'
                            : editProduct
                              ? 'Update Product'
                              : 'Add Product'
                          }
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Orders</CardTitle>
                <CardDescription>
                  View and manage customer orders for your products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-3">
                    No orders yet
                  </p>
                  <p className="text-sm text-gray-400">
                    Orders for your products will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  Track your sales and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-3">
                    No analytics available yet
                  </p>
                  <p className="text-sm text-gray-400">
                    Start selling to see your analytics data
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
