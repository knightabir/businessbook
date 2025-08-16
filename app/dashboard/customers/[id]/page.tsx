"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  DollarSign,
  Calendar,
  Package,
  Receipt,
  ArrowLeftCircle,
  ArrowRightCircle,
} from "lucide-react";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  // State for customer, transactions, products, and loading/error
  const [customer, setCustomer] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState("");

  // For product row navigation in dialog (arrow left/right)
  const [activeProductIndex, setActiveProductIndex] = useState(0);

  // For custom product entry
  const [customProductInputs, setCustomProductInputs] = useState<{
    [key: number]: { name: string; unit: string };
  }>({});

  // New sale state
  const [newSale, setNewSale] = useState({
    products: [{ productId: "", quantity: 1, price: 0, isCustom: false }],
    paidAmount: 0,
  });

  // Fetch all data on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadError(false);

    Promise.all([
      getCustomerById(),
      getCustomerTransactions(),
      getAllProducts(),
    ])
      .then(([customerData, transactionData, productData]) => {
        if (!isMounted) return;
        let fallback = false;
        if (
          !customerData ||
          !Array.isArray(transactionData) ||
          !Array.isArray(productData)
        ) {
          fallback = true;
        }
        if (fallback) {
          setCustomer(null);
          setTransactions([]);
          setProducts([]);
        } else {
          setCustomer({
            ...customerData,
            transactions: transactionData,
            totalSales: transactionData.reduce(
              (sum: number, t: any) => sum + (t.totalAmount || 0),
              0
            ),
            currentDue: transactionData.reduce(
              (sum: number, t: any) => sum + (t.dueAmount || 0),
              0
            ),
            advancePayment: customerData.advancePayment || 0,
          });
          setTransactions(transactionData);
          setProducts(productData);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setCustomer(null);
        setTransactions([]);
        setProducts([]);
        setIsLoading(false);
        setLoadError(true);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  // Fetch customer details from API
  const getCustomerById = async () => {
    try {
      const response = await fetch(`/api/customer?id=${customerId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to get customer details");
      const data = await response.json();
      return data[0];
    } catch (error) {
      return null;
    }
  };

  // Fetch transactions for customer from API
  const getCustomerTransactions = async () => {
    try {
      const response = await fetch(`/api/sale?customerId=${customerId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch customer sales");
      const data = await response.json();
      return Array.isArray(data.sales) ? data.sales : [];
    } catch (error) {
      return [];
    }
  };

  // Fetch all products from API
  const getAllProducts = async () => {
    try {
      const response = await fetch(`/api/product`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch the products");
      const data = await response.json();
      return Array.isArray(data.products) ? data.products : [];
    } catch (error) {
      return [];
    }
  };

  // Add a product row to the new sale
  const addProductToSale = () => {
    setNewSale((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { productId: "", quantity: 1, price: 0, isCustom: false },
      ],
    }));
    setActiveProductIndex(newSale.products.length);
  };

  // Update a product in the new sale
  const updateSaleProduct = (index: number, field: string, value: any) => {
    setNewSale((prev) => {
      const updatedProducts = prev.products.map((product, i) => {
        if (i === index) {
          if (field === "productId") {
            // If value is "__custom__", mark as custom
            if (value === "__custom__") {
              return {
                ...product,
                productId: "",
                isCustom: true,
                price: 0,
                quantity: 1,
              };
            }
            // Not custom, find product in list
            const selectedProduct = products.find(
              (p) => p._id === value || p.id === value
            );
            return {
              ...product,
              productId: value,
              isCustom: false,
              price: selectedProduct?.price || 0,
              quantity: product.quantity || 1,
            };
          }
          return { ...product, [field]: value };
        }
        return product;
      });
      return { ...prev, products: updatedProducts };
    });
  };

  // Update custom product name/unit
  const updateCustomProductInput = (
    index: number,
    field: "name" | "unit",
    value: string
  ) => {
    setCustomProductInputs((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value,
      },
    }));
  };

  // Calculate total for new sale
  const calculateSaleTotal = () => {
    return newSale.products.reduce((total, product, idx) => {
      return (
        total + (Number(product.quantity) || 0) * (Number(product.price) || 0)
      );
    }, 0);
  };

  // Add a new sale (POST to API, update state)
  const handleAddSale = async () => {
    const saleTotal = calculateSaleTotal();
    const saleProducts = newSale.products.map((p, idx) => {
      if (p.isCustom) {
        const custom = customProductInputs[idx] || {};
        return {
          name: custom.name || "Custom Product",
          unit: custom.unit || "",
          quantity: p.quantity,
          price: p.price,
          total: p.quantity * p.price,
        };
      } else {
        const product = products.find(
          (mp) => mp._id === p.productId || mp.id === p.productId
        );
        return {
          name: product?.name || "",
          unit: product?.unit || "",
          quantity: p.quantity,
          price: p.price,
          total: p.quantity * p.price,
        };
      }
    });
    const newTransaction = {
      id: `t${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      products: saleProducts,
      totalAmount: saleTotal,
      paidAmount: newSale.paidAmount,
      dueAmount: saleTotal - newSale.paidAmount,
      status: newSale.paidAmount >= saleTotal ? "paid" : "partial",
    };

    try {
      await fetch("/api/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          ...newTransaction,
        }),
      });
    } catch (e) {
      // ignore, fallback to local
    }

    setTransactions((prev) => [newTransaction, ...prev]);
    setCustomer((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        transactions: [newTransaction, ...(prev.transactions || [])],
        totalSales: (prev.totalSales || 0) + saleTotal,
        currentDue: (prev.currentDue || 0) + (saleTotal - newSale.paidAmount),
      };
    });

    setNewSale({
      products: [{ productId: "", quantity: 1, price: 0, isCustom: false }],
      paidAmount: 0,
    });
    setCustomProductInputs({});
    setActiveProductIndex(0);
    setIsAddSaleOpen(false);
  };

  // Add a payment to a transaction (PATCH to API, update state)
  const handleAddPayment = async () => {
    const amount = Number.parseFloat(paymentAmount);
    if (amount > 0 && selectedTransaction) {
      let updatedTransactions: any[] = [];
      let updatedTransaction: any = null;
      updatedTransactions = transactions.map((t) => {
        // Accept both .id and ._id for matching
        if (t.id === selectedTransaction || t._id === selectedTransaction) {
          const newPaidAmount = (t.paidAmount || 0) + amount;
          const newDueAmount = (t.totalAmount || 0) - newPaidAmount;
          updatedTransaction = {
            ...t,
            paidAmount: newPaidAmount,
            dueAmount: newDueAmount,
            status: newDueAmount <= 0 ? "paid" : "partial",
          };
          return updatedTransaction;
        }
        return t;
      });

      // Find the full transaction object to send all required fields
      const transactionToUpdate =
        transactions.find(
          (t) => t.id === selectedTransaction || t._id === selectedTransaction
        ) || updatedTransaction;

      // Compose the updated products array (if present)
      const productsToSend =
        transactionToUpdate && Array.isArray(transactionToUpdate.products)
          ? transactionToUpdate.products.map((p: any) => ({
              // Only send allowed fields
              name: p.name,
              price: p.price,
              quantity: p.quantity,
              unit: p.unit,
              total: p.total,
            }))
          : undefined;

      // Compose the full update data
      const updateData: any = {
        paidAmount: updatedTransaction?.paidAmount,
        dueAmount: updatedTransaction?.dueAmount,
        status: updatedTransaction?.status,
      };
      // Only send products/totalAmount if present in the transaction
      if (productsToSend) updateData.products = productsToSend;
      if (transactionToUpdate && transactionToUpdate.totalAmount !== undefined)
        updateData.totalAmount = transactionToUpdate.totalAmount;

      try {
        await fetch(`/api/sale?id=${selectedTransaction}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        // Optionally, you can log for debugging
        // console.log(updateData);
      } catch (e) {
        // ignore, fallback to local
      }

      setTransactions(updatedTransactions);
      setCustomer((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          transactions: updatedTransactions,
          currentDue: (prev.currentDue || 0) - amount,
        };
      });

      setPaymentAmount("");
      setSelectedTransaction("");
      setIsAddPaymentOpen(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Loading and error states
  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="text-lg">Loading customer details...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <div className="text-center">{customerId}</div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Customer Not Found
          </h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {customer.name}
            </h1>
            <p className="text-gray-600">
              Customer Details & Transaction History
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog
            open={isAddSaleOpen}
            onOpenChange={(open) => {
              setIsAddSaleOpen(open);
              if (open) setActiveProductIndex(0);
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="min-w-4xl max-w-3xl w-full p-0 max-h-[90vh] flex flex-col">
              <DialogHeader className="px-6 pt-6 flex-shrink-0">
                <DialogTitle>Add New Sale</DialogTitle>
                <DialogDescription>
                  Record a new sale transaction for {customer.name}
                </DialogDescription>
              </DialogHeader>

              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
                <div className="space-y-6">
                  <div>
                    <Label className="mb-2 block text-base font-medium">
                      Products
                    </Label>
                    {/* Products container with fixed max height and scroll */}
                    <div className="flex flex-col gap-4 pr-2 max-h-[400px] overflow-y-auto">
                      {newSale.products.map((product, index) => (
                        <div
                          key={index}
                          className={`relative rounded-lg border p-3 bg-gray-50 transition-shadow flex-shrink-0 ${
                            activeProductIndex === index
                              ? "ring-2 ring-blue-400 shadow"
                              : ""
                          }`}
                          style={{ minWidth: 350 }}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-gray-700">
                                Product {index + 1}
                              </span>
                              {newSale.products.length > 1 && (
                                <span className="text-xs text-gray-400">
                                  ({index + 1} of {newSale.products.length})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="p-1"
                                disabled={index === 0}
                                onClick={() => setActiveProductIndex(index - 1)}
                                tabIndex={-1}
                              >
                                <ArrowLeftCircle
                                  className={`w-5 h-5 ${
                                    index === 0
                                      ? "text-gray-300"
                                      : "text-blue-500"
                                  }`}
                                />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="p-1"
                                disabled={index === newSale.products.length - 1}
                                onClick={() => setActiveProductIndex(index + 1)}
                                tabIndex={-1}
                              >
                                <ArrowRightCircle
                                  className={`w-5 h-5 ${
                                    index === newSale.products.length - 1
                                      ? "text-gray-300"
                                      : "text-blue-500"
                                  }`}
                                />
                              </Button>
                              {newSale.products.length > 1 && (
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="p-1 ml-2"
                                  title="Remove Product"
                                  onClick={() => {
                                    setNewSale((prev) => ({
                                      ...prev,
                                      products: prev.products.filter(
                                        (_, i) => i !== index
                                      ),
                                    }));
                                    setCustomProductInputs((prev) => {
                                      const newInputs = { ...prev };
                                      delete newInputs[index];
                                      return newInputs;
                                    });
                                    setActiveProductIndex((prevActive) =>
                                      prevActive > index
                                        ? prevActive - 1
                                        : prevActive >=
                                          newSale.products.length - 1
                                        ? Math.max(0, prevActive - 1)
                                        : prevActive
                                    );
                                  }}
                                >
                                  <span className="sr-only">Remove</span>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-5 h-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {/* First line: Product select or custom entry */}
                            <div>
                              <Label className="mb-1 block text-sm font-medium">
                                Select Product
                              </Label>
                              {!product.isCustom ? (
                                <Select
                                  value={product.productId}
                                  onValueChange={(value) =>
                                    updateSaleProduct(index, "productId", value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select product" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {products.map((p) => (
                                      <SelectItem
                                        key={p._id || p.id}
                                        value={p._id || p.id}
                                      >
                                        {p.name} - ₹{p.price}/{p.unit}
                                      </SelectItem>
                                    ))}
                                    <SelectItem value="__custom__">
                                      + Add Custom Product
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  <Input
                                    type="text"
                                    placeholder="Product Name"
                                    value={
                                      customProductInputs[index]?.name || ""
                                    }
                                    onChange={(e) =>
                                      updateCustomProductInput(
                                        index,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                    className="mb-2"
                                  />
                                  <Input
                                    type="text"
                                    placeholder="Unit (e.g. kg, piece)"
                                    value={
                                      customProductInputs[index]?.unit || ""
                                    }
                                    onChange={(e) =>
                                      updateCustomProductInput(
                                        index,
                                        "unit",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                              )}
                            </div>
                            {/* Second line: Quantity and Price side by side */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="mb-1 block text-sm font-medium">
                                  Quantity
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="Qty"
                                  min={1}
                                  value={product.quantity}
                                  onChange={(e) =>
                                    updateSaleProduct(
                                      index,
                                      "quantity",
                                      Number.parseInt(e.target.value) || 1
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <Label className="mb-1 block text-sm font-medium">
                                  Amount (per unit)
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="Price"
                                  min={0}
                                  value={product.price}
                                  onChange={(e) =>
                                    updateSaleProduct(
                                      index,
                                      "price",
                                      Number.parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end mt-2">
                            <span className="text-sm font-medium text-gray-700">
                              Total: ₹
                              {(Number(product.quantity) || 0) *
                                (Number(product.price) || 0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={addProductToSale}
                    >
                      Add Product
                    </Button>
                  </div>

                  <div className="border-t pt-4 mt-2 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                      <span className="font-medium">Total Amount:</span>
                      <span className="text-lg font-bold">
                        {formatCurrency(calculateSaleTotal())}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paidAmount">Amount Paid</Label>
                      <Input
                        id="paidAmount"
                        type="number"
                        value={newSale.paidAmount}
                        onChange={(e) =>
                          setNewSale({
                            ...newSale,
                            paidAmount: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="Enter amount paid"
                      />
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      Due Amount:{" "}
                      {formatCurrency(
                        calculateSaleTotal() - newSale.paidAmount
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed footer with buttons */}
              <div className="flex-shrink-0 px-6 pb-6 border-t pt-4">
                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddSaleOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddSale}>Add Sale</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <DollarSign className="w-4 h-4 mr-2" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
                <DialogDescription>
                  Record a payment from {customer.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="transaction">Select Transaction</Label>
                  <Select
                    value={selectedTransaction}
                    onValueChange={setSelectedTransaction}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transaction" />
                    </SelectTrigger>
                    <SelectContent>
                      {(customer.transactions || [])
                        .filter((t: any) => t.dueAmount > 0)
                        .map((transaction: any) => (
                          <SelectItem
                            key={transaction._id}
                            value={transaction._id}
                          >
                            {formatDate(transaction.createdAt)} - Due:{" "}
                            {formatCurrency(transaction.dueAmount)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentAmount">Payment Amount</Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter payment amount"
                  />
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddPaymentOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddPayment}>Record Payment</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Customer Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(customer.totalSales)}
            </div>
            <div className="text-sm text-gray-600">Total Business</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(customer.currentDue)}
            </div>
            <div className="text-sm text-gray-600">Current Due</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(customer.advancePayment)}
            </div>
            <div className="text-sm text-gray-600">Advance Payment</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {(customer.transactions || []).length}
            </div>
            <div className="text-sm text-gray-600">Total Transactions</div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Details */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Phone</Label>
              <p className="text-sm">{customer.phone}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">
                Address
              </Label>
              <p className="text-sm">{customer.address}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            All sales transactions with {customer.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(customer.transactions || []).length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {(customer.transactions || []).map((transaction: any) => (
                <AccordionItem key={transaction._id} value={transaction._id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full mr-0 sm:mr-4 gap-2">
                      <div className="flex items-center space-x-4">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(transaction.createdAt)}</span>
                        <Badge
                          variant={
                            transaction.status === "paid"
                              ? "secondary"
                              : "destructive"
                          }
                          className={
                            transaction.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {transaction.status === "paid" ? "Paid" : "Partial"}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(transaction.totalAmount)}
                        </div>
                        {transaction.dueAmount > 0 && (
                          <div className="text-sm text-red-600">
                            Due: {formatCurrency(transaction.dueAmount)}
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <Label className="font-medium">Total Amount</Label>
                          <p>{formatCurrency(transaction.totalAmount)}</p>
                        </div>
                        <div>
                          <Label className="font-medium">Paid Amount</Label>
                          <p className="text-green-600">
                            {formatCurrency(transaction.paidAmount)}
                          </p>
                        </div>
                        <div>
                          <Label className="font-medium">Due Amount</Label>
                          <p className="text-red-600">
                            {formatCurrency(transaction.dueAmount)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label className="font-medium mb-2 block">
                          Products
                        </Label>
                        <div className="space-y-2">
                          {(transaction.products || []).map(
                            (product: any, index: number) => (
                              <div
                                key={index}
                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 bg-gray-50 rounded"
                              >
                                <div className="flex items-center space-x-2">
                                  <Package className="w-4 h-4" />
                                  <span>{product.name}</span>
                                  {product.unit && (
                                    <span className="text-xs text-gray-400 ml-2">
                                      ({product.unit})
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 mt-1 sm:mt-0">
                                  {product.quantity} ×{" "}
                                  {formatCurrency(product.price)} ={" "}
                                  {formatCurrency(product.total)}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No transactions recorded yet</p>
              <Button className="mt-4" onClick={() => setIsAddSaleOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Sale
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
