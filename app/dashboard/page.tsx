"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  Truck,
  DollarSign,
  AlertCircle,
  Calendar,
} from "lucide-react";

// Remove static duesData, will fetch from API for pie chart
// const duesData = [
//   { name: "Customer Dues", value: 25000, color: "#ef4444" },
//   { name: "Supplier Dues", value: 18000, color: "#f97316" },
//   { name: "Available Cash", value: 82000, color: "#22c55e" },
// ];

const SALES_PERIOD_TO_FILTER: Record<string, string> = {
  "7-days": "last-7-days",
  month: "last-month",
  year: "last-year",
};

export default function DashboardPage() {
  const [timeFilter, setTimeFilter] = useState("last-week");
  const [salesPeriod, setSalesPeriod] = useState("7-days");
  const [salesData, setSalesData] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);

  // Pie chart dues data state
  const [duesData, setDuesData] = useState<any[]>([]);
  const [duesLoading, setDuesLoading] = useState(false);
  const [duesError, setDuesError] = useState<string | null>(null);

  // KPI state
  const [KPIs, setKPIs] = useState<null | {
    totalSales: number;
    totalCustomers: number;
    totalSuppliers: number;
    customerDues: number;
    supplierDues: number;
    salesGrowth: number;
    customerGrowth: number;
  }>(null);
  const [KPIError, setKPIError] = useState<string | null>(null);
  const [KPILoading, setKPILoading] = useState(false);

  // Outstanding data state for Money Flow Cards
  const [outstandingData, setOutstandingData] = useState<{
    customer: {
      overdue: number;
      dueThisWeek: number;
      dueNextWeek: number;
    };
    supplier: {
      overdue: number;
      dueThisWeek: number;
      dueNextWeek: number;
    };
  } | null>(null);
  const [outstandingLoading, setOutstandingLoading] = useState(false);
  const [outstandingError, setOutstandingError] = useState<string | null>(null);

  // Fetch sales data from API based on salesPeriod
  async function getSalesData(period: string) {
    setSalesLoading(true);
    setSalesError(null);
    try {
      const filter = SALES_PERIOD_TO_FILTER[period] || "last-7-days";
      const response = await fetch(
        `/api/dashboard/sales?filter=${encodeURIComponent(filter)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sales data");
      }
      const data = await response.json();
      // Defensive: ensure data is an array
      if (!Array.isArray(data)) {
        throw new Error("Sales data is not an array");
      }
      setSalesData(data);
    } catch (error: any) {
      setSalesError(error?.message || "Unknown error");
      setSalesData([]);
      console.error("Error fetching sales data:", error);
    } finally {
      setSalesLoading(false);
    }
  }

  // Fetch KPI data from API
  async function getKPIsData() {
    setKPILoading(true);
    setKPIError(null);
    try {
      // You can use timeFilter or salesPeriod as filter, here using timeFilter
      const response = await fetch(
        `/api/dashboard/kpi?filter=${encodeURIComponent(timeFilter)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch KPI data");
      }
      const data = await response.json();
      setKPIs(data);
    } catch (error: any) {
      setKPIError(error?.message || "Unknown error");
      setKPIs(null);
      console.error("Error fetching KPI data:", error);
    } finally {
      setKPILoading(false);
    }
  }

  // Fetch dues data for pie chart (filtered by timeFilter)
  async function getDuesData() {
    setDuesLoading(true);
    setDuesError(null);
    try {
      const response = await fetch(
        `/api/dashboard/dues?filter=${encodeURIComponent(timeFilter)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch dues data");
      }
      const data = await response.json();
      // Defensive: ensure data is an array
      if (!Array.isArray(data)) {
        throw new Error("Dues data is not an array");
      }
      // The API should return array of { name, value, color }
      setDuesData(data);
    } catch (error: any) {
      setDuesError(error?.message || "Unknown error");
      setDuesData([]);
      console.error("Error fetching dues data:", error);
    } finally {
      setDuesLoading(false);
    }
  }

  // Fetch outstanding data for Money Flow Cards
  async function getOutstandingData() {
    setOutstandingLoading(true);
    setOutstandingError(null);
    try {
      const response = await fetch("/api/dashboard/outstanding");
      if (!response.ok) {
        throw new Error("Failed to fetch outstanding data");
      }
      const data = await response.json();
      // Defensive: ensure data has expected structure
      if (
        !data ||
        typeof data !== "object" ||
        !data.customer ||
        !data.supplier
      ) {
        throw new Error("Outstanding data is not in expected format");
      }
      setOutstandingData(data);
    } catch (error: any) {
      setOutstandingError(error?.message || "Unknown error");
      setOutstandingData(null);
      console.error("Error fetching outstanding data:", error);
    } finally {
      setOutstandingLoading(false);
    }
  }

  // Fetch sales data on mount and when salesPeriod changes
  useEffect(() => {
    getSalesData(salesPeriod);
  }, [salesPeriod]);

  // Fetch KPI data on mount and when timeFilter changes
  useEffect(() => {
    getKPIsData();
  }, [timeFilter]);

  // Fetch dues data for pie chart on mount and when timeFilter changes
  useEffect(() => {
    getDuesData();
  }, [timeFilter]);

  // Fetch outstanding data on mount
  useEffect(() => {
    getOutstandingData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">
              Welcome back! Here's your business overview
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="last-week">Last Week</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                <SelectItem value="last-year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">Export Report</Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {KPILoading ? (
                  <span>Loading...</span>
                ) : KPIError ? (
                  <span className="text-red-500">--</span>
                ) : KPIs ? (
                  formatCurrency(KPIs.totalSales)
                ) : (
                  "--"
                )}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />+
                {KPIs ? KPIs.salesGrowth : "--"}% from last period
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {KPILoading ? (
                  <span>Loading...</span>
                ) : KPIError ? (
                  <span className="text-red-500">--</span>
                ) : KPIs ? (
                  KPIs.totalCustomers
                ) : (
                  "--"
                )}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />+
                {KPIs ? KPIs.customerGrowth : "--"}% from last period
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Suppliers
              </CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {KPILoading ? (
                  <span>Loading...</span>
                ) : KPIError ? (
                  <span className="text-red-500">--</span>
                ) : KPIs ? (
                  KPIs.totalSuppliers
                ) : (
                  "--"
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Active partnerships
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Net Cash Flow
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {KPILoading ? (
                  <span>Loading...</span>
                ) : KPIError ? (
                  <span className="text-red-500">--</span>
                ) : KPIs ? (
                  formatCurrency(KPIs.customerDues - KPIs.supplierDues)
                ) : (
                  "--"
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Customer dues - Supplier dues
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Money Flow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Money Coming In</CardTitle>
              <CardDescription>
                Outstanding payments from customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {KPILoading ? (
                  <span>Loading...</span>
                ) : KPIError ? (
                  <span className="text-red-500">--</span>
                ) : KPIs ? (
                  formatCurrency(KPIs.customerDues)
                ) : (
                  "--"
                )}
              </div>
              <div className="mt-2 space-y-2">
                {outstandingLoading ? (
                  <div className="text-gray-500 text-sm">Loading...</div>
                ) : outstandingError ? (
                  <div className="text-red-500 text-sm">{outstandingError}</div>
                ) : outstandingData ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Overdue (30+ days)</span>
                      <span className="text-red-600">
                        {formatCurrency(outstandingData.customer.overdue)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Due this week</span>
                      <span className="text-orange-600">
                        {formatCurrency(outstandingData.customer.dueThisWeek)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Due next week</span>
                      <span className="text-blue-600">
                        {formatCurrency(outstandingData.customer.dueNextWeek)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400 text-sm">
                    No outstanding data available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Money Going Out</CardTitle>
              <CardDescription>
                Outstanding payments to suppliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {KPILoading ? (
                  <span>Loading...</span>
                ) : KPIError ? (
                  <span className="text-red-500">--</span>
                ) : KPIs ? (
                  formatCurrency(KPIs.supplierDues)
                ) : (
                  "--"
                )}
              </div>
              <div className="mt-2 space-y-2">
                {outstandingLoading ? (
                  <div className="text-gray-500 text-sm">Loading...</div>
                ) : outstandingError ? (
                  <div className="text-red-500 text-sm">{outstandingError}</div>
                ) : outstandingData ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Overdue (30+ days)</span>
                      <span className="text-red-600">
                        {formatCurrency(outstandingData.supplier.overdue)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Due this week</span>
                      <span className="text-orange-600">
                        {formatCurrency(outstandingData.supplier.dueThisWeek)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Due next week</span>
                      <span className="text-blue-600">
                        {formatCurrency(outstandingData.supplier.dueNextWeek)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400 text-sm">
                    No outstanding data available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sales Trend</CardTitle>
                  <CardDescription>Daily sales performance</CardDescription>
                </div>
                <Select
                  value={salesPeriod}
                  onValueChange={(val) => setSalesPeriod(val)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7-days">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <div className="flex items-center justify-center h-72 text-gray-500">
                  Loading sales data...
                </div>
              ) : salesError ? (
                <div className="flex items-center justify-center h-72 text-red-500">
                  {salesError}
                </div>
              ) : salesData && salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(value as number),
                        "Sales",
                      ]}
                    />
                    <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-72 text-gray-400">
                  No sales data available.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Breakdown</CardTitle>
              <CardDescription>
                Distribution of money in your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              {duesLoading ? (
                <div className="flex items-center justify-center h-72 text-gray-500">
                  Loading cash flow data...
                </div>
              ) : duesError ? (
                <div className="flex items-center justify-center h-72 text-red-500">
                  {duesError}
                </div>
              ) : duesData && duesData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={duesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {duesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {duesData.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium">
                          {formatCurrency(item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-72 text-gray-400">
                  No cash flow data available.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to manage your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col bg-transparent"
              >
                <Users className="h-6 w-6 mb-2" />
                Add Customer
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col bg-transparent"
              >
                <Truck className="h-6 w-6 mb-2" />
                Add Supplier
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col bg-transparent"
              >
                <DollarSign className="h-6 w-6 mb-2" />
                Record Sale
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col bg-transparent"
              >
                <AlertCircle className="h-6 w-6 mb-2" />
                Record Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
