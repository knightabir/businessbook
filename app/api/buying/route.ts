import connectDB from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import User from "@/models/User";
import Store from "@/models/Store";
import Buying from "@/models/Buying";
import Supplier from "@/models/Supplier";
import Products from "@/models/Products";

/**
 * GET /api/buying?supplierId=<id>
 * Returns all buying records for a supplier for the authenticated user's store.
 */
export async function GET(request: Request) {
    try {
        await connectDB();

        // Authenticate User
        const session: any = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const store = await Store.findOne({ userId: user._id });
        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        // get supplierId from query params
        const { searchParams } = new URL(request.url);
        const supplierId = searchParams.get("supplierId");

        if (!supplierId) {
            return NextResponse.json({ error: "supplierId is required in query params." }, { status: 400 });
        }

        // Validate supplier exists
        const supplier = await Supplier.findById(supplierId);
        if (!supplier) {
            return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
        }

        // Get all procurement from the supplier
        const buying = await Buying.find({ storeId: store._id, supplierId: supplier._id }).sort({ createdAt: -1 });

        return NextResponse.json(buying, { status: 200 });
    } catch (error) {
        console.error("Error getting buying:", error);
        return NextResponse.json({ error: "Failed to get buying" }, { status: 500 });
    }
}

/**
 * POST /api/buying
 * Body: { supplierId, products, totalAmount, paidAmount, dueAmount, status }
 * products: [{ productId, name, quantity, price, ... }]
 */
export async function POST(request: Request) {
    try {
        await connectDB();

        // Authenticate user
        const session: any = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const store = await Store.findOne({ userId: user._id });
        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        // Parse and validate the request body
        let body;
        try {
            body = await request.json();
        } catch (error) {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        // Required fields
        const {
            supplierId,
            products,
            totalAmount,
            paidAmount,
            dueAmount,
            status
        } = body;

        // Validate presence of required fields
        if (!supplierId || !Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ error: "supplierId and products are required." }, { status: 400 });
        }

        // Validate supplier exists
        const supplier = await Supplier.findById(supplierId);
        if (!supplier) {
            return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
        }

        // Validate and normalize products
        let calculatedTotal = 0;
        const normalizedProducts = [];

        for (const item of products) {
            // Each product must have at least name, quantity, price
            if (
                typeof item.name !== "string" ||
                typeof item.quantity !== "number" ||
                typeof item.price !== "number"
            ) {
                return NextResponse.json({ error: "Each product must have name, quantity, and price." }, { status: 400 });
            }
            // Calculate total for this product
            const productTotal = item.quantity * item.price;
            calculatedTotal += productTotal;

            // Normalize product object
            normalizedProducts.push({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: productTotal,
                unit: item.unit || "",
                custom: !!item.custom,
            });
        }

        // Validate totalAmount matches sum of products
        if (typeof totalAmount !== "number" || Math.abs(totalAmount - calculatedTotal) > 0.01) {
            return NextResponse.json({ error: "totalAmount does not match sum of products." }, { status: 400 });
        }

        // Validate paidAmount and dueAmount
        if (typeof paidAmount !== "number" || typeof dueAmount !== "number") {
            return NextResponse.json({ error: "paidAmount and dueAmount are required and must be numbers." }, { status: 400 });
        }
        if (Math.abs((paidAmount + dueAmount) - totalAmount) > 0.01) {
            return NextResponse.json({ error: "paidAmount + dueAmount must equal totalAmount." }, { status: 400 });
        }

        // Validate status
        const allowedStatus = ["paid", "partial", "due"];
        if (!status || !allowedStatus.includes(status)) {
            return NextResponse.json({ error: `status must be one of: ${allowedStatus.join(", ")}` }, { status: 400 });
        }

        // Create buying record
        const buying = new Buying({
            storeId: store._id,
            supplierId: supplier._id,
            products: normalizedProducts,
            totalAmount,
            paidAmount,
            dueAmount,
            status,
            createdBy: user._id,
        });

        await buying.save();

        return NextResponse.json(buying, { status: 201 });
    } catch (error) {
        console.error("Error creating buying:", error);
        return NextResponse.json({ error: "Failed to create buying" }, { status: 500 });
    }
}

/**
 * PUT /api/buying?id=<buyingId>
 * Update a buying record.
 *
 * Accepts products as an array of objects with:
 * [
 *   {
 *     "name": "Berger Interior Emulsion",
 *     "quantity": 10,
 *     "price": 290,
 *     "total": 2900,
 *     "unit": "liters",
 *     "custom": false
 *   },
 *   ...
 * ]
 */
