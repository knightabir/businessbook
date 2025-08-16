
import connectDB from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import User from "@/models/User";
import Store from "@/models/Store";
import Sale from "@/models/Sale";
import Customer from "@/models/Customer";
import Products from "@/models/Products";

// Create a new sale
export async function POST(request: Request) {
    try {
        await connectDB();

        // Authenticate user
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await User.findOne({ email: session.user?.email });
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const store = await Store.findOne({ userId: user._id });
        if (!store) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse and validate request body
        let body;
        try {
            body = await request.json();
        } catch (err) {
            return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
        }

        // Required fields
        const {
            customerId,
            products,
            totalAmount,
            paidAmount,
            dueAmount,
            status
        } = body;

        // Validate presence of required fields
        if (!customerId) {
            return NextResponse.json({ error: "Customer is required." }, { status: 400 });
        }
        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ error: "At least one product is required." }, { status: 400 });
        }
        if (typeof totalAmount !== "number" || isNaN(totalAmount) || totalAmount < 0) {
            return NextResponse.json({ error: "Total amount must be a non-negative number." }, { status: 400 });
        }
        if (typeof paidAmount !== "number" || isNaN(paidAmount) || paidAmount < 0) {
            return NextResponse.json({ error: "Paid amount must be a non-negative number." }, { status: 400 });
        }
        if (typeof dueAmount !== "number" || isNaN(dueAmount) || dueAmount < 0) {
            return NextResponse.json({ error: "Due amount must be a non-negative number." }, { status: 400 });
        }
        if (!status || typeof status !== "string") {
            return NextResponse.json({ error: "Status is required." }, { status: 400 });
        }

        // Validate customer exists
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return NextResponse.json({ error: "Customer not found." }, { status: 404 });
        }

        // Validate and normalize products
        const validatedProducts = [];
        for (const [index, item] of products.entries()) {
            if (!item || typeof item !== "object") {
                return NextResponse.json({ error: `Product at index ${index} is invalid.` }, { status: 400 });
            }
            // Accept either full product info or just productId and quantity/price/unit/total
            // Try to get productId, but also allow for name, price, quantity, unit, total directly
            let {
                productId,
                name,
                price,
                quantity,
                unit,
                total
            } = item;

            // If productId is present, fetch product details
            if (productId) {
                const product = await Products.findById(productId);
                if (!product) {
                    return NextResponse.json({ error: `Product with ID ${productId} not found.` }, { status: 404 });
                }
                // If any field is missing, fill from product
                name = name || product.name;
                price = price !== undefined ? price : product.price;
                unit = unit || product.unit;
            }

            // Validate all required fields for the Sale model
            if (!name || typeof name !== "string") {
                return NextResponse.json({ error: `Product at index ${index} is missing name.` }, { status: 400 });
            }
            if (typeof price !== "number" || isNaN(price) || price < 0) {
                return NextResponse.json({ error: `Product at index ${index} has invalid price.` }, { status: 400 });
            }
            if (typeof quantity !== "number" || isNaN(quantity) || quantity <= 0) {
                return NextResponse.json({ error: `Product at index ${index} has invalid quantity.` }, { status: 400 });
            }
            if (!unit || typeof unit !== "string") {
                return NextResponse.json({ error: `Product at index ${index} is missing unit.` }, { status: 400 });
            }
            // Calculate total if not provided
            if (typeof total !== "number" || isNaN(total) || total < 0) {
                total = price * quantity;
            }

            validatedProducts.push({
                name,
                price,
                quantity,
                unit,
                total
            });
        }

        // Business logic: totalAmount should match sum of products
        const calculatedTotal = validatedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
            return NextResponse.json({ error: "Total amount does not match sum of product prices." }, { status: 400 });
        }
        if (Math.abs(totalAmount - (paidAmount + dueAmount)) > 0.01) {
            return NextResponse.json({ error: "Total amount must equal paid amount plus due amount." }, { status: 400 });
        }

        // Create sale
        const sale = await Sale.create({
            storeId: store._id,
            customerId,
            products: validatedProducts,
            totalAmount,
            paidAmount,
            dueAmount,
            status
        });

        return NextResponse.json(
            { message: "Sale created successfully.", sale },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error creating sale:", error);
        return NextResponse.json(
            { error: error?.message || "Internal server error" },
            { status: 500 }
        );
    }
}

// Get all sales for a customer (by customerId in query params)
export async function GET(request: Request) {
    try {
        await connectDB();

        // Authenticate user
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await User.findOne({ email: session.user?.email });
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const store = await Store.findOne({ userId: user._id });
        if (!store) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get customerId from query params
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get("customerId");

        if (!customerId) {
            return NextResponse.json({ error: "customerId is required in query params." }, { status: 400 });
        }

        // Validate customer exists
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return NextResponse.json({ error: "Customer not found." }, { status: 404 });
        }

        // Get all sales for this customer and store
        const sales = await Sale.find({ customerId, storeId: store._id }).sort({ createdAt: -1 });

        return NextResponse.json({ sales }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching sales:", error);
        return NextResponse.json(
            { error: error?.message || "Internal server error" },
            { status: 500 }
        );
    }
}

