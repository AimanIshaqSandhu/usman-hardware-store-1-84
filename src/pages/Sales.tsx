import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Search, Plus, Edit, Trash2, Eye, DollarSign, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { salesApi, customersApi, productsApi } from "@/services/api";

const Sales = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });

  useEffect(() => {
    fetchSales();
    fetchCustomers();
    fetchProducts();
  }, [searchTerm, statusFilter]);

  const fetchSales = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 20
      };
      
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await salesApi.getAll(params);
      
      if (response.success) {
        setSales(response.data.sales || []);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      toast({
        title: "Error",
        description: "Failed to load sales",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customersApi.getAll({ limit: 100 });
      if (response.success) {
        setCustomers(response.data.customers || []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsApi.getAll({ limit: 100 });
      if (response.success) {
        setProducts(response.data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleAddSale = async (formData: any) => {
    try {
      const response = await salesApi.create(formData);
      if (response.success) {
        setIsNewSaleOpen(false);
        fetchSales();
        toast({
          title: "Sale Added",
          description: "New sale has been added successfully.",
        });
      }
    } catch (error) {
      console.error('Failed to add sale:', error);
      toast({
        title: "Error",
        description: "Failed to add sale",
        variant: "destructive"
      });
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const response = await salesApi.updateStatus(id, { status });
      if (response.success) {
        fetchSales();
        toast({
          title: "Status Updated",
          description: "Sale status has been updated successfully.",
        });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const calculateTotal = (sale: any) => {
    return sale.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  };

  const openViewDialog = (sale: any) => {
    setSelectedSale(sale);
    setIsViewDialogOpen(true);
  };

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
    <div className="flex-1 p-6 space-y-6 min-h-screen bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sales Management</h1>
            <p className="text-muted-foreground">Manage your sales and orders</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isNewSaleOpen} onOpenChange={setIsNewSaleOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Sale
              </Button>
            </DialogTrigger>
            <NewSaleDialog 
              onSubmit={handleAddSale} 
              onClose={() => setIsNewSaleOpen(false)} 
              customers={customers} 
              products={products}
            />
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold text-blue-600">{pagination.totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">PKR {
                  sales.reduce((sum: number, sale: any) => sum + calculateTotal(sale), 0).toLocaleString()
                }</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                <p className="text-2xl font-bold text-orange-600">PKR {
                  (sales.length > 0 ? sales.reduce((sum: number, sale: any) => sum + calculateTotal(sale), 0) / sales.length : 0).toLocaleString()
                }</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search sales by order ID or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Sales Orders</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          {sales.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No sales orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{sale.orderId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{sale.customerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{sale.date}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-600">PKR {calculateTotal(sale).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="secondary">{sale.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openViewDialog(sale)}>
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Select value={sale.status} onValueChange={(value) => handleUpdateStatus(sale.id, value)} disabled={sale.status === 'refunded' || sale.status === 'cancelled'}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Sale Dialog */}
      {selectedSale && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <SaleViewDialog 
            sale={selectedSale} 
            onClose={() => {
              setIsViewDialogOpen(false);
              setSelectedSale(null);
            }}
          />
        </Dialog>
      )}
    </div>
  );
};

// New Sale Dialog Component
const NewSaleDialog = ({ 
  onSubmit, 
  onClose, 
  customers, 
  products 
}: { 
  onSubmit: (data: any) => void; 
  onClose: () => void; 
  customers: any[]; 
  products: any[];
}) => {
  const [formData, setFormData] = useState({
    customerId: "",
    items: [{ productId: "", quantity: 1, price: 0 }],
    date: new Date().toISOString().slice(0, 10),
    status: "pending"
  });

  useEffect(() => {
    // Initialize prices when products are loaded
    if (products.length > 0) {
      setFormData(prevFormData => ({
        ...prevFormData,
        items: prevFormData.items.map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            ...item,
            price: product?.price || 0
          };
        })
      }));
    }
  }, [products]);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: "", quantity: 1, price: 0 }]
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      newItems[index] = {
        ...newItems[index],
        productId: value,
        price: product?.price || 0
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }

    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const customer = customers.find(c => c.id === formData.customerId);
    const submitData = {
      ...formData,
      customerName: customer?.name || "Unknown Customer",
      items: formData.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          ...item,
          productName: product?.name || "Unknown Product",
          price: parseFloat(item.price),
          quantity: parseInt(item.quantity)
        };
      })
    };
    onSubmit(submitData);
  };

  return (
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <DialogTitle>Add New Sale</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="customerId">Customer</Label>
          <Select value={formData.customerId} onValueChange={(value) => setFormData({...formData, customerId: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Items</Label>
          {formData.items.map((item, index) => (
            <div key={index} className="flex gap-4 items-center">
              <div className="flex-1">
                <Label htmlFor={`productId-${index}`}>Product</Label>
                <Select 
                  value={item.productId} 
                  onValueChange={(value) => handleItemChange(index, "productId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                <Input
                  id={`quantity-${index}`}
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                  min="1"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor={`price-${index}`}>Price</Label>
                <Input
                  id={`price-${index}`}
                  type="number"
                  value={item.price}
                  onChange={(e) => handleItemChange(index, "price", e.target.value)}
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => handleRemoveItem(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={handleAddItem}>
            Add Item
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Add Sale</Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </DialogContent>
  );
};

// Sale View Dialog Component
const SaleViewDialog = ({ 
  sale, 
  onClose 
}: { 
  sale: any; 
  onClose: () => void;
}) => {
  const calculateTotal = (sale: any) => {
    return sale.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Sale Details - {sale.orderId}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Customer</p>
          <p className="text-foreground">{sale.customerName}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Date</p>
          <p className="text-foreground">{sale.date}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Status</p>
          <Badge variant="secondary">{sale.status}</Badge>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Items</p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sale.items.map((item) => (
                  <tr key={item.productId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{item.productName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{item.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">PKR {item.price.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-green-600">PKR {(item.price * item.quantity).toLocaleString()}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Total</p>
          <p className="text-2xl font-bold text-green-600">PKR {calculateTotal(sale).toLocaleString()}</p>
        </div>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </DialogContent>
  );
};

export default Sales;
