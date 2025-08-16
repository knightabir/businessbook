"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Filter, Eye, Edit, Trash2, Phone, MapPin, DollarSign, Truck } from "lucide-react"

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<any>(null)
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    phone: "",
    address: "",
  })

  // For delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<any>(null)

  // Fetch suppliers from API
  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/supplier")
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data)
      } else {
        setSuppliers([])
      }
    } catch (error) {
      setSuppliers([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) || supplier.phone.includes(searchTerm)

    const matchesFilter =
      filterType === "all" ||
      (filterType === "with-dues" && supplier.currentDue > 0) ||
      (filterType === "with-advance" && supplier.advancePayment > 0) ||
      (filterType === "no-dues" && supplier.currentDue === 0)

    return matchesSearch && matchesFilter
  })

  const handleAddSupplier = async () => {
    if (newSupplier.name && newSupplier.phone) {
      const supplier = {
        ...newSupplier,
        totalPurchases: 0,
        currentDue: 0,
        advancePayment: 0,
        lastTransaction: new Date().toISOString().split("T")[0],
      }
      try {
        const response = await fetch("/api/supplier", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(supplier),
        })
        if (response.ok) {
          await fetchSuppliers()
          setNewSupplier({ name: "", phone: "", address: "" })
          setIsAddModalOpen(false)
        } else {
          console.error("Failed to add supplier")
        }
      } catch (error) {
        console.error("Error:", error)
      }
    }
  }

  const handleEditSupplier = (supplier: any) => {
    setEditingSupplier(supplier)
    setNewSupplier({
      name: supplier.name,
      phone: supplier.phone,
      address: supplier.address,
    })
  }

  const handleUpdateSupplier = async () => {
    if (editingSupplier && newSupplier.name && newSupplier.phone) {
      try {
        const response = await fetch(`/api/supplier?id=${editingSupplier._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...editingSupplier,
            ...newSupplier,
          }),
        })
        if (response.ok) {
          await fetchSuppliers()
          setEditingSupplier(null)
          setNewSupplier({ name: "", phone: "", address: "" })
        } else {
          console.error("Failed to update supplier")
        }
      } catch (error) {
        console.error("Error:", error)
      }
    }
  }

  // Modified: handleDeleteSupplier now only deletes, confirmation handled elsewhere
  const handleDeleteSupplier = async (supplierId: string) => {
    try {
      const response = await fetch(`/api/supplier?id=${supplierId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        await fetchSuppliers()
      } else {
        console.error("Failed to delete supplier")
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  // Handler for delete button click: open dialog and set supplier to delete
  const handleDeleteButtonClick = (supplier: any) => {
    setSupplierToDelete(supplier)
    setDeleteDialogOpen(true)
  }

  // Handler for confirming delete
  const handleConfirmDelete = async () => {
    if (supplierToDelete) {
      await handleDeleteSupplier(supplierToDelete._id)
      setSupplierToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  // Handler for canceling delete
  const handleCancelDelete = () => {
    setSupplierToDelete(null)
    setDeleteDialogOpen(false)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600">Manage your supplier relationships and purchases</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>Enter supplier details to add them to your system</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Supplier Name *</Label>
                <Input
                  id="name"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  placeholder="Enter supplier name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  placeholder="Enter supplier address"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSupplier}>Add Supplier</Button>
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
            placeholder="Search suppliers by name or phone..."
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
            <SelectItem value="all">All Suppliers</SelectItem>
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
            <div className="text-2xl font-bold">{suppliers.length}</div>
            <div className="text-sm text-gray-600">Total Suppliers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(suppliers.reduce((sum, s) => sum + (s.totalPurchases || 0), 0))}
            </div>
            <div className="text-sm text-gray-600">Total Purchases</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(suppliers.reduce((sum, s) => sum + (s.currentDue || 0), 0))}
            </div>
            <div className="text-sm text-gray-600">Amount Owed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(suppliers.reduce((sum, s) => sum + (s.advancePayment || 0), 0))}
            </div>
            <div className="text-sm text-gray-600">Advances Paid</div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier List */}
      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">Loading suppliers...</CardContent>
          </Card>
        ) : (
          filteredSuppliers.map((supplier) => (
            <Card key={supplier._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center">
                        <Truck className="w-5 h-5 mr-2 text-blue-600" />
                        <h3 className="text-lg font-semibold">{supplier.name}</h3>
                      </div>
                      {supplier.currentDue > 0 && (
                        <Badge variant="destructive">Owe: {formatCurrency(supplier.currentDue)}</Badge>
                      )}
                      {supplier.advancePayment > 0 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Advance: {formatCurrency(supplier.advancePayment)}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        {supplier.phone}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {supplier.address}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Total Purchases: {formatCurrency(supplier.totalPurchases || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/suppliers/${supplier._id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </Button>

                    <Dialog open={editingSupplier?.id === supplier.id} onOpenChange={(open) => {
                      if (!open) {
                        setEditingSupplier(null)
                        setNewSupplier({ name: "", phone: "", address: "" })
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleEditSupplier(supplier)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Supplier</DialogTitle>
                          <DialogDescription>Update supplier information</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">Supplier Name *</Label>
                            <Input
                              id="edit-name"
                              value={newSupplier.name}
                              onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-phone">Phone Number *</Label>
                            <Input
                              id="edit-phone"
                              value={newSupplier.phone}
                              onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-address">Address</Label>
                            <Textarea
                              id="edit-address"
                              value={newSupplier.address}
                              onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => {
                              setEditingSupplier(null)
                              setNewSupplier({ name: "", phone: "", address: "" })
                            }}>
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateSupplier}>Update Supplier</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Delete Button with confirmation dialog */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteButtonClick(supplier)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setSupplierToDelete(null)
          setDeleteDialogOpen(false)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription>
              {supplierToDelete ? (
                <>
                  Are you sure you want to delete supplier <span className="font-semibold">{supplierToDelete.name}</span>?
                  <br />
                  This action cannot be undone.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={handleCancelDelete}>
              No
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Yes, Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {!loading && filteredSuppliers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-500">
              {searchTerm || filterType !== "all"
                ? "No suppliers found matching your criteria"
                : "No suppliers added yet"}
            </div>
            {!searchTerm && filterType === "all" && (
              <Button className="mt-4" onClick={() => setIsAddModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Supplier
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
