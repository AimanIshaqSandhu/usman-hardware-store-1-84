import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  ShoppingCart,
  AlertTriangle,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { dashboardApi } from "@/services/api";

// Define the types for the dashboard data
interface DashboardStats {
  totalRevenue: number;
  newOrders: number;
  averageOrderValue: number;
  customerSatisfaction: number;
}

interface EnhancedDashboardData {
  financial: {
    todayRevenue: number;
    yesterdayRevenue: number;
    monthRevenue: number;
    lastMonthRevenue: number;
    monthExpenses: number;
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
    revenueGrowth: number;
    monthlyGrowth: number;
  };
  sales: {
    todaySales: number;
    weekSales: number;
    avgOrderValue: number;
    pendingOrdersValue: number;
    paymentMethods: Array<{
      method: string;
      count: number;
      amount: number;
    }>;
    highValueSales: Array<{
      orderNumber: string;
      amount: number;
      customer: string;
      date: string;
    }>;
  };
  inventory: {
    totalInventoryValue: number;
    retailInventoryValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    overstockItems: number;
    fastMovingProducts: Array<{
      name: string;
      sold: number;
      remaining: number;
    }>;
    deadStockValue: number;
    inventoryTurnover: number;
  };
  customers: {
    totalCustomers: number;
    newCustomersThisMonth: number;
    avgCustomerValue: number;
    topCustomers: Array<{
      name: string;
      totalPurchases: number;
      balance: number;
    }>;
    customerTypes: Array<{
      type: string;
      count: number;
    }>;
    totalReceivables: number;
  };
  performance: {
    weeklyTrend: Array<{
      week: string;
      revenue: number;
      orders: number;
    }>;
    dailyAvgRevenue: number;
    dailyAvgOrders: number;
    categoryPerformance: Array<{
      category: string;
      revenue: number;
      unitsSold: number;
    }>;
  };
  cashFlow: {
    monthlyInflows: number;
    monthlyOutflows: number;
    netCashFlow: number;
    recentPayments: Array<{
      customer: string;
      amount: number;
      date: string;
    }>;
  };
  alerts: Array<{
    type: string;
    title: string;
    message: string;
    action: string;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  const { toast } = useToast();
  const [data, setData] = useState<EnhancedDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardApi.getEnhancedStats();
      
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
    }).format(amount);
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6 min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 p-6 space-y-6 min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">No data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 min-h-screen bg-background">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your inventory management system</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      PKR {data.financial?.todayRevenue?.toLocaleString() || '0'}
                    </p>
                    <div className="flex items-center gap-1 text-xs">
                      {(data.financial?.revenueGrowth || 0) >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className={`${(data.financial?.revenueGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(data.financial?.revenueGrowth || 0)}%
                      </span>
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                    <p className="text-2xl font-bold text-blue-600">{data.sales?.todaySales || 0}</p>
                    <p className="text-xs text-muted-foreground">Today</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Inventory Value</p>
                    <p className="text-2xl font-bold text-purple-600">
                      PKR {data.inventory?.totalInventoryValue?.toLocaleString() || '0'}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Stock</p>
                  </div>
                  <Package className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Low Stock Items</p>
                    <p className="text-2xl font-bold text-orange-600">{data.inventory?.lowStockItems || 0}</p>
                    <p className="text-xs text-muted-foreground">Need Attention</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.performance?.weeklyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-green-600">
                    PKR {data.financial?.monthRevenue?.toLocaleString() || '0'}
                  </p>
                  <Badge variant={data.financial?.monthlyGrowth >= 0 ? "default" : "destructive"}>
                    {data.financial?.monthlyGrowth >= 0 ? '+' : ''}{data.financial?.monthlyGrowth || 0}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Net Profit</p>
                  <p className="text-3xl font-bold text-blue-600">
                    PKR {data.financial?.netProfit?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Margin: {data.financial?.profitMargin?.toFixed(1) || '0'}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Cash Flow</p>
                  <p className="text-3xl font-bold text-purple-600">
                    PKR {data.cashFlow?.netCashFlow?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-muted-foreground">This Month</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.sales?.paymentMethods || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                        label={({ method, percentage }) => `${method}: ${percentage}%`}
                      >
                        {(data.sales?.paymentMethods || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>High Value Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(data.sales?.highValueSales || []).map((sale, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{sale.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">{sale.customer}</p>
                        <p className="text-xs text-muted-foreground">{sale.date}</p>
                      </div>
                      <p className="font-bold text-green-600">
                        PKR {sale.amount.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Fast Moving Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(data.inventory?.fastMovingProducts || []).map((product, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">Sold: {product.sold}</p>
                      </div>
                      <Badge variant="outline">
                        {product.remaining} left
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Value:</span>
                    <span className="font-bold">PKR {data.inventory?.totalInventoryValue?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Retail Value:</span>
                    <span className="font-bold">PKR {data.inventory?.retailInventoryValue?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Turnover Rate:</span>
                    <span className="font-bold">{data.inventory?.inventoryTurnover?.toFixed(2) || '0'}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">Dead Stock Value:</span>
                    <span className="font-bold text-red-600">PKR {data.inventory?.deadStockValue?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                  <p className="text-3xl font-bold text-blue-600">{data.customers?.totalCustomers || 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">New This Month</p>
                  <p className="text-3xl font-bold text-green-600">{data.customers?.newCustomersThisMonth || 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Avg Customer Value</p>
                  <p className="text-3xl font-bold text-purple-600">
                    PKR {data.customers?.avgCustomerValue?.toLocaleString() || '0'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(data.customers?.topCustomers || []).map((customer, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Total Purchases: PKR {customer.totalPurchases.toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={customer.balance > 0 ? "destructive" : "default"}>
                      Balance: PKR {customer.balance.toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
