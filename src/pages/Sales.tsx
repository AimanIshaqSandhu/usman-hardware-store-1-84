import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, CalendarIcon, CreditCard, DollarSign, Package, Plus, Printer, Search, ShoppingCart, Trash2, User, Star, Pin, PinOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QuickCustomerForm } from "@/components/QuickCustomerForm";
import { salesApi, productsApi, customersApi } from "@/services/api";

interface CartItem {
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  unit: string;
  isPinned?: boolean;
}

const Sales = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [pinnedProducts, setPinnedProducts] = useState<number[]>([]);
  const [saleForm, setSaleForm] = useState({
    paymentMethod: "cash",
    discount: 0,
    notes: ""
  });
  
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchSales();
    fetchProducts();
    fetchCustomers();
    loadPinnedProducts();
  }, []);

  const loadPinnedProducts = () => {
    const saved = localStorage.getItem('pinnedProducts');
    if (saved) {
      setPinnedProducts(JSON.parse(saved));
    }
  };

  const savePinnedProducts = (pinned: number[]) => {
    localStorage.setItem('pinnedProducts', JSON.stringify(pinned));
    setPinnedProducts(pinned);
  };

  const togglePin = (productId: number) => {
    const newPinned = pinnedProducts.includes(productId)
      ? pinnedProducts.filter(id => id !== productId)
      : [...pinnedProducts, productId];
    savePinnedProducts(newPinned);
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await salesApi.getAll({
        dateFrom: today,
        dateTo: today,
        limit: 50
      });
      
      if (response.success) {
        const salesData = response.data?.sales || response.data || [];
        setSales(Array.isArray(salesData) ? salesData : []);
      }
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      setSales([]);
      toast({
        title: "Error",
        description: "Failed to load sales data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsApi.getAll({ limit: 50, status: 'active' });
      if (response.success) {
        const productsData = response.data?.products || response.data || [];
        setProducts(Array.isArray(productsData) ? productsData : []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customersApi.getAll({ limit: 100, status: 'active' });
      if (response.success) {
        const customersData = response.data?.customers || response.data || [];
        setCustomers(Array.isArray(customersData) ? customersData : []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    }
  };

  const addToCart = (product: Product, customQuantity?: number) => {
    const quantity = customQuantity || 1;
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * item.unitPrice }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity,
        unit: product.unit || 'piece',
        unitPrice: product.price,
        total: product.price * quantity
      }]);
    }

    toast({
      title: "Added to Cart",
      description: `${quantity} ${product.unit || 'piece'}(s) of ${product.name} added to cart`,
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item => 
      item.productId === productId 
        ? { ...item, quantity, total: quantity * item.unitPrice }
        : item
    ));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const discount = saleForm.discount || 0;
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * 0.1; // 10% tax
    return {
      subtotal,
      discount,
      tax,
      total: afterDiscount + tax
    };
  };

  const handleCreateSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to cart",
        variant: "destructive"
      });
      return;
    }

    try {
      const totals = calculateTotal();
      const saleData = {
        customerId: selectedCustomer?.id || null,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        discount: saleForm.discount,
        paymentMethod: saleForm.paymentMethod,
        notes: saleForm.notes
      };

      const response = await salesApi.create(saleData);
      
      if (response.success) {
        toast({
          title: "Sale Created",
          description: "Sale has been created successfully",
        });
        
        // Reset form
        setCart([]);
        setSelectedCustomer(null);
        setSaleForm({ paymentMethod: "cash", discount: 0, notes: "" });
        setIsNewSaleOpen(false);
        
        // Refresh sales data
        fetchSales();
      }
    } catch (error) {
      console.error('Failed to create sale:', error);
      toast({
        title: "Error",
        description: "Failed to create sale",
        variant: "destructive"
      });
    }
  };

  const handleQuickCustomerAdded = async (customerData: any) => {
    try {
      const response = await customersApi.create(customerData);
      if (response.success) {
        const newCustomer = response.data;
        setSelectedCustomer(newCustomer);
        setIsQuickCustomerOpen(false);
        fetchCustomers(); // Refresh customer list
        toast({
          title: "Customer Added",
          description: "New customer has been added successfully.",
        });
      }
    } catch (error) {
      console.error('Failed to add customer:', error);
      toast({
        title: "Error",
        description: "Failed to add customer",
        variant: "destructive"
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pinnedProductsList = products.filter(p => pinnedProducts.includes(p.id));
  const regularProducts = filteredProducts.filter(p => !pinnedProducts.includes(p.id));

  const totals = calculateTotal();

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6 min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading sales...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 space-y-4 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales System (POS)</h1>
            <p className="text-sm text-gray-600">Usman Hardware - Hafizabad</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {cart.length} items in cart
          </Badge>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Today's Orders
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Products Section */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Products
                </CardTitle>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {pinnedProductsList.length} pinned
                </Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200"
                />
              </div>
            </CardHeader>
            <CardContent>
              {/* Pinned Products */}
              {pinnedProductsList.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Pin className="h-4 w-4" />
                    Pinned Products
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {pinnedProductsList.map((product) => (
                      <ProductCard 
                        key={`pinned-${product.id}`}
                        product={product}
                        onAddToCart={addToCart}
                        onTogglePin={togglePin}
                        isPinned={true}
                      />
                    ))}
                  </div>
                  <Separator className="my-4" />
                </div>
              )}

              {/* Regular Products */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {regularProducts.map((product) => (
                  <ProductCard 
                    key={product.id}
                    product={product}
                    onAddToCart={addToCart}
                    onTogglePin={togglePin}
                    isPinned={false}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart and Customer Section */}
        <div className="space-y-4">
          {/* Customer Selection */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Select value={selectedCustomer?.id?.toString() || ""} onValueChange={(value) => {
                  const customer = customers.find(c => c.id.toString() === value);
                  setSelectedCustomer(customer);
                }}>
                  <SelectTrigger className="flex-1 text-xs">
                    <SelectValue placeholder="Search customer by name or phone..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsQuickCustomerOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {!selectedCustomer && (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-600">Cash Sale (Walk-in Customer)</p>
                </div>
              )}
              {selectedCustomer && (
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <p><strong>Name:</strong> {selectedCustomer.name}</p>
                  <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cart */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
                Cart ({cart.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.productName}</p>
                        <p className="text-gray-500">SKU: {item.sku}</p>
                        <p className="text-gray-600">PKR {item.unitPrice} per {item.unit}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateCartQuantity(item.productId, parseFloat(e.target.value) || 0)}
                          className="w-16 h-7 text-center text-xs"
                          min="0"
                          step="0.01"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.productId)}
                          className="h-7 w-7 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <>
                  <Separator className="my-4" />
                  
                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label className="text-xs">Payment Method</Label>
                    <Select value={saleForm.paymentMethod} onValueChange={(value) => setSaleForm({...saleForm, paymentMethod: value})}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Discount */}
                  <div className="space-y-2">
                    <Label className="text-xs">Discount (PKR)</Label>
                    <Input
                      type="number"
                      value={saleForm.discount}
                      onChange={(e) => setSaleForm({...saleForm, discount: parseFloat(e.target.value) || 0})}
                      className="h-8 text-xs"
                    />
                  </div>

                  <Separator className="my-4" />

                  {/* Totals */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span>PKR {totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount:</span>
                      <span>- PKR {totals.discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax (10%):</span>
                      <span>PKR {totals.tax.toFixed(2)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-sm font-bold">
                      <span>Total:</span>
                      <span>PKR {totals.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCreateSale} 
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                    disabled={cart.length === 0}
                  >
                    Complete Sale
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QuickCustomerForm Modal */}
      <QuickCustomerForm 
        open={isQuickCustomerOpen}
        onOpenChange={setIsQuickCustomerOpen}
        onCustomerCreated={handleQuickCustomerAdded}
      />
    </div>
  );
};

// Product Card Component
interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity?: number) => void;
  onTogglePin: (productId: number) => void;
  isPinned: boolean;
}

const ProductCard = ({ product, onAddToCart, onTogglePin, isPinned }: ProductCardProps) => {
  const [showQuantityInput, setShowQuantityInput] = useState(false);
  const [customQuantity, setCustomQuantity] = useState(1);

  const handleQuickAdd = () => {
    onAddToCart(product, 1);
  };

  const handleCustomAdd = () => {
    onAddToCart(product, customQuantity);
    setShowQuantityInput(false);
    setCustomQuantity(1);
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer relative group">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onTogglePin(product.id)}
      >
        {isPinned ? (
          <PinOff className="h-3 w-3 text-gray-600" />
        ) : (
          <Pin className="h-3 w-3 text-gray-600" />
        )}
      </Button>
      
      <CardContent className="p-3">
        <div className="space-y-2">
          <div>
            <h4 className="font-medium text-sm text-gray-900 leading-tight">{product.name}</h4>
            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-blue-600">PKR {product.price}</p>
              <p className="text-xs text-gray-500">{product.stock} {product.unit || 'piece'}</p>
            </div>
          </div>

          {!showQuantityInput ? (
            <div className="flex gap-1">
              <Button 
                size="sm" 
                className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700"
                onClick={handleQuickAdd}
              >
                Add
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="h-7 px-2"
                onClick={() => setShowQuantityInput(true)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-1">
              <Input
                type="number"
                value={customQuantity}
                onChange={(e) => setCustomQuantity(parseFloat(e.target.value) || 0)}
                className="flex-1 h-7 text-xs"
                step="0.01"
                min="0"
                placeholder="Qty"
              />
              <Button 
                size="sm" 
                className="h-7 px-2 bg-green-600 hover:bg-green-700"
                onClick={handleCustomAdd}
              >
                ✓
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="h-7 px-2"
                onClick={() => setShowQuantityInput(false)}
              >
                ✕
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Sales;
