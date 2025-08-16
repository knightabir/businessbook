import User from "@/models/User";
import { NextResponse } from "next/server";
import Customer from "@/models/Customer";
import connectDB from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import Store from "@/models/Store";
import Products from "@/models/Products";
import Sale from "@/models/Sale";

export async function POST(request: Request) {
    try {
        const { name, phone, address } = await request.json();
        await connectDB();

        const session: any = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        if (!name || !phone || !address) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }
        const store = await Store.findOne({ userId: user._id });
        const customer = new Customer({
            name,
            phone,
            address,
            storeId: store ? store._id : null,
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
        const searchParams = new URL(request.url).searchParams;
        const id = searchParams.get('id');
        const { name, phone, address } = await request.json();
        const customer = await Customer.findById(id);
        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
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
        const searchParams = new URL(request.url).searchParams;
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: "Please provide the ID" }, { status: 400 });
        }

        const customer = await Customer.findById(id);
        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        await Customer.deleteOne({ _id: id });

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

        // Support search by name or phone via query params
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search")?.trim();

        // Build aggregation pipeline
        const matchStage: any = {};
        if (search) {
            matchStage.$or = [
                { name: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } }
            ];
        }

        // Aggregation pipeline
        const pipeline: any[] = [];

        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }

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