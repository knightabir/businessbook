/**
 * const duesData = [
  { name: "Customer Dues", value: 25000, color: "#ef4444" },
  { name: "Supplier Dues", value: 18000, color: "#f97316" },
  { name: "Available Cash", value: 82000, color: "#22c55e" },
];
 */

import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import { NextResponse } from "next/server";
import User from "@/models/User";
import Store from "@/models/Store";
import Sale from "@/models/Sale";
import Buying from "@/models/Buying";

// Helper to get date range for filter
function getDateRange(filter: string) {
    const now = new Date();
    let start: Date, end: Date;
    end = new Date(now); // always up to now

    switch (filter) {
        case "today":
            start = new Date(now);
            start.setHours(0, 0, 0, 0);
            end = new Date(now);
            end.setHours(23, 59, 59, 999);
            break;
        case "last-week":
            // Last 7 days including today
            start = new Date(now);
            start.setDate(now.getDate() - 6);
            start.setHours(0, 0, 0, 0);
            end = new Date(now);
            end.setHours(23, 59, 59, 999);
            break;
        case "last-month":
            // Last 30 days including today
            start = new Date(now);
            start.setDate(now.getDate() - 29);
            start.setHours(0, 0, 0, 0);
            end = new Date(now);
            end.setHours(23, 59, 59, 999);
            break;
        case "last-6-months":
            // From 6 months ago to now
            start = new Date(now);
            start.setMonth(now.getMonth() - 5);
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end = new Date(now);
            end.setHours(23, 59, 59, 999);
            break;
        case "last-year":
            // From 1 year ago to now
            start = new Date(now);
            start.setFullYear(now.getFullYear() - 1);
            start.setMonth(now.getMonth());
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end = new Date(now);
            end.setHours(23, 59, 59, 999);
            break;
        default:
            // Default to last week
            start = new Date(now);
            start.setDate(now.getDate() - 6);
            start.setHours(0, 0, 0, 0);
            end = new Date(now);
            end.setHours(23, 59, 59, 999);
            break;
    }
    return { start, end };
}

export async function GET(request: Request) {
    try {
        await connectDB();
        const url = new URL(request.url);
        // Accept filter: today, last-week, last-month, last-6-months, last-year
        const filter = url.searchParams.get("filter") || "last-week";
        const { start, end } = getDateRange(filter);

        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fix: await User.findOne
        const user: any = await User.findOne({ email: session.user?.email });
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const store = await Store.findOne({ userId: user._id });
        if (!store) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // customer sales data (for this store, in date range)
        const customerDues = await Sale.aggregate([
            {
                $match: {
                    storeId: store._id,
                    status: "partial",
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: null,
                    totalDues: {
                        $sum: "$dueAmount"
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalDues: 1
                }
            }
        ]);
        // supplier sales data (for this store, in date range)
        const supplierDues = await Buying.aggregate([
            {
                $match: {
                    storeId: store._id,
                    status: "partial",
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: null,
                    totalDues: {
                        $sum: "$dueAmount"
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalDues: 1
                }
            }
        ]);
        // available cash (for this store, in date range)
        const availableCash = await Sale.aggregate([
            {
                $match: {
                    storeId: store._id,
                    status: "paid",
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: {
                        $sum: "$totalAmount"
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalAmount: 1
                }
            }
        ]);

        return NextResponse.json(
            [
                { name: 'Customer Dues', value: customerDues[0]?.totalDues || 0, color: '#ef4444' },
                { name: 'Supplier Owes', value: supplierDues[0]?.totalDues || 0, color: '#f97316' },
                { name: 'Available Cash', value: availableCash[0]?.totalAmount || 0, color: '#22c55e' },
            ]
        );
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}