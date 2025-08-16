import connectDB from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import User from "@/models/User";
import Store from "@/models/Store";
import Sale from "@/models/Sale";
import Buying from "@/models/Buying";

// Helper to get start/end of week (Monday-Sunday)
function getWeekRange(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    // getDay: 0 (Sun) - 6 (Sat), so for Monday as start:
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
}

export async function GET(request: Request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user: any = await User.findOne({ email: session.user?.email });
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const store = await Store.findOne({ userId: user._id });
        if (!store) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Dates for calculations
        const now = new Date();
        // This week (Monday-Sunday)
        const { start: thisWeekStart, end: thisWeekEnd } = getWeekRange(now);
        // Previous week
        const prevWeekEnd = new Date(thisWeekStart);
        prevWeekEnd.setMilliseconds(-1);
        const prevWeekStart = new Date(prevWeekEnd);
        prevWeekStart.setDate(prevWeekEnd.getDate() - 6);
        prevWeekStart.setHours(0, 0, 0, 0);

        // 30+ days ago
        const overDueDate = new Date(now);
        overDueDate.setDate(now.getDate() - 30);
        overDueDate.setHours(23, 59, 59, 999);

        // CUSTOMER DUES
        // Total customer dues (all time, status: partial)
        const customerTotalAgg = await Sale.aggregate([
            {
                $match: {
                    storeId: store._id,
                    status: "partial"
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$dueAmount" }
                }
            }
        ]);
        const customerTotal = customerTotalAgg[0]?.total || 0;

        // Overdue (30+ days)
        const customerOverdueAgg = await Sale.aggregate([
            {
                $match: {
                    storeId: store._id,
                    status: "partial",
                    createdAt: { $lte: overDueDate }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$dueAmount" }
                }
            }
        ]);
        const customerOverdue = customerOverdueAgg[0]?.total || 0;

        // Due this week
        const customerThisWeekAgg = await Sale.aggregate([
            {
                $match: {
                    storeId: store._id,
                    status: "partial",
                    createdAt: { $gte: thisWeekStart, $lte: thisWeekEnd }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$dueAmount" }
                }
            }
        ]);
        const customerThisWeek = customerThisWeekAgg[0]?.total || 0;

        // Due previous week
        const customerPrevWeekAgg = await Sale.aggregate([
            {
                $match: {
                    storeId: store._id,
                    status: "partial",
                    createdAt: { $gte: prevWeekStart, $lte: prevWeekEnd }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$dueAmount" }
                }
            }
        ]);
        const customerPrevWeek = customerPrevWeekAgg[0]?.total || 0;

        // SUPPLIER DUES
        // Total supplier dues (all time, status: partial)
        const supplierTotalAgg = await Buying.aggregate([
            {
                $match: {
                    storeId: store._id,
                    status: "partial"
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$dueAmount" }
                }
            }
        ]);
        const supplierTotal = supplierTotalAgg[0]?.total || 0;

        // Overdue (30+ days)
        const supplierOverdueAgg = await Buying.aggregate([
            {
                $match: {
                    storeId: store._id,
                    status: "partial",
                    createdAt: { $lte: overDueDate }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$dueAmount" }
                }
            }
        ]);
        const supplierOverdue = supplierOverdueAgg[0]?.total || 0;

        // Due this week
        const supplierThisWeekAgg = await Buying.aggregate([
            {
                $match: {
                    storeId: store._id,
                    status: "partial",
                    createdAt: { $gte: thisWeekStart, $lte: thisWeekEnd }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$dueAmount" }
                }
            }
        ]);
        const supplierThisWeek = supplierThisWeekAgg[0]?.total || 0;

        // Due previous week
        const supplierPrevWeekAgg = await Buying.aggregate([
            {
                $match: {
                    storeId: store._id,
                    status: "partial",
                    createdAt: { $gte: prevWeekStart, $lte: prevWeekEnd }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$dueAmount" }
                }
            }
        ]);
        const supplierPrevWeek = supplierPrevWeekAgg[0]?.total || 0;

        // Output in requested format
        return NextResponse.json({
            customer: {
                total: customerTotal,
                overDue: customerOverdue,
                dueThisWeek: customerThisWeek,
                duePreviousWeek: customerPrevWeek
            },
            supplier: {
                total: supplierTotal,
                overDue: supplierOverdue,
                dueThisWeek: supplierThisWeek,
                duePreviousWeek: supplierPrevWeek
            }
        });
    } catch (error) {
        console.error("Error in /api/dashboard/outstanding:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}