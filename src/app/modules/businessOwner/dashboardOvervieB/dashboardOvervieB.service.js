import prisma from "../../../prisma/client.js";

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

    const [
        todayOrders,
        recentActivity,
        whatsappActiveUsers,
        messengerActiveUsers,
        instagramActiveUsers,
        weeklyOrdersRaw,
    ] = await Promise.all([
        prisma.orderBooking.count({
            where: {
                businessId,
                createdAt: {
                    gte: todayStart,
                    lte: todayEnd,
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

        prisma.orderBooking.findMany({
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
    ]);

    const totalSales = weeklyOrdersRaw.reduce((sum, order) => {
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

    return {
        todayOrders,
        pendingDeliveries: 0,
        todaysSales: totalSales,
        activeUsers: {
            total: totalActiveUsers,
            whatsapp: whatsappActiveUsers,
            messenger: messengerActiveUsers,
            instagram: instagramActiveUsers,
        },
        weeklySales: weeklyData,
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