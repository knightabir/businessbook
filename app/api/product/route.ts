import User from "@/models/User";
import { NextResponse } from "next/server";
import Customer from "@/models/Customer";
import connectDB from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import Store from "@/models/Store";
import Product from "@/models/Products";

export async function POST(request: Request) {
    try {
        const { name, category, unit, price, stockQuantity, minStockLevel, description } = await request.json();
        await connectDB();

        const session: any = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        if (!name || !category || !unit || !price || !stockQuantity || !minStockLevel) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }
        const store = await Store.findOne({ userId: user._id });
        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        const product = new Product({
            storeId: store._id,
            name,
            category,
            unit,
            price,
            stockQuantity,
            minStockLevel,
            description,
        });
        await product.save();

        return NextResponse.json(product);
    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }
}
export async function PUT(request: Request) {
    try {
        // Get the id from the request params
        const searchParams = new URL(request.url).searchParams;
        const id = searchParams.get("id");
        const { name, category, unit, price, stockQuantity, minStockLevel, description } = await request.json();
        await connectDB();

        const session: any = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        if (!name || !category || !unit || !price || !stockQuantity || !minStockLevel) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }
        const store = await Store.findOne({ userId: user._id });
        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }
        const product = await Product.findById(id);
        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }
        product.name = name;
        product.category = category;
        product.unit = unit;
        product.price = price;
        product.stockQuantity = stockQuantity;
        product.minStockLevel = minStockLevel;
        product.description = description;
        await product.save();

        return NextResponse.json(product);
    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        await connectDB();
        const searchParams = new URL(request.url).searchParams;
        const id = searchParams.get("id");
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }
        return NextResponse.json(product);
    } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }
}

// Get all the products, search by name, filter by category: if category == All, then return all the products,
// other category options are [cement, steel, bricks, sand & Aggregates, paint, hardware.]
// product get by id is in the params
// filter and other details also in the params.

export async function GET(request: Request) {
    try {
        await connectDB();

        const searchParams = new URL(request.url).searchParams;
        const id = searchParams.get("id");
        const name = searchParams.get("name");
        const category = searchParams.get("category");
        const storeId = searchParams.get("storeId");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const minStock = searchParams.get("minStock");
        const maxStock = searchParams.get("maxStock");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "20", 10);

        // If id is provided, return the product by id
        if (id) {
            const product = await Product.findById(id);
            if (!product) {
                return NextResponse.json({ error: "Product not found" }, { status: 404 });
            }
            return NextResponse.json(product);
        }

        // Build query object
        const query: any = {};

        // Filter by storeId if provided
        if (storeId) {
            query.storeId = storeId;
        }

        // Filter by name (case-insensitive, partial match)
        if (name) {
            query.name = { $regex: name, $options: "i" };
        }

        // Filter by category
        if (category && category !== "All") {
            query.category = category;
        }

        // Filter by price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Filter by stock quantity range
        if (minStock || maxStock) {
            query.stockQuantity = {};
            if (minStock) query.stockQuantity.$gte = Number(minStock);
            if (maxStock) query.stockQuantity.$lte = Number(maxStock);
        }

        // Pagination
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const total = await Product.countDocuments(query);

        // Fetch products
        const products = await Product.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        return NextResponse.json({
            products,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}