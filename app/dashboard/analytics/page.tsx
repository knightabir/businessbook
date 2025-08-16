"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import { Calendar, TrendingUp, Users, Package, DollarSign, Download } from "lucide-react"

// Mock analytics data
const salesTrendData = [
  { month: "Jul", sales: 85000, purchases: 45000, profit: 40000 },
  { month: "Aug", sales: 92000, purchases: 48000, profit: 44000 },
  { month: "Sep", sales: 78000, purchases: 42000, profit: 36000 },
  { month: "Oct", sales: 105000, purchases: 55000, profit: 50000 },
  { month: "Nov", sales: 118000, purchases: 62000, profit: 56000 },
  { month: "Dec", sales: 125000, purchases: 65000, profit: 60000 },
  { month: "Jan", sales: 135000, purchases: 70000, profit: 65000 },
]

const bestSellingProducts = [
  { name: "Portland Cement", quantity: 450, revenue: 202500, growth: 12.5 },
  { name: "Steel Rods (12mm)", quantity: 280, revenue: 140000, growth: 8.3 },
  { name: "Red Bricks", quantity: 15000, revenue: 120000, growth: -2.1 },
  { name: "River Sand", quantity: 35, revenue: 52500, growth: 15.7 },
  { name: "White Cement", quantity: 85, revenue: 51000, growth: 22.4 },
]

const topCustomers = [
  { name: "Raj Construction", totalBusiness: 125000, transactions: 8, lastOrder: "2024-01-15", status: "Active" },
  { name: "Kumar Builders", totalBusiness: 89000, transactions: 6, lastOrder: "2024-01-14", status: "Active" },
  { name: "Sharma Enterprises", totalBusiness: 156000, transactions: 12, lastOrder: "2024-01-13", status: "Active" },
  { name: "Patel Construction Co.", totalBusiness: 67000, transactions: 4, lastOrder: "2024-01-12", status: "Active" },
  { name: "Singh Builders", totalBusiness: 45000, transactions: 3, lastOrder: "2023-12-28", status: "Inactive" },
]

const agingAnalysis = [
  { range: "0-30 days", customers: 12, amount: 45000, color: "#22c55e" },
  { range: "31-60 days", customers: 8, amount: 28000, color: "#f59e0b" },
  { range: "61-90 days", customers: 5, amount: 18000, color: "#ef4444" },
  { range: "90+ days", customers: 3, amount: 12000, color: "#dc2626" },
]

