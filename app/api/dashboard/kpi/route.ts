import connectDB from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import User from "@/models/User";
import Store from "@/models/Store";
import Supplier from "@/models/Supplier";
import Customer from "@/models/Customer";
import Sale from "@/models/Sale";
import Buying from "@/models/Buying";

/**
 * KPIs:
 * - totalSales: Total sales amount in the period (filtered)
 * - totalCustomers: Number of customers (all time, not filtered)
 * - totalSuppliers: Number of suppliers (all time, not filtered)
 * - customerDues: Total dueAmount from sales in the period (filtered)
 * - supplierDues: Total dueAmount from buyings in the period (filtered)
 * - salesGrowth: % growth in sales count compared to previous period (filtered)
 * - customerGrowth: % growth in customer count compared to previous period (filtered)
 * - netCashFlow: totalSales (filtered) - customerDues (filtered) - supplierDues (filtered)
 * 
 * Filters: today (default), last-week, last-month, last-6-months, last-year
 */

function getDateRange(filter: string) {
    const now = new Date();
    let start: Date, end: Date;
    end = new Date(now);

    switch (filter) {
        case "last-week": {
            // Last 7 days (including today)
            start = new Date(now);
            start.setDate(now.getDate() - 6);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        }
        case "last-month": {
            // Last 30 days (including today)
            start = new Date(now);
            start.setDate(now.getDate() - 29);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        }
        case "last-6-months": {
            start = new Date(now);
            start.setMonth(now.getMonth() - 5);
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        }
        case "last-year": {
            start = new Date(now);
            start.setFullYear(now.getFullYear() - 1);
            start.setMonth(now.getMonth());
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        }
        case "today":
        default: {
            // Today: from 00:00:00 to 23:59:59
            start = new Date(now);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        }
    }
    return { start, end };
}

function getPreviousDateRange(filter: string) {
    // Returns the previous period of the same length as the current filter
    const now = new Date();
    let prevStart: Date, prevEnd: Date;

    switch (filter) {
        case "last-week": {
            // Previous 7 days before current week
            prevEnd = new Date(now);
            prevEnd.setDate(now.getDate() - 7);
            prevEnd.setHours(23, 59, 59, 999);
            prevStart = new Date(prevEnd);
            prevStart.setDate(prevEnd.getDate() - 6);
            prevStart.setHours(0, 0, 0, 0);
            break;
        }
        case "last-month": {
            // Previous 30 days before current month
            prevEnd = new Date(now);
            prevEnd.setDate(now.getDate() - 30);
            prevEnd.setHours(23, 59, 59, 999);
            prevStart = new Date(prevEnd);
            prevStart.setDate(prevEnd.getDate() - 29);
            prevStart.setHours(0, 0, 0, 0);
            break;
        }
        case "last-6-months": {
            prevEnd = new Date(now);
            prevEnd.setMonth(now.getMonth() - 6);
            prevEnd.setDate(0); // last day of previous 6-month period
            prevEnd.setHours(23, 59, 59, 999);
            prevStart = new Date(prevEnd);
            prevStart.setMonth(prevEnd.getMonth() - 5);
            prevStart.setDate(1);
            prevStart.setHours(0, 0, 0, 0);
            break;
        }
        case "last-year": {
            prevEnd = new Date(now);
            prevEnd.setFullYear(now.getFullYear() - 1);
            prevEnd.setMonth(now.getMonth());
            prevEnd.setDate(0); // last day of previous year period
            prevEnd.setHours(23, 59, 59, 999);
            prevStart = new Date(prevEnd);
            prevStart.setFullYear(prevEnd.getFullYear());
            prevStart.setMonth(prevEnd.getMonth() - 11);
            prevStart.setDate(1);
            prevStart.setHours(0, 0, 0, 0);
            break;
        }
        case "today":
        default: {
            // Previous day
            prevEnd = new Date(now);
            prevEnd.setHours(0, 0, 0, 0);
            prevEnd.setMilliseconds(-1); // 1 ms before today
            prevStart = new Date(prevEnd);
            prevStart.setDate(prevEnd.getDate());
            prevStart.setHours(0, 0, 0, 0);
            break;
        }
    }
    return { start: prevStart, end: prevEnd };
}

