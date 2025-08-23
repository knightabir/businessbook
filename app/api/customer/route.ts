import User from "@/models/User";
import { NextResponse } from "next/server";
import Customer from "@/models/Customer";
import connectDB from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import Store from "@/models/Store";
import Products from "@/models/Products";
import Sale from "@/models/Sale";

// Only allow actions on customers belonging to the user's store

export async function POST(request: Request) {
    try {
        await connectDB();
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

        const { name, phone, address } = await request.json();
        if (!name || !phone || !address) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        // Only allow creating customer for this user's store
        const customer = new Customer({
            name,
            phone,
            address,
            storeId: store._id,
        });
        await customer.save();

        return NextResponse.json(customer);
    } catch (error) {
        console.error("Error creating customer:", error);
        return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        await connectDB();
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

        const searchParams = new URL(request.url).searchParams;
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
        }
        const { name, phone, address } = await request.json();

        // Only allow updating customer belonging to this store
        const customer = await Customer.findOne({ _id: id, storeId: store._id });
        if (!customer) {
            return NextResponse.json({ error: "Customer not found or not in your store" }, { status: 404 });
        }
        customer.name = name;
        customer.phone = phone;
        customer.address = address;
        await customer.save();
        return NextResponse.json(customer);
    } catch (error) {
        console.error("Error updating customer:", error);
        return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        await connectDB();
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

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: "Please provide the ID" }, { status: 400 });
        }

        // Only allow deleting customer belonging to this store
        const customer = await Customer.findOne({ _id: id, storeId: store._id });
        if (!customer) {
            return NextResponse.json({ error: "Customer not found or not in your store" }, { status: 404 });
        }

        // Delete all the sales records of that customer. If no record found, that's fine.
        await Sale.deleteMany({ customerId: customer._id });

        await Customer.deleteOne({ _id: customer._id });

        return NextResponse.json({ message: "Customer deleted successfully" });
    } catch (error) {
        console.error("Error deleting customer:", error);
        return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
    }
}

// Get customer -> Customer Name, Customer Phone, Customer Address, Total Due, Total Business, Customer Id.
// Search -> Search customer by name or phone
export async function GET(request: Request) {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.log(session.user.id);
        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        const store = await Store.findOne({ userId: user._id });
        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        // Support search by name or phone via query params
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search")?.trim();

        // Build aggregation pipeline
        const matchStage: any = { storeId: store._id };
        if (search) {
            matchStage.$or = [
                { name: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } }
            ];
        }

        // Aggregation pipeline
        const pipeline: any[] = [];

        pipeline.push({ $match: matchStage });

        pipeline.push(
            {
                $lookup: {
                    from: "sales",
                    localField: "_id",
                    foreignField: "customerId",
                    as: "sales"
                }
            },
            {
                $addFields: {
                    totalSales: {
                        $sum: {
                            $map: {
                                input: "$sales",
                                as: "sale",
                                in: { $ifNull: ["$$sale.totalAmount", 0] }
                            }
                        }
                    },
                    currentDue: {
                        $sum: {
                            $map: {
                                input: "$sales",
                                as: "sale",
                                in: { $ifNull: ["$$sale.dueAmount", 0] }
                            }
                        }
                    },
                    advancePayment: { $literal: 1 }
                }
            },
            {
                $project: {
                    id: "$_id",
                    name: 1,
                    phone: 1,
                    address: 1,
                    totalSales: 1,
                    currentDue: 1,
                    advancePayment: 1
                }
            }
        );

        const customers = await Customer.aggregate(pipeline);

        return NextResponse.json(customers, { status: 200 });
    } catch (error) {
        console.error("Error getting customer:", error);
        return NextResponse.json({ error: "Failed to get customer" }, { status: 500 });
    }
}