const monthlyProfitData = [
  { month: "Jul", revenue: 85000, costs: 45000, profit: 40000, margin: 47.1 },
  { month: "Aug", revenue: 92000, costs: 48000, profit: 44000, margin: 47.8 },
  { month: "Sep", revenue: 78000, costs: 42000, profit: 36000, margin: 46.2 },
  { month: "Oct", revenue: 105000, costs: 55000, profit: 50000, margin: 47.6 },
  { month: "Nov", revenue: 118000, costs: 62000, profit: 56000, margin: 47.5 },
  { month: "Dec", revenue: 125000, costs: 65000, profit: 60000, margin: 48.0 },
  { month: "Jan", revenue: 135000, costs: 70000, profit: 65000, margin: 48.1 },
]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("last-6-months")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">Comprehensive business insights and performance analysis</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-7-days">Last 7 Days</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">₹65,000</div>
                <div className="text-sm text-gray-600">Monthly Profit</div>
                <div className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +8.3% from last month
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">48.1%</div>
                <div className="text-sm text-gray-600">Profit Margin</div>
                <div className="text-xs text-blue-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +0.1% from last month
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">28</div>
                <div className="text-sm text-gray-600">Active Customers</div>
                <div className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +3 new this month
                </div>
              </div>
              <Users className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">156</div>
                <div className="text-sm text-gray-600">Products Sold</div>
                <div className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% from last month
                </div>
              </div>
              <Package className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trends">Sales Trends</TabsTrigger>
          <TabsTrigger value="products">Product Analysis</TabsTrigger>
          <TabsTrigger value="customers">Customer Insights</TabsTrigger>
          <TabsTrigger value="aging">Aging Analysis</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales vs Purchases Trend</CardTitle>
                <CardDescription>Monthly comparison of sales and purchase volumes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), ""]} />
                    <Bar dataKey="sales" fill="#3b82f6" name="Sales" />
                    <Bar dataKey="purchases" fill="#ef4444" name="Purchases" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profit Growth</CardTitle>
                <CardDescription>Monthly profit trend over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), "Profit"]} />
                    <Area type="monotone" dataKey="profit" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Best Selling Products</CardTitle>
                <CardDescription>Top performing products by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bestSellingProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-600">{product.quantity} units sold</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(product.revenue)}</div>
                        <div
                          className={`text-sm flex items-center ${product.growth > 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {product.growth > 0 ? "+" : ""}
                          {product.growth}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Category Performance</CardTitle>
                <CardDescription>Revenue distribution by product category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Cement", value: 253500, color: "#3b82f6" },
                        { name: "Steel", value: 140000, color: "#ef4444" },
                        { name: "Bricks", value: 120000, color: "#f59e0b" },
                        { name: "Sand & Aggregates", value: 52500, color: "#22c55e" },
                        { name: "Others", value: 34000, color: "#8b5cf6" },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[
                        { name: "Cement", value: 253500, color: "#3b82f6" },
                        { name: "Steel", value: 140000, color: "#ef4444" },
                        { name: "Bricks", value: 120000, color: "#f59e0b" },
                        { name: "Sand & Aggregates", value: 52500, color: "#22c55e" },
                        { name: "Others", value: 34000, color: "#8b5cf6" },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { name: "Cement", value: 253500, color: "#3b82f6" },
                    { name: "Steel", value: 140000, color: "#ef4444" },
                    { name: "Bricks", value: 120000, color: "#f59e0b" },
                    { name: "Sand & Aggregates", value: 52500, color: "#22c55e" },
                    { name: "Others", value: 34000, color: "#8b5cf6" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                      <span className="truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>Customers ranked by total business value</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total Business</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Last Order</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomers.map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                            {index + 1}
                          </div>
                          <span className="font-medium">{customer.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(customer.totalBusiness)}</TableCell>
                      <TableCell>{customer.transactions}</TableCell>
                      <TableCell>{formatDate(customer.lastOrder)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={customer.status === "Active" ? "secondary" : "outline"}
                          className={customer.status === "Active" ? "bg-green-100 text-green-800" : ""}
                        >
                          {customer.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Accounts Receivable Aging</CardTitle>
                <CardDescription>Outstanding customer dues by age</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={agingAnalysis} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `₹${value / 1000}k`} />
                    <YAxis dataKey="range" type="category" width={80} />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), "Amount"]} />
                    <Bar dataKey="amount" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aging Summary</CardTitle>
                <CardDescription>Detailed breakdown of outstanding amounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agingAnalysis.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                        <div>
                          <div className="font-medium">{item.range}</div>
                          <div className="text-sm text-gray-600">{item.customers} customers</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(item.amount)}</div>
                        <div className="text-sm text-gray-600">
                          {((item.amount / agingAnalysis.reduce((sum, a) => sum + a.amount, 0)) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Outstanding</span>
                    <span className="text-lg font-bold text-red-600">
                      {formatCurrency(agingAnalysis.reduce((sum, item) => sum + item.amount, 0))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profitability" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Profitability</CardTitle>
                <CardDescription>Revenue, costs, and profit margin analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyProfitData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => [`${value}%`, "Profit Margin"]} />
                    <Line type="monotone" dataKey="margin" stroke="#22c55e" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profit Analysis</CardTitle>
                <CardDescription>Monthly profit breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyProfitData.slice(-3).map((month, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{month.month} 2024</span>
                        <Badge className="bg-green-100 text-green-800">{month.margin.toFixed(1)}% margin</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Revenue</div>
                          <div className="font-medium text-green-600">{formatCurrency(month.revenue)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Costs</div>
                          <div className="font-medium text-red-600">{formatCurrency(month.costs)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Profit</div>
                          <div className="font-medium text-blue-600">{formatCurrency(month.profit)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
