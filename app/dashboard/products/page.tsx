"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Filter, Edit, Trash2, Package, AlertTriangle, TrendingUp } from "lucide-react"

const categories = ["All", "Cement", "Steel", "Bricks", "Sand & Aggregates", "Paint", "Hardware"]

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: 0,
    unit: "",
    stockQuantity: 0,
    minStockLevel: 0,
    description: "",
  })

  // For delete confirmation modal
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Currency formatter
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Fetch products from API
  const getProducts = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (selectedCategory && selectedCategory !== "All") params.append("category", selectedCategory)
      const url = `/api/product${params.toString() ? `?${params.toString()}` : ""}`
      const response = await fetch(url)
      const data = await response.json()
      setProducts(data.products)
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  // Fetch on mount and when filters/search change
  useEffect(() => {
    getProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory])

  // Add product via API
  const handleAddProduct = async () => {
    if (newProduct.name && newProduct.category && newProduct.price > 0) {
      const product = {
        ...newProduct,
        lastUpdated: new Date().toISOString().split("T")[0],
      }
      try {
        const response = await fetch("/api/product", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(product),
        })
        if (response.ok) {
          await getProducts()
          setNewProduct({
            name: "",
            category: "",
            price: 0,
            unit: "",
            stockQuantity: 0,
            minStockLevel: 0,
            description: "",
          })
          setIsAddModalOpen(false)
        } else {
          console.error("Failed to add product")
        }
      } catch (error) {
        console.error("Error:", error)
      }
    }
  }

  // Edit product: open modal and set form state
  const handleEditProduct = (product: any) => {
    setEditingProduct(product)
    setNewProduct({
      name: product.name,
      category: product.category,
      price: product.price,
      unit: product.unit,
      stockQuantity: product.stockQuantity,
      minStockLevel: product.minStockLevel,
      description: product.description,
    })
  }

  // Update product via API
  const handleUpdateProduct = async () => {
    if (editingProduct && newProduct.name && newProduct.category && newProduct.price > 0) {
      try {
        const response = await fetch(`/api/product?id=${editingProduct._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...newProduct,
            lastUpdated: new Date().toISOString().split("T")[0],
          }),
        })
        if (response.ok) {
          await getProducts()
          setEditingProduct(null) // Close the edit modal after update
          setNewProduct({
            name: "",
            category: "",
            price: 0,
            unit: "",
            stockQuantity: 0,
            minStockLevel: 0,
            description: "",
          })
        } else {
          console.error("Failed to update product")
        }
      } catch (error) {
        console.error("Error updating product:", error)
      }
    }
  }

  // Delete product via API
  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/product?id=${productId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        await getProducts()
      } else {
        console.error("Failed to delete product")
      }
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  // Stock status
  const getStockStatus = (product: any) => {
    if (product.stockQuantity <= 0) return { status: "out", color: "bg-red-100 text-red-800" }
    if (product.stockQuantity <= product.minStockLevel) return { status: "low", color: "bg-orange-100 text-orange-800" }
    return { status: "good", color: "bg-green-100 text-green-800" }
  }

  // Derived values
  const lowStockProducts = products.filter((p) => p.stockQuantity <= p.minStockLevel)
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stockQuantity, 0)

  // Filtered products for table display
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !searchTerm ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Inventory</h1>
          <p className="text-gray-600">Manage your product catalog and stock levels</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>Enter product details to add to your inventory</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Enter product name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((c) => c !== "All")
                        .map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Select
                    value={newProduct.unit}
                    onValueChange={(value) => setNewProduct({ ...newProduct, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pieces">Pieces</SelectItem>
                      <SelectItem value="bags">Bags</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                      <SelectItem value="liters">Liters</SelectItem>
                      <SelectItem value="sqft">Square Feet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number.parseFloat(e.target.value) || 0 })}
                    placeholder="Enter price"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Stock Quantity</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    value={newProduct.stockQuantity}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, stockQuantity: Number.parseInt(e.target.value) || 0 })
                    }
                    placeholder="Enter stock"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStockLevel">Minimum Stock Level</Label>
                <Input
                  id="minStockLevel"
                  type="number"
                  value={newProduct.minStockLevel}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, minStockLevel: Number.parseInt(e.target.value) || 0 })
                  }
                  placeholder="Enter minimum stock level"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={2}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddProduct}>Add Product</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{products.length}</div>
                <div className="text-sm text-gray-600">Total Products</div>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalValue)}</div>
                <div className="text-sm text-gray-600">Total Inventory Value</div>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{lowStockProducts.length}</div>
                <div className="text-sm text-gray-600">Low Stock Items</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{categories.length - 1}</div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
              <Filter className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Low Stock Alert
            </CardTitle>
            <CardDescription className="text-orange-700">
              The following products are running low on stock and need restocking:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.map((product) => (
                <div key={product._id} className="flex items-center justify-between p-2 bg-white rounded">
                  <span className="font-medium">{product.name}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="destructive">
                      {product.stockQuantity} {product.unit} left
                    </Badge>
                    <span className="text-sm text-gray-600">Min: {product.minStockLevel}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>Manage your product inventory and pricing</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product)
                return (
                  <TableRow key={product._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-gray-600 truncate max-w-xs">{product.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{formatCurrency(product.price)}</div>
                        <div className="text-sm text-gray-600">per {product.unit}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {product.stockQuantity} {product.unit}
                        </div>
                        <div className="text-sm text-gray-600">Min: {product.minStockLevel}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={stockStatus.color}>
                        {stockStatus.status === "out" && "Out of Stock"}
                        {stockStatus.status === "low" && "Low Stock"}
                        {stockStatus.status === "good" && "In Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {/* Edit Product Dialog */}
                        <Dialog open={!!editingProduct && editingProduct._id === product._id} onOpenChange={(open) => { if (!open) setEditingProduct(null) }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Edit Product</DialogTitle>
                              <DialogDescription>Update product information</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-name">Product Name *</Label>
                                <Input
                                  id="edit-name"
                                  value={newProduct.name}
                                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-category">Category *</Label>
                                  <Select
                                    value={newProduct.category}
                                    onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {categories
                                        .filter((c) => c !== "All")
                                        .map((category) => (
                                          <SelectItem key={category} value={category}>
                                            {category}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-unit">Unit *</Label>
                                  <Select
                                    value={newProduct.unit}
                                    onValueChange={(value) => setNewProduct({ ...newProduct, unit: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pieces">Pieces</SelectItem>
                                      <SelectItem value="bags">Bags</SelectItem>
                                      <SelectItem value="truck">Truck</SelectItem>
                                      <SelectItem value="kg">Kilograms</SelectItem>
                                      <SelectItem value="liters">Liters</SelectItem>
                                      <SelectItem value="sqft">Square Feet</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-price">Price *</Label>
                                  <Input
                                    id="edit-price"
                                    type="number"
                                    value={newProduct.price}
                                    onChange={(e) =>
                                      setNewProduct({ ...newProduct, price: Number.parseFloat(e.target.value) || 0 })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-stockQuantity">Stock Quantity</Label>
                                  <Input
                                    id="edit-stockQuantity"
                                    type="number"
                                    value={newProduct.stockQuantity}
                                    onChange={(e) =>
                                      setNewProduct({
                                        ...newProduct,
                                        stockQuantity: Number.parseInt(e.target.value) || 0,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-minStockLevel">Minimum Stock Level</Label>
                                <Input
                                  id="edit-minStockLevel"
                                  type="number"
                                  value={newProduct.minStockLevel}
                                  onChange={(e) =>
                                    setNewProduct({
                                      ...newProduct,
                                      minStockLevel: Number.parseInt(e.target.value) || 0,
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea
                                  id="edit-description"
                                  value={newProduct.description}
                                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                  rows={2}
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setEditingProduct(null)}>
                                  Cancel
                                </Button>
                                <Button
                                  onClick={async () => {
                                    await handleUpdateProduct()
                                    setEditingProduct(null) // Close the edit modal after update
                                  }}
                                >
                                  Update Product
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        {/* Delete Product Dialog */}
                        <Dialog open={isDeleteDialogOpen && deleteProductId === product._id} onOpenChange={(open) => {
                          if (!open) {
                            setIsDeleteDialogOpen(false)
                            setDeleteProductId(null)
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setDeleteProductId(product._id)
                                setIsDeleteDialogOpen(true)
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Delete Product</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete <span className="font-semibold">{product.name}</span>? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-end space-x-2 mt-4">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsDeleteDialogOpen(false)
                                  setDeleteProductId(null)
                                }}
                              >
                                No, Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={async () => {
                                  await handleDeleteProduct(product._id)
                                  setIsDeleteDialogOpen(false)
                                  setDeleteProductId(null)
                                }}
                              >
                                Yes, Delete
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || selectedCategory !== "All"
                ? "No products found matching your criteria"
                : "No products added yet"}
              {!searchTerm && selectedCategory === "All" && (
                <div className="mt-4">
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Product
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
