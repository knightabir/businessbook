import connectDB from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import User from "@/models/User";
import Store from "@/models/Store";
import Sale from "@/models/Sale";

// Helper to get start/end of day
function getDayRange(date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

// Helper to get last N days (including today)
function getLastNDaysRanges(n: number) {
    const days: { label: string, start: Date, end: Date, date: string }[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const { start, end } = getDayRange(d);
        // Use weekday short name as label, and ISO date string for date
        const label = d.toLocaleDateString("en-US", { weekday: "short" });
        const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
        days.push({ label, start, end, date: dateStr });
    }
    return days;
}

// Helper to get last N months (including current)
function getLastNMonthsRanges(n: number) {
    const months: { label: string, start: Date, end: Date, month: string }[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        const label = d.toLocaleDateString("en-US", { month: "short" });
        // Use YYYY-MM for month
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        months.push({ label, start, end, month: monthStr });
    }
    return months;
}

// Helper to get last N years (including current)
function getLastNYearsRanges(n: number) {
    const years: { label: string, start: Date, end: Date, year: string }[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const year = now.getFullYear() - i;
        const start = new Date(year, 0, 1, 0, 0, 0, 0);
        const end = new Date(year, 11, 31, 23, 59, 59, 999);
        years.push({ label: year.toString(), start, end, year: year.toString() });
    }
    return years;
}

export async function GET(request: Request) {
    try {
        await connectDB();
        const url = new URL(request.url);
        // filter: "last-7-days" (default), "last-month", "last-year"
        const filter = url.searchParams.get("filter") || "last-7-days";

        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthenticated" }, { status: 400 });
        }
        const user = await User.findOne({ email: session?.user?.email });
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 404 });
        }
        const store = await Store.findOne({ userId: user._id });
        if (!store) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 404 });
        }

        let salesData: any[] = [];

        if (filter === "last-7-days") {
            // Group by weekday label
            const ranges = getLastNDaysRanges(7);
            for (const r of ranges) {
                const agg = await Sale.aggregate([
                    {
                        $match: {
                            storeId: store._id,
                            createdAt: { $gte: r.start, $lte: r.end }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: "$totalAmount" }
                        }
                    }
                ]);
                salesData.push({
                    day: r.label,
                    sales: agg.length > 0 ? agg[0].total : 0
                });
            }
        } else if (filter === "last-month") {
            // Last 30 days, group by date (YYYY-MM-DD)
            const ranges = getLastNDaysRanges(30);
            for (const r of ranges) {
                const agg = await Sale.aggregate([
                    {
                        $match: {
                            storeId: store._id,
                            createdAt: { $gte: r.start, $lte: r.end }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: "$totalAmount" }
                        }
                    }
                ]);
                salesData.push({
                    day: r.date, // Use date string
                    sales: agg.length > 0 ? agg[0].total : 0
                });
            }
        } else if (filter === "last-year") {
            // Last 12 months, group by month (MMM)
            const ranges = getLastNMonthsRanges(12);
            for (const r of ranges) {
                const agg = await Sale.aggregate([
                    {
                        $match: {
                            storeId: store._id,
                            createdAt: { $gte: r.start, $lte: r.end }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: "$totalAmount" }
                        }
                    }
                ]);
                salesData.push({
                    day: r.label, // Use month short name
                    sales: agg.length > 0 ? agg[0].total : 0
                });
            }
        } else {
            // fallback to last 7 days (weekday label)
            const ranges = getLastNDaysRanges(7);
            for (const r of ranges) {
                const agg = await Sale.aggregate([
                    {
                        $match: {
                            storeId: store._id,
                            createdAt: { $gte: r.start, $lte: r.end }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: "$totalAmount" }
                        }
                    }
                ]);
                salesData.push({
                    day: r.label,
                    sales: agg.length > 0 ? agg[0].total : 0
                });
            }
        }

        return NextResponse.json(salesData);
    } catch (error) {
        console.error("Error fetching sales data:", error);
        return NextResponse.json({ error: "Failed to fetch sales data" }, { status: 500 });
    }
}

/**
 * For "last-7-days": [{ day: "Mon", sales: 12000 }, ...]
 * For "last-month": [{ day: "2024-06-01", sales: 12000 }, ...]
 * For "last-year": [{ day: "Jan", sales: 12000 }, ...]
 */