export async function PUT(request: Request) {
    try {
        await connectDB();

        // Authenticate user
        const session: any = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const store = await Store.findOne({ userId: user._id });
        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        // Get buyingId from query params
        const { searchParams } = new URL(request.url);
        const buyingId = searchParams.get("id");
        if (!buyingId) {
            return NextResponse.json({ error: "id is required in query params." }, { status: 400 });
        }

        // Parse and validate the request body
        let body;
        try {
            body = await request.json();
        } catch (error) {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        // Find the buying record
        const buying = await Buying.findOne({ _id: buyingId, storeId: store._id });
        if (!buying) {
            return NextResponse.json({ error: "Buying record not found" }, { status: 404 });
        }

        // Only allow updating certain fields
        const updatableFields = ["products", "totalAmount", "paidAmount", "dueAmount", "status"];
        for (const field of updatableFields) {
            if (body[field] !== undefined) {
                buying[field] = body[field];
            }
        }

        // If products are updated, recalculate totalAmount and validate structure
        if (body.products) {
            let calculatedTotal = 0;
            const normalizedProducts = [];
            for (const item of body.products) {
                // Validate required fields
                if (
                    typeof item.name !== "string" ||
                    typeof item.quantity !== "number" ||
                    typeof item.price !== "number" ||
                    typeof item.total !== "number"
                ) {
                    return NextResponse.json({ error: "Each product must have name (string), quantity (number), price (number), and total (number)." }, { status: 400 });
                }
                // Optionally validate unit and custom
                if (item.unit && typeof item.unit !== "string") {
                    return NextResponse.json({ error: "If provided, unit must be a string." }, { status: 400 });
                }
                if (item.custom !== undefined && typeof item.custom !== "boolean") {
                    return NextResponse.json({ error: "If provided, custom must be a boolean." }, { status: 400 });
                }
                // Validate total = quantity * price
                const expectedTotal = item.quantity * item.price;
                if (Math.abs(item.total - expectedTotal) > 0.01) {
                    return NextResponse.json({ error: `Product total does not match quantity * price for product: ${item.name}` }, { status: 400 });
                }
                calculatedTotal += item.total;
                normalizedProducts.push({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total,
                    unit: item.unit || "",
                    custom: !!item.custom,
                });
            }
            buying.products = normalizedProducts;
            buying.totalAmount = calculatedTotal;
        }

        // Validate paidAmount and dueAmount
        if (buying.paidAmount === undefined || buying.dueAmount === undefined) {
            return NextResponse.json({ error: "paidAmount and dueAmount are required." }, { status: 400 });
        }
        if (Math.abs((buying.paidAmount + buying.dueAmount) - buying.totalAmount) > 0.01) {
            return NextResponse.json({ error: "paidAmount + dueAmount must equal totalAmount." }, { status: 400 });
        }

        // Validate status
        const allowedStatus = ["paid", "partial", "due"];
        if (!buying.status || !allowedStatus.includes(buying.status)) {
            return NextResponse.json({ error: `status must be one of: ${allowedStatus.join(", ")}` }, { status: 400 });
        }

        await buying.save();

        return NextResponse.json(buying, { status: 200 });
    } catch (error) {
        console.error("Error updating buying:", error);
        return NextResponse.json({ error: "Failed to update buying" }, { status: 500 });
    }
}

/**
 * DELETE /api/buying?id=<buyingId>
 * Delete a buying record.
 */
export async function DELETE(request: Request) {
    try {
        await connectDB();

        // Authenticate user
        const session: any = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const store = await Store.findOne({ userId: user._id });
        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        // Get buyingId from query params
        const { searchParams } = new URL(request.url);
        const buyingId = searchParams.get("id");
        if (!buyingId) {
            return NextResponse.json({ error: "id is required in query params." }, { status: 400 });
        }

        // Find and delete the buying record
        const buying = await Buying.findOneAndDelete({ _id: buyingId, storeId: store._id });
        if (!buying) {
            return NextResponse.json({ error: "Buying record not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Buying record deleted successfully." }, { status: 200 });
    } catch (error) {
        console.error("Error deleting buying:", error);
        return NextResponse.json({ error: "Failed to delete buying" }, { status: 500 });
    }
}