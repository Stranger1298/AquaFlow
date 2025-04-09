
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { NavigationBar } from '@/components/NavigationBar';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect URL from query parameters
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirectTo') || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Use setTimeout to prevent state update during render
      setTimeout(() => {
        navigate(role === 'vendor' ? '/vendor/dashboard' : redirectTo, { replace: true });
      }, 0);
    }
  }, [isAuthenticated, navigate, role, redirectTo]);

  useEffect(() => {
    // Update local loading state based on auth provider loading state
    if (!authLoading && isLoading) {
      setIsLoading(false);
    }
  }, [authLoading, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      await login(email, password, role);
      // Navigate will happen in the useEffect when isAuthenticated changes
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError(
        err instanceof Error ? err.message : 'Login failed. Please check your credentials and try again.'
      );
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      const form = e.currentTarget.closest('form');
      if (form) form.requestSubmit();
    }
  };

  return (
    <>
      <NavigationBar />
      <div className="container mx-auto py-10 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Tabs defaultValue="customer" className="w-full" onValueChange={(value) => setRole(value as UserRole)}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="customer">Customer</TabsTrigger>
                <TabsTrigger value="vendor">Vendor</TabsTrigger>
              </TabsList>
              
              <TabsContent value="customer">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-email">Email</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      required
                      autoComplete="email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="customer-password">Password</Label>
                      <Link to="/forgot-password" className="text-sm text-water-600 hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="customer-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="vendor">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendor-email">Email</Label>
                    <Input
                      id="vendor-email"
                      type="email"
                      placeholder="your-business@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      required
                      autoComplete="email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="vendor-password">Password</Label>
                      <Link to="/forgot-password" className="text-sm text-water-600 hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="vendor-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in as Vendor"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex flex-col">
            <div className="text-sm text-center text-gray-500 mt-2">
              Don't have an account?{" "}
              <Link to="/register" className="text-water-600 hover:underline">
                Sign up
              </Link>
            </div>
            
            {/* Debug info for demo */}
            <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs text-gray-600">
              <div className="font-semibold mb-1">Demo Accounts:</div>
              <div>Customer: customer@example.com / password</div>
              <div>Vendor: vendor@example.com / password</div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