export async function GET(request: Request) {
    try {
        await connectDB();

        // Get filter from query params
        const url = new URL(request.url);
        const filter = url.searchParams.get("filter") || "today";
        const { start, end } = getDateRange(filter);
        const { start: prevStart, end: prevEnd } = getPreviousDateRange(filter);

        // Get server Session
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthenticated" }, { status: 400 });
        }

        const user = await User.findOne({ email: session.user?.email });
        if (!user) {
            return NextResponse.json({ error: "Unauthenticated" }, { status: 400 });
        }

        const store = await Store.findOne({ userId: user._id });
        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 400 });
        }

        // 1. Total Sales (sum of totalAmount in sales in period) - FILTERED
        // Fix: Ensure createdAt is a Date and the range is correct
        const salesAgg = await Sale.aggregate([
            {
                $match: {
                    storeId: store._id,
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            }
        ]);
        const totalSales = salesAgg.length > 0 ? salesAgg[0].total : 0;
        const salesCount = salesAgg.length > 0 ? salesAgg[0].count : 0;

        // 2. Total Customers (ALL TIME, NOT FILTERED)
        const totalCustomers = await Customer.countDocuments({
            storeId: store._id
        });

        // 3. Total Suppliers (ALL TIME, NOT FILTERED)
        const totalSuppliers = await Supplier.countDocuments({
            storeId: store._id
        });

        // 4. Customer Dues (sum of dueAmount in sales in period) - FILTERED
        const customerDuesAgg = await Sale.aggregate([
            {
                $match: {
                    storeId: store._id,
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$dueAmount" }
                }
            }
        ]);
        const customerDues = customerDuesAgg.length > 0 ? customerDuesAgg[0].total : 0;

        // 5. Supplier Dues (sum of dueAmount in buyings in period) - FILTERED
        const supplierDuesAgg = await Buying.aggregate([
            {
                $match: {
                    storeId: store._id,
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$dueAmount" }
                }
            }
        ]);
        const supplierDues = supplierDuesAgg.length > 0 ? supplierDuesAgg[0].total : 0;

        // 6. Sales Growth (% change in sales count compared to previous period) - FILTERED
        const prevSalesAgg = await Sale.aggregate([
            {
                $match: {
                    storeId: store._id,
                    createdAt: { $gte: prevStart, $lte: prevEnd }
                }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: "$totalAmount" }
                }
            }
        ]);
        const prevSalesCount = prevSalesAgg.length > 0 ? prevSalesAgg[0].count : 0;
        let salesGrowth = 0;
        if (prevSalesCount > 0) {
            salesGrowth = ((salesCount - prevSalesCount) / prevSalesCount) * 100;
        } else if (salesCount > 0) {
            salesGrowth = 100;
        }

        // 7. Customer Growth (% change in customer count compared to previous period) - FILTERED
        const prevCustomerCount = await Customer.countDocuments({
            storeId: store._id,
            createdAt: { $gte: prevStart, $lte: prevEnd }
        });
        let customerGrowth = 0;
        if (prevCustomerCount > 0) {
            customerGrowth = ((totalCustomers - prevCustomerCount) / prevCustomerCount) * 100;
        } else if (totalCustomers > 0) {
            customerGrowth = 100;
        }

        // 8. Net Cash Flow (totalSales - customerDues - supplierDues) - all filtered
        const netCashFlow = totalSales - customerDues - supplierDues;

        const kpis = {
            totalSales,
            totalCustomers,
            totalSuppliers,
            customerDues,
            supplierDues,
            netCashFlow,
            salesGrowth: Number(salesGrowth.toFixed(2)),
            customerGrowth: Number(customerGrowth.toFixed(2))
        };

        return NextResponse.json(kpis);
    } catch (error) {
        console.error("Error fetching KPIs:", error);
        return NextResponse.json({ error: "Failed to fetch KPIs" }, { status: 500 });
    }
}