// Update a sale/transaction by id (id in query params)
export async function PUT(request: Request) {
    try {
        await connectDB();

        // Authenticate user
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await User.findOne({ email: session.user?.email });
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const store = await Store.findOne({ userId: user._id });
        if (!store) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get id from query params
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "id is required in query params." }, { status: 400 });
        }

        // Parse and validate request body
        let body;
        try {
            body = await request.json();
        } catch (err) {
            return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
        }

        // Only allow updating certain fields
        const allowedFields = [
            "products",
            "totalAmount",
            "paidAmount",
            "dueAmount",
            "status"
        ];
        const updateData: any = {};
        for (const key of allowedFields) {
            if (body[key] !== undefined) {
                updateData[key] = body[key];
            }
        }

        // If products are being updated, validate them
        if (updateData.products) {
            if (!Array.isArray(updateData.products) || updateData.products.length === 0) {
                return NextResponse.json({ error: "At least one product is required." }, { status: 400 });
            }
            const validatedProducts = [];
            for (const [index, item] of updateData.products.entries()) {
                if (!item || typeof item !== "object") {
                    return NextResponse.json({ error: `Product at index ${index} is invalid.` }, { status: 400 });
                }
                let {
                    productId,
                    name,
                    price,
                    quantity,
                    unit,
                    total
                } = item;

                if (productId) {
                    const product = await Products.findById(productId);
                    if (!product) {
                        return NextResponse.json({ error: `Product with ID ${productId} not found.` }, { status: 404 });
                    }
                    name = name || product.name;
                    price = price !== undefined ? price : product.price;
                    unit = unit || product.unit;
                }

                if (!name || typeof name !== "string") {
                    return NextResponse.json({ error: `Product at index ${index} is missing name.` }, { status: 400 });
                }
                if (typeof price !== "number" || isNaN(price) || price < 0) {
                    return NextResponse.json({ error: `Product at index ${index} has invalid price.` }, { status: 400 });
                }
                if (typeof quantity !== "number" || isNaN(quantity) || quantity <= 0) {
                    return NextResponse.json({ error: `Product at index ${index} has invalid quantity.` }, { status: 400 });
                }
                if (!unit || typeof unit !== "string") {
                    return NextResponse.json({ error: `Product at index ${index} is missing unit.` }, { status: 400 });
                }
                if (typeof total !== "number" || isNaN(total) || total < 0) {
                    total = price * quantity;
                }

                validatedProducts.push({
                    name,
                    price,
                    quantity,
                    unit,
                    total
                });
            }
            updateData.products = validatedProducts;
        }

        // If updating amounts, check business logic
        if (
            updateData.totalAmount !== undefined &&
            (updateData.paidAmount !== undefined || updateData.dueAmount !== undefined)
        ) {
            const totalAmount = updateData.totalAmount;
            const paidAmount = updateData.paidAmount !== undefined ? updateData.paidAmount : 0;
            const dueAmount = updateData.dueAmount !== undefined ? updateData.dueAmount : 0;
            if (Math.abs(totalAmount - (paidAmount + dueAmount)) > 0.01) {
                return NextResponse.json({ error: "Total amount must equal paid amount plus due amount." }, { status: 400 });
            }
        }

        console.log(updateData);
        // Update the sale
        const updatedSale = await Sale.findOneAndUpdate(
            { _id: id, storeId: store._id },
            { $set: updateData },
            { new: true }
        );

        if (!updatedSale) {
            return NextResponse.json({ error: "Sale not found or not authorized." }, { status: 404 });
        }

        return NextResponse.json(
            { message: "Sale updated successfully.", sale: updatedSale },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error updating sale:", error);
        return NextResponse.json(
            { error: error?.message || "Internal server error" },
            { status: 500 }
        );
    }
}

// Delete a sale/transaction by id (id in query params)
export async function DELETE(request: Request) {
    try {
        await connectDB();

        // Authenticate user
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await User.findOne({ email: session.user?.email });
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const store = await Store.findOne({ userId: user._id });
        if (!store) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get id from query params
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "id is required in query params." }, { status: 400 });
        }

        // Delete the sale
        const deletedSale = await Sale.findOneAndDelete({ _id: id, storeId: store._id });

        if (!deletedSale) {
            return NextResponse.json({ error: "Sale not found or not authorized." }, { status: 404 });
        }

        return NextResponse.json(
            { message: "Sale deleted successfully." },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error deleting sale:", error);
        return NextResponse.json(
            { error: error?.message || "Internal server error" },
            { status: 500 }
        );
    }
}