import User from "@/models/User";
import { NextResponse } from "next/server";
import Supplier from "@/models/Supplier";
import connectDB from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import Store from "@/models/Store";
import Buying from "@/models/Buying";

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
        const supplier = new Supplier({
            name,
            phone,
            address,
            storeId: store ? store._id : null,
        });
        await supplier.save();

        return NextResponse.json(supplier);
    } catch (error) {
        console.error("Error creating supplier:", error);
        return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        await connectDB();
        const searchParams = new URL(request.url).searchParams;
        const id = searchParams.get('id');
        const { name, phone, address } = await request.json();
        const supplier = await Supplier.findById(id);
        if (!supplier) {
            return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
        }
        supplier.name = name;
        supplier.phone = phone;
        supplier.address = address;
        await supplier.save();
        return NextResponse.json(supplier);
    } catch (error) {
        console.error("Error updating supplier:", error);
        return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
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

        const supplier = await Supplier.findById(id);
        if (!supplier) {
            return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
        }

        await Supplier.deleteOne({ _id: id });
        return NextResponse.json({ message: "Supplier deleted successfully" });
    } catch (error) {
        console.error("Error deleting supplier:", error);
        return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        await connectDB();
        const searchParams = new URL(request.url).searchParams;
        const id = searchParams.get('id');
        const search = searchParams.get('search')?.trim();

        // If id is provided, return only the single supplier with aggregation
        if (id) {
            const { Types } = await import("mongoose");
            const objectId = typeof id === "string" ? new Types.ObjectId(id) : id;
            const pipeline: any[] = [
                { $match: { _id: objectId } },
                {
                    $lookup: {
                        from: "buyings", // collection name in MongoDB is usually plural
                        localField: "_id",
                        foreignField: "supplierId",
                        as: "buyings"
                    }
                },
                {
                    $addFields: {
                        totalPurchases: {
                            $sum: {
                                $map: {
                                    input: "$buyings",
                                    as: "buy",
                                    in: { $ifNull: ["$$buy.totalAmount", 0] }
                                }
                            }
                        },
                        currentDue: {
                            $sum: {
                                $map: {
                                    input: "$buyings",
                                    as: "buy",
                                    in: { $ifNull: ["$$buy.dueAmount", 0] }
                                }
                            }
                        },
                        advancePayment: {
                            $sum: {
                                $map: {
                                    input: "$buyings",
                                    as: "buy",
                                    in: { $ifNull: ["$$buy.paidAmount", 0] }
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        id: "$_id",
                        name: 1,
                        phone: 1,
                        address: 1,
                        totalPurchases: 1,
                        currentDue: 1,
                        advancePayment: 1,
                        buyings: 1 // include all buyings for this supplier
                    }
                }
            ];

            const result = await Supplier.aggregate(pipeline);
            if (!result || result.length === 0) {
                return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
            }
            return NextResponse.json(result[0], { status: 200 });
        }

        // Otherwise, support search by name or phone via query params
        const matchStage: any = {};
        if (search) {
            matchStage.$or = [
                { name: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } }
            ];
        }

        // Aggregation pipeline for all suppliers
        const pipeline: any[] = [];
        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }

        pipeline.push(
            {
                $lookup: {
                    from: "buyings",
                    localField: "_id",
                    foreignField: "supplierId",
                    as: "buyings"
                }
            },
            {
                $addFields: {
                    totalPurchases: {
                        $sum: {
                            $map: {
                                input: "$buyings",
                                as: "buy",
                                in: { $ifNull: ["$$buy.totalAmount", 0] }
                            }
                        }
                    },
                    currentDue: {
                        $sum: {
                            $map: {
                                input: "$buyings",
                                as: "buy",
                                in: { $ifNull: ["$$buy.dueAmount", 0] }
                            }
                        }
                    },
                    advancePayment: {
                        $sum: {
                            $map: {
                                input: "$buyings",
                                as: "buy",
                                in: { $ifNull: ["$$buy.paidAmount", 0] }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    id: "$_id",
                    name: 1,
                    phone: 1,
                    address: 1,
                    totalPurchases: 1,
                    currentDue: 1,
                    advancePayment: 1,
                    buyings: 1 // include all buyings for each supplier
                }
            }
        );

        const suppliers = await Supplier.aggregate(pipeline);
        return NextResponse.json(suppliers, { status: 200 });
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
    }
}