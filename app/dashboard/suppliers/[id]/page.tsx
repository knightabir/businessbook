"use client";

import { useState, useEffect, useCallback } from "react";
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
  Truck,
} from "lucide-react";

// API helpers
async function fetchSupplierTransactions(id: string) {
  const res = await fetch(`/api/buying?supplierId=${id}`);
  if (!res.ok) throw new Error("Failed to fetch supplier transactions");
  return res.json();
}

async function addPurchaseToSupplier(supplierId: string, purchase: any) {
  const res = await fetch(`/api/buying`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ supplierId, ...purchase }),
  });
  if (!res.ok) throw new Error("Failed to add purchase");
  return res.json();
}

// New: Update transaction (PUT) for payment
async function updateSupplierTransaction(transactionId: string, updatedTransaction: any) {
  const res = await fetch(`/api/buying?id=${transactionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedTransaction),
  });
  if (!res.ok) throw new Error("Failed to update transaction");
  return res.json();
}

async function getSupplierById(supplierId: string) {
  const res = await fetch(`/api/supplier?id=${supplierId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error("Failed to get supplier");
  return res.json();
}

async function getAllProducts() {
  try {
    const res = await fetch(`/api/product`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) throw new Error("Failed to fetch the products");
    const response: any = await res.json();
    if (!response || !Array.isArray(response.products)) {
      throw new Error("Invalid products response");
    }
    return response.products;
  } catch (err) {
    throw err;
  }
}

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params.id as string;

  const [supplier, setSupplier] = useState<any>(null);
  const [supplierDetails, setSupplierDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState("");

  // For custom product modal
  const [showCustomProductModal, setShowCustomProductModal] = useState<null | number>(null);
  const [customProductName, setCustomProductName] = useState("");
  const [customProductPrice, setCustomProductPrice] = useState("");
  const [customProductUnit, setCustomProductUnit] = useState("");
  const [customProductError, setCustomProductError] = useState<string | null>(null);

  // For add purchase error
  const [addPurchaseError, setAddPurchaseError] = useState<string | null>(null);

  const [newPurchase, setNewPurchase] = useState({
    products: [{ productId: "", quantity: 1, price: 0, custom: false, customName: "", customUnit: "" }],
    paidAmount: 0,
  });

  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Transactions state (array of all transactions)
  const [transactions, setTransactions] = useState<any[]>([]);

  // Fetch supplier details and transactions from API
  const fetchSupplierData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [details, transactionsData] = await Promise.all([
        getSupplierById(supplierId),
        fetchSupplierTransactions(supplierId),
      ]);
      setSupplierDetails(details);
      setSupplier(details); // KPAs are in supplierDetails
      // The API returns an array of transactions, not an object with .transactions
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      setLoading(false);
    } catch (err) {
      setError("Supplier Not Found");
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    fetchSupplierData();
  }, [fetchSupplierData]);

  // Fetch products from database
  useEffect(() => {
    setProductsLoading(true);
    setProductsError(null);
    getAllProducts()
      .then((data) => {
        setProducts(data);
        setProductsLoading(false);
      })
      .catch((err) => {
        setProductsError(
          err instanceof Error
            ? err.message
            : "Failed to fetch products from database"
        );
        setProductsLoading(false);
      });
  }, []);

  // Reset errors when dialog opens
  useEffect(() => {
    if (isAddPurchaseOpen) {
      setAddPurchaseError(null);
    }
  }, [isAddPurchaseOpen]);

  if (loading || productsLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  if (
    error ||
    !supplierDetails ||
    productsError ||
    !Array.isArray(products)
  ) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || productsError || "Supplier or Products Not Found"}
          </h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const addProductToPurchase = () => {
    setNewPurchase((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { productId: "", quantity: 1, price: 0, custom: false, customName: "", customUnit: "" },
      ],
    }));
  };

  // Update product in purchase, handle custom product
  const updatePurchaseProduct = (index: number, field: string, value: any) => {
    setNewPurchase((prev) => {
      const updatedProducts = prev.products.map((product, i) => {
        if (i === index) {
          if (field === "productId") {
            if (value === "__custom__") {
              setShowCustomProductModal(index);
              return { ...product, productId: value, custom: true, customName: "", price: 0, customUnit: "" };
            } else {
              const selectedProduct = products.find((p) => (p._id || p.id) === value);
              return {
                ...product,
                productId: value,
                custom: false,
                customName: "",
                customUnit: "",
                price: selectedProduct?.price || 0,
              };
            }
          }
          if (field === "quantity") {
            return { ...product, quantity: value };
          }
          if (field === "price") {
            return { ...product, price: value };
          }
          if (field === "customName") {
            return { ...product, customName: value };
          }
          if (field === "customUnit") {
            return { ...product, customUnit: value };
          }
        }
        return product;
      });
      return { ...prev, products: updatedProducts };
    });
  };

  const calculatePurchaseTotal = () => {
    return newPurchase.products.reduce((total, product) => {
      return total + (Number(product.quantity) || 0) * (Number(product.price) || 0);
    }, 0);
  };

  // Validate all product details before saving
  const validatePurchaseProducts = () => {
    if (!Array.isArray(newPurchase.products) || newPurchase.products.length === 0) {
      return "Please add at least one product.";
    }
    for (let i = 0; i < newPurchase.products.length; i++) {
      const p = newPurchase.products[i];
      if (p.custom) {
        if (!p.customName || p.customName.trim() === "") {
          return `Custom product name is required for product ${i + 1}.`;
        }
        if (!p.price || isNaN(Number(p.price)) || Number(p.price) <= 0) {
          return `Custom product price is required and must be greater than 0 for product ${i + 1}.`;
        }
        if (!p.quantity || isNaN(Number(p.quantity)) || Number(p.quantity) <= 0) {
          return `Custom product quantity is required and must be greater than 0 for product ${i + 1}.`;
        }
      } else {
        if (!p.productId || p.productId === "") {
          return `Please select a product for product ${i + 1}.`;
        }
        if (!p.price || isNaN(Number(p.price)) || Number(p.price) <= 0) {
          return `Product price is required and must be greater than 0 for product ${i + 1}.`;
        }
        if (!p.quantity || isNaN(Number(p.quantity)) || Number(p.quantity) <= 0) {
          return `Product quantity is required and must be greater than 0 for product ${i + 1}.`;
        }
      }
    }
    return null;
  };

  // Add purchase via API and refresh data
  const handleAddPurchase = async () => {
    setAddPurchaseError(null);
    const validationError = validatePurchaseProducts();
    if (validationError) {
      setAddPurchaseError(validationError);
      return;
    }
    const purchaseTotal = calculatePurchaseTotal();
    const newTransaction = {
      date: new Date().toISOString().split("T")[0],
      products: newPurchase.products.map((p) => {
        if (p.custom) {
          return {
            name: p.customName,
            quantity: Number(p.quantity),
            price: Number(p.price),
            total: Number(p.quantity) * Number(p.price),
            unit: p.customUnit || "",
            custom: true,
          };
        } else {
          const product = products.find((mp) => (mp._id || mp.id) === p.productId);
          return {
            name: product?.name || "",
            quantity: Number(p.quantity),
            price: Number(p.price),
            total: Number(p.quantity) * Number(p.price),
            unit: product?.unit || "",
            custom: false,
          };
        }
      }),
      totalAmount: purchaseTotal,
      paidAmount: Number(newPurchase.paidAmount),
      dueAmount: purchaseTotal - Number(newPurchase.paidAmount),
      status: Number(newPurchase.paidAmount) >= purchaseTotal ? "paid" : "partial",
    };

    try {
      await addPurchaseToSupplier(supplierId, newTransaction);
      setNewPurchase({
        products: [{ productId: "", quantity: 1, price: 0, custom: false, customName: "", customUnit: "" }],
        paidAmount: 0,
      });
      setIsAddPurchaseOpen(false);
      // Refresh supplier details and transactions
      await fetchSupplierData();
    } catch (err) {
      setAddPurchaseError(err instanceof Error ? err.message : "Failed to add purchase");
    }
  };

  // Add payment via API and refresh data (PUT, send full transaction object)
  const handleAddPayment = async () => {
    const amount = Number.parseFloat(paymentAmount);
    if (!selectedTransaction) {
      alert("Please select a purchase to make payment.");
      return;
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      alert("Please enter a valid payment amount greater than 0.");
      return;
    }

    // Find the transaction object
    const transaction = transactions.find((t: any) => t._id === selectedTransaction);
    if (!transaction) {
      alert("Selected transaction not found.");
      return;
    }

    // Calculate new paidAmount and dueAmount
    const newPaidAmount = Number(transaction.paidAmount || 0) + amount;
    const totalAmount = Number(transaction.totalAmount || 0);
    const newDueAmount = Math.max(totalAmount - newPaidAmount, 0);
    const newStatus =
      newPaidAmount >= totalAmount
        ? "paid"
        : newPaidAmount > 0
        ? "partial"
        : "due";

    // Prepare updated transaction object (send all fields)
    const updatedTransaction = {
      ...transaction,
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount,
      status: newStatus,
    };

    try {
      await updateSupplierTransaction(selectedTransaction, updatedTransaction);
      setPaymentAmount("");
      setSelectedTransaction("");
      setIsAddPaymentOpen(false);
      // Refresh supplier details and transactions
      await fetchSupplierData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add payment");
    }
  };

  // Defensive: use transactions state (array of all transactions)
  // KPAs: calculate from transactions
  const totalPurchases = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const currentDue = transactions.reduce((sum, t) => sum + (t.dueAmount || 0), 0);
  const advancePayment = transactions.reduce((sum, t) => sum + ((t.paidAmount || 0) - (t.totalAmount || 0) > 0 ? (t.paidAmount - t.totalAmount) : 0), 0);

  // Handle custom product modal save
  const handleCustomProductSave = () => {
    setCustomProductError(null);
    if (!customProductName.trim()) {
      setCustomProductError("Product name is required.");
      return;
    }
    if (!customProductPrice || isNaN(Number(customProductPrice)) || Number(customProductPrice) <= 0) {
      setCustomProductError("Product price must be greater than 0.");
      return;
    }
    if (showCustomProductModal === null) return;
    setNewPurchase((prev) => {
      const updatedProducts = prev.products.map((product, i) => {
        if (i === showCustomProductModal) {
          return {
            ...product,
            custom: true,
            customName: customProductName,
            price: Number(customProductPrice),
            customUnit: customProductUnit,
            productId: "__custom__",
          };
        }
        return product;
      });
      return { ...prev, products: updatedProducts };
    });
    setShowCustomProductModal(null);
    setCustomProductName("");
    setCustomProductPrice("");
    setCustomProductUnit("");
    setCustomProductError(null);
  };

  // Handle custom product modal cancel
  const handleCustomProductCancel = () => {
    if (showCustomProductModal !== null) {
      setNewPurchase((prev) => ({
        ...prev,
        products: prev.products.filter((_, i) => i !== showCustomProductModal),
      }));
    }
    setShowCustomProductModal(null);
    setCustomProductName("");
    setCustomProductPrice("");
    setCustomProductUnit("");
    setCustomProductError(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center">
            <Truck className="w-6 h-6 mr-3 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {supplierDetails.name}
              </h1>
              <p className="text-gray-600">
                Supplier Details & Purchase History
              </p>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isAddPurchaseOpen} onOpenChange={setIsAddPurchaseOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Purchase
              </Button>
            </DialogTrigger>
            <DialogContent className="min-w-3xl max-w-4xl p-0 max-h-[90vh] flex flex-col">
              <DialogHeader className="px-6 pt-6 flex-shrink-0">
                <DialogTitle>Add New Purchase</DialogTitle>
                <DialogDescription>
                  Record a new purchase from {supplierDetails.name}
                </DialogDescription>
              </DialogHeader>
              
              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
                <div className="space-y-6">
                  <div>
                    <Label className="mb-2 block text-base font-medium">
                      Products
                    </Label>
                    {/* Error message for add purchase */}
                    {addPurchaseError && (
                      <div className="mb-2 text-red-600 text-sm font-medium">
                        {addPurchaseError}
                      </div>
                    )}
                    {/* Products container with fixed max height and scroll */}
                    <div className="flex flex-col gap-4 pr-2 max-h-[400px] overflow-y-auto">
                      {newPurchase.products.map((product, index) => (
                        <div key={index} className="flex-shrink-0 rounded-lg border p-3 bg-gray-50">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-gray-700">
                                Product {index + 1}
                              </span>
                              {newPurchase.products.length > 1 && (
                                <span className="text-xs text-gray-400">
                                  ({index + 1} of {newPurchase.products.length})
                                </span>
                              )}
                            </div>
                            {newPurchase.products.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="p-1"
                                title="Remove Product"
                                onClick={() => {
                                  setNewPurchase((prev) => ({
                                    ...prev,
                                    products: prev.products.filter(
                                      (_, i) => i !== index
                                    ),
                                  }));
                                }}
                              >
                                <span className="sr-only">Remove</span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-4 h-4"
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
                          <div className="flex flex-col gap-3">
                            {/* First line: Product select */}
                            <div>
                              <Label className="mb-1 block text-sm font-medium">
                                Select Product
                              </Label>
                              <Select
                                value={product.productId}
                                onValueChange={(value) =>
                                  updatePurchaseProduct(index, "productId", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.length > 0 ? (
                                    <>
                                      {products.map((p) => (
                                        <SelectItem key={p._id || p.id} value={p._id || p.id}>
                                          {p.name} - ₹{p.price}
                                          {p.unit ? `/${p.unit}` : ""}
                                        </SelectItem>
                                      ))}
                                      <SelectItem value="__custom__" className="text-blue-600">
                                        + Add Custom Product
                                      </SelectItem>
                                    </>
                                  ) : (
                                    <>
                                      <div className="px-4 py-2 text-gray-500 text-sm">
                                        No products found
                                      </div>
                                      <SelectItem value="__custom__" className="text-blue-600">
                                        + Add Custom Product
                                      </SelectItem>
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            {/* If custom product, show name/unit fields */}
                            {product.custom && (
                              <div className="grid grid-cols-1 gap-3">
                                <div>
                                  <Label className="mb-1 block text-sm font-medium">
                                    Custom Product Name
                                  </Label>
                                  <Input
                                    type="text"
                                    placeholder="Enter product name"
                                    value={product.customName}
                                    onChange={(e) =>
                                      updatePurchaseProduct(index, "customName", e.target.value)
                                    }
                                  />
                                </div>
                                <div>
                                  <Label className="mb-1 block text-sm font-medium">
                                    Unit (optional)
                                  </Label>
                                  <Input
                                    type="text"
                                    placeholder="e.g. kg, pcs"
                                    value={product.customUnit}
                                    onChange={(e) =>
                                      updatePurchaseProduct(index, "customUnit", e.target.value)
                                    }
                                  />
                                </div>
                              </div>
                            )}
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
                                    updatePurchaseProduct(
                                      index,
                                      "quantity",
                                      Number.parseInt(e.target.value) || 1
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <Label className="mb-1 block text-sm font-medium">
                                  Price (per unit)
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="Price"
                                  min={0}
                                  value={product.price}
                                  onChange={(e) =>
                                    updatePurchaseProduct(
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
                              Total: ₹{(Number(product.quantity) || 0) * (Number(product.price) || 0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={addProductToPurchase}
                    >
                      Add Product
                    </Button>
                  </div>

                  <div className="border-t pt-4 mt-2 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                      <span className="font-medium">Total Amount:</span>
                      <span className="text-lg font-bold">
                        {formatCurrency(calculatePurchaseTotal())}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paidAmount">Amount Paid</Label>
                      <Input
                        id="paidAmount"
                        type="number"
                        value={newPurchase.paidAmount}
                        onChange={(e) =>
                          setNewPurchase({
                            ...newPurchase,
                            paidAmount: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="Enter amount paid"
                      />
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      Due Amount:{" "}
                      {formatCurrency(
                        calculatePurchaseTotal() - Number(newPurchase.paidAmount)
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Product Modal */}
              {showCustomProductModal !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                    <h2 className="text-lg font-bold mb-2">Add Custom Product</h2>
                    {customProductError && (
                      <div className="mb-2 text-red-600 text-sm font-medium">
                        {customProductError}
                      </div>
                    )}
                    <div className="mb-3">
                      <Label>Product Name</Label>
                      <Input
                        value={customProductName}
                        onChange={(e) => setCustomProductName(e.target.value)}
                        placeholder="Enter product name"
                        autoFocus
                      />
                    </div>
                    <div className="mb-3">
                      <Label>Unit (optional)</Label>
                      <Input
                        value={customProductUnit}
                        onChange={(e) => setCustomProductUnit(e.target.value)}
                        placeholder="e.g. kg, pcs"
                      />
                    </div>
                    <div className="mb-3">
                      <Label>Price (per unit)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={customProductPrice}
                        onChange={(e) => setCustomProductPrice(e.target.value)}
                        placeholder="Enter price"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={handleCustomProductCancel}>
                        Cancel
                      </Button>
                      <Button onClick={handleCustomProductSave}>Save</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Fixed footer with buttons */}
              <div className="flex-shrink-0 px-6 pb-6 border-t pt-4">
                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddPurchaseOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddPurchase}>Add Purchase</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <DollarSign className="w-4 h-4 mr-2" />
                Make Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Make Payment</DialogTitle>
                <DialogDescription>
                  Record a payment to {supplierDetails.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="transaction">Select Purchase</Label>
                  <Select
                    value={selectedTransaction}
                    onValueChange={setSelectedTransaction}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select purchase" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(transactions) &&
                      transactions.length > 0 ? (
                        transactions
                          .filter((t: any) => t.dueAmount > 0)
                          .map((transaction: any) => (
                            <SelectItem
                              key={transaction._id}
                              value={transaction._id}
                            >
                              {formatDate(transaction.createdAt)} - Due:{" "}
                              {formatCurrency(transaction.dueAmount)}
                            </SelectItem>
                          ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500 text-sm">
                          No purchases with due amount
                        </div>
                      )}
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
                  <Button onClick={handleAddPayment}>Make Payment</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Supplier Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalPurchases)}
            </div>
            <div className="text-sm text-gray-600">Total Purchases</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(currentDue)}
            </div>
            <div className="text-sm text-gray-600">Amount Owed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(advancePayment)}
            </div>
            <div className="text-sm text-gray-600">Advance Paid</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {Array.isArray(transactions) ? transactions.length : 0}
            </div>
            <div className="text-sm text-gray-600">Total Purchases</div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Details */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Phone</Label>
              <p className="text-sm">{supplierDetails.phone}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">
                Address
              </Label>
              <p className="text-sm">{supplierDetails.address}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase History */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>
            All purchase transactions with {supplierDetails.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Array.isArray(transactions) && transactions.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {transactions.map((transaction: any) => (
                <AccordionItem key={transaction._id} value={transaction._id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full mr-4">
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
                          Products Received
                        </Label>
                        <div className="space-y-2">
                          {transaction.products &&
                            Array.isArray(transaction.products) &&
                            transaction.products.map(
                              (product: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                >
                                  <div className="flex items-center space-x-2">
                                    <Package className="w-4 h-4" />
                                    <span>{product.name}</span>
                                    {product.custom && (
                                      <span className="ml-2 text-xs text-blue-600">(Custom)</span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {product.quantity} ×{" "}
                                    {formatCurrency(product.price)} ={" "}
                                    {formatCurrency(product.total)}
                                    {product.unit ? ` (${product.unit})` : ""}
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
              <p>No purchases recorded yet</p>
              <Button
                className="mt-4"
                onClick={() => setIsAddPurchaseOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Purchase
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
