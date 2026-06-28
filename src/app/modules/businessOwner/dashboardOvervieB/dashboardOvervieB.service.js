import prisma from "../../../prisma/client.js";
import { getBookingModel } from "../../../utils/bookingHelpers.js";

const getDashboardOverviewService = async (businessId) => {
    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const last7DaysStart = new Date(now);
    last7DaysStart.setDate(now.getDate() - 6);
    last7DaysStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Resolve business type
    const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { businessType: true },
    });
    const businessType = business?.businessType || "ORDER_BOOKING";
    const { model } = getBookingModel(businessType);

    // Determine pending statuses based on business type
    let pendingStatuses = [];
    if (businessType === "PARCEL_DELIVERY") {
        pendingStatuses = ["PENDING", "PICKUP_PENDING", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "ON_HOLD"];
    } else if (businessType === "APPOINTMENT_BOOKING") {
        pendingStatuses = ["PENDING", "CONFIRMED", "IN_PROGRESS", "ON_HOLD"];
    } else {
        // ORDER_BOOKING
        pendingStatuses = ["PENDING", "PROCESSING", "READY", "IN_PROGRESS", "ON_HOLD"];
    }

    const [
        todayOrders,
        pendingDeliveries,
        recentActivity,
        whatsappActiveUsers,
        messengerActiveUsers,
        instagramActiveUsers,
        weeklyOrdersRaw,
        branches,
        last7DaysBookings,
    ] = await Promise.all([
        model.count({
            where: {
                businessId,
                createdAt: {
                    gte: todayStart,
                    lte: todayEnd,
                },
            },
        }),

        model.count({
            where: {
                businessId,
                status: {
                    in: pendingStatuses,
                },
            },
        }),

        prisma.auditLog.findMany({
            where: {
                businessId,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 10,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        profilePicture: true,
                    },
                },
            },
        }),

        prisma.whatsappConversation.count({
            where: {
                businessId,
                lastMessageAt: {
                    gte: last7DaysStart,
                },
            },
        }),

        prisma.conversation.count({
            where: {
                businessId,
                platform: "messenger",
                lastMessageAt: {
                    gte: last7DaysStart,
                },
            },
        }),

        prisma.conversation.count({
            where: {
                businessId,
                platform: "instagram",
                lastMessageAt: {
                    gte: last7DaysStart,
                },
            },
        }),

        model.findMany({
            where: {
                businessId,
                createdAt: {
                    gte: monthStart,
                },
            },
            select: {
                createdAt: true,
                price: true,
            },
        }),

        prisma.branch.findMany({
            where: {
                businessId,
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
            },
        }),

        model.findMany({
            where: {
                businessId,
                createdAt: {
                    gte: last7DaysStart,
                    lte: todayEnd,
                },
            },
            select: {
                branchId: true,
                price: true,
            },
        }),
    ]);

    const todaysSales = weeklyOrdersRaw
        .filter((order) => {
            const createdAt = new Date(order.createdAt);
            return (
                createdAt >= todayStart &&
                createdAt <= todayEnd
            );
        })
        .reduce((sum, order) => {
            return sum + (Number(order.price) || 0);
        }, 0);

    const weeklyData = buildWeeklyData(
        weeklyOrdersRaw,
        monthStart,
        now
    );

    const totalActiveUsers =
        whatsappActiveUsers +
        messengerActiveUsers +
        instagramActiveUsers;

    const branchPerformance = branches.map((branch) => {
        const branchBookings = last7DaysBookings.filter(
            (booking) => booking.branchId === branch.id
        );
        const totalOrders = branchBookings.length;
        const totalSales = branchBookings.reduce((sum, booking) => {
            return sum + (Number(booking.price) || 0);
        }, 0);

        return {
            branchId: branch.id,
            branchName: branch.name,
            totalOrders,
            totalSales,
        };
    }).sort((a, b) => b.totalSales - a.totalSales || b.totalOrders - a.totalOrders);

    return {
        todayOrders,
        pendingDeliveries,
        todaysSales,
        activeUsers: {
            total: totalActiveUsers,
            whatsapp: whatsappActiveUsers,
            messenger: messengerActiveUsers,
            instagram: instagramActiveUsers,
        },
        weeklySales: weeklyData,
        branchPerformance,
        recentActivity,
    };
};

const buildWeeklyData = (
    orders,
    monthStart,
    now
) => {
    const weeks = [];
    let weekStart = new Date(monthStart);
    let weekNumber = 1;

    while (weekStart <= now) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(
            weekStart.getDate() + 6
        );
        weekEnd.setHours(
            23,
            59,
            59,
            999
        );

        const effectiveEnd =
            weekEnd > now ? now : weekEnd;

        const weekOrders = orders.filter(
            (order) => {
                const createdAt = new Date(
                    order.createdAt
                );

                return (
                    createdAt >= weekStart &&
                    createdAt <= effectiveEnd
                );
            }
        );

        const weekSales =
            weekOrders.reduce(
                (sum, order) =>
                    sum +
                    (Number(order.price) || 0),
                0
            );

        weeks.push({
            week: `Week ${weekNumber}`,
            orders: weekOrders.length,
            sales: weekSales,
        });

        weekStart = new Date(weekEnd);
        weekStart.setDate(
            weekStart.getDate() + 1
        );
        weekStart.setHours(
            0,
            0,
            0,
            0
        );

        weekNumber++;
    }

    return weeks;
};

export const DashboardOverviewBService = {
    getDashboardOverviewService,
};