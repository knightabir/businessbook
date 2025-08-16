"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  MapPin,
  DollarSign,
} from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  // For delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);

  // Fetch all customers from the backend
  const getAllCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/customer`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch customers");
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllCustomers();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm);

    const matchesFilter =
      filterType === "all" ||
      (filterType === "with-dues" && customer.currentDue > 0) ||
      (filterType === "with-advance" && customer.advancePayment > 0) ||
      (filterType === "no-dues" && customer.currentDue === 0);

    return matchesSearch && matchesFilter;
  });

  // Add customer via API
  const handleAddCustomer = async () => {
    if (newCustomer.name && newCustomer.phone) {
      try {
        const response = await fetch("/api/customer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newCustomer),
        });
        if (!response.ok) throw new Error("Failed to add customer");
        const data = await response.json();
        setCustomers((prev) => [...prev, data]);
        setNewCustomer({ name: "", phone: "", address: "" });
        setIsAddModalOpen(false);
      } catch (error) {
        console.error(error);
      } finally {
        getAllCustomers();
      }
    }
  };

  // Prepare to edit customer
  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setNewCustomer({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
    });
  };

  // Update customer via API
  const handleUpdateCustomer = async () => {
    if (editingCustomer && newCustomer.name && newCustomer.phone) {
      try {
        const response = await fetch(`/api/customer?id=${editingCustomer.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newCustomer),
        });
        if (!response.ok) throw new Error("Failed to update customer");
        const updated = await response.json();
        setCustomers((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
        setEditingCustomer(null);
        setNewCustomer({ name: "", phone: "", address: "" });
      } catch (error) {
        console.error(error);
      } finally {
        getAllCustomers();
      }
    }
  };

  // Delete customer via API
  const handleDeleteCustomer = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customer/${customerId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete customer");
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    } catch (error) {
      console.error(error);
    } finally {
      getAllCustomers();
    }
  };

  // Calculate summary values safely
  const totalSales = customers.reduce((sum, c) => sum + (c.totalSales || 0), 0);
  const totalOutstanding = customers.reduce(
    (sum, c) => sum + (c.currentDue || 0),
    0
  );
  const totalAdvances = customers.reduce(
    (sum, c) => sum + (c.advancePayment || 0),
    0
  );

  // Handler for delete button click
  const handleDeleteButtonClick = (customer: any) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  // Handler for confirming delete
  const handleConfirmDelete = async () => {
    if (customerToDelete) {
      await handleDeleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  // Handler for canceling delete
  const handleCancelDelete = () => {
    setCustomerToDelete(null);
    setDeleteDialogOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">
            Manage your customer relationships and transactions
          </p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Enter customer details to add them to your system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                  placeholder="Enter customer name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, phone: e.target.value })
                  }
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={newCustomer.address}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, address: e.target.value })
                  }
                  placeholder="Enter customer address"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddCustomer}>Add Customer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search customers by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            <SelectItem value="with-dues">With Outstanding Dues</SelectItem>
            <SelectItem value="with-advance">With Advance Payments</SelectItem>
            <SelectItem value="no-dues">No Outstanding Dues</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{customers.length}</div>
            <div className="text-sm text-gray-600">Total Customers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalSales)}
            </div>
            <div className="text-sm text-gray-600">Total Business</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalOutstanding)}
            </div>
            <div className="text-sm text-gray-600">Total Outstanding</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalAdvances)}
            </div>
            <div className="text-sm text-gray-600">Total Advances</div>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              Loading customers...
            </CardContent>
          </Card>
        ) : (
          filteredCustomers.map((customer) => (
            <Card
              key={customer.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold">{customer.name}</h3>
                      {customer.currentDue > 0 && (
                        <Badge variant="destructive">
                          Due: {formatCurrency(customer.currentDue)}
                        </Badge>
                      )}
                      {customer.advancePayment > 0 && (
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800"
                        >
                          Advance: {formatCurrency(customer.advancePayment)}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        {customer.phone}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {customer.address}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Total Business: {formatCurrency(customer.totalSales)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/customers/${customer.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </Button>

                    <Dialog
                      open={editingCustomer?.id === customer.id}
                      onOpenChange={(open) => {
                        if (!open) {
                          setEditingCustomer(null);
                          setNewCustomer({ name: "", phone: "", address: "" });
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Customer</DialogTitle>
                          <DialogDescription>
                            Update customer information
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">Customer Name *</Label>
                            <Input
                              id="edit-name"
                              value={newCustomer.name}
                              onChange={(e) =>
                                setNewCustomer({
                                  ...newCustomer,
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-phone">Phone Number *</Label>
                            <Input
                              id="edit-phone"
                              value={newCustomer.phone}
                              onChange={(e) =>
                                setNewCustomer({
                                  ...newCustomer,
                                  phone: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-address">Address</Label>
                            <Textarea
                              id="edit-address"
                              value={newCustomer.address}
                              onChange={(e) =>
                                setNewCustomer({
                                  ...newCustomer,
                                  address: e.target.value,
                                })
                              }
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setEditingCustomer(null)}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateCustomer}>
                              Update Customer
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation Dialog Trigger */}
                    <Dialog open={deleteDialogOpen && customerToDelete?.id === customer.id} onOpenChange={(open) => {
                      if (!open) {
                        setDeleteDialogOpen(false);
                        setCustomerToDelete(null);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteButtonClick(customer)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Are you sure you want to delete this customer?
                          </DialogTitle>
                          <DialogDescription>
                            {customerToDelete
                              ? `Are you sure you want to delete "${customerToDelete.name}"? This action cannot be undone.`
                              : ""}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end space-x-2 mt-4">
                          <Button variant="outline" onClick={handleCancelDelete}>
                            No
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                          >
                            Yes, Delete
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {!loading && filteredCustomers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-500">
              {searchTerm || filterType !== "all"
                ? "No customers found matching your criteria"
                : "No customers added yet"}
            </div>
            {!searchTerm && filterType === "all" && (
              <Button className="mt-4" onClick={() => setIsAddModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Customer
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
