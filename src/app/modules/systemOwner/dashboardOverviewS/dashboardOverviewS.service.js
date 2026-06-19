import prisma from "../../../prisma/client.js";

const getDashboardOverviewService = async (query = {}) => {
    // 1. Active Users Count
    const activeUsers = await prisma.user.count({
        where: {
            status: "ACTIVE",
        },
    });

    // 2. Recent Activity (latest logs)
    const recentActivity = await prisma.activityLog.findMany({
        orderBy: {
            createdAt: "desc",
        },
        take: 10,
        include: {
            createdBy: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });

    // 3. Top Performing Sectors (filter-wise & category percentage)
    const { timeframe } = query;
    let dateFilter = {};
    const now = new Date();

    if (timeframe === "today") {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = { createdAt: { gte: startOfToday } };
    } else if (timeframe === "weekly") {
        const startOfPrevWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { createdAt: { gte: startOfPrevWeek } };
    } else if (timeframe === "monthly") {
        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        dateFilter = { createdAt: { gte: startOfPrevMonth } };
    } else if (timeframe === "yearly") {
        const startOfPrevYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        dateFilter = { createdAt: { gte: startOfPrevYear } };
    }

    const businessesForSectors = await prisma.business.findMany({
        select: {
            id: true,
            industry: true,
            orderBookings: {
                where: dateFilter,
                select: { id: true },
            },
            appointmentBookings: {
                where: dateFilter,
                select: { id: true },
            },
            parcelDeliveries: {
                where: dateFilter,
                select: { id: true },
            },
        },
    });

    const sectorBookings = {};
    let totalAllBookings = 0;

    for (const bus of businessesForSectors) {
        const industry = bus.industry || "Other";
        const bookingCount =
            (bus.orderBookings?.length || 0) +
            (bus.appointmentBookings?.length || 0) +
            (bus.parcelDeliveries?.length || 0);

        sectorBookings[industry] = (sectorBookings[industry] || 0) + bookingCount;
        totalAllBookings += bookingCount;
    }

    let topPerformingSectors = [];
    if (totalAllBookings > 0) {
        topPerformingSectors = Object.keys(sectorBookings)
            .map((sector) => {
                const count = sectorBookings[sector];
                const percentage = (count / totalAllBookings) * 100;
                return {
                    sector,
                    count,
                    percentage: Math.round(percentage * 100) / 100,
                };
            })
            .sort((a, b) => b.count - a.count);
    } else {
        // Fallback to business count per sector/industry
        const sectorBusCount = {};
        let totalBus = 0;
        for (const bus of businessesForSectors) {
            const industry = bus.industry || "Other";
            sectorBusCount[industry] = (sectorBusCount[industry] || 0) + 1;
            totalBus++;
        }
        topPerformingSectors = Object.keys(sectorBusCount)
            .map((sector) => {
                const count = sectorBusCount[sector];
                const percentage = totalBus > 0 ? (count / totalBus) * 100 : 0;
                return {
                    sector,
                    count,
                    percentage: Math.round(percentage * 100) / 100,
                };
            })
            .sort((a, b) => b.count - a.count);
    }

    // 4. Business Distribution (category-wise percentage)
    const totalBusinesses = await prisma.business.count();
    const distribution = await prisma.business.groupBy({
        by: ["businessType"],
        _count: {
            id: true,
        },
    });

    const businessDistribution = distribution.map((item) => {
        const category = item.businessType || "OTHER";
        const count = item._count.id;
        const percentage = totalBusinesses > 0 ? (count / totalBusinesses) * 100 : 0;
        return {
            category,
            count,
            percentage: Math.round(percentage * 100) / 100,
        };
    });

    // 5. Platform Revenue (total paid invoices count)
    const totalRevenueResult = await prisma.subscriptionInvoice.aggregate({
        where: {
            status: "paid",
        },
        _sum: {
            amount: true,
        },
    });
    const platformRevenue = Math.round((totalRevenueResult._sum.amount || 0) * 100) / 100;

    // 6. Monthly Revenue (paid invoices in current month)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenueResult = await prisma.subscriptionInvoice.aggregate({
        where: {
            status: "paid",
            createdAt: {
                gte: startOfMonth,
            },
        },
        _sum: {
            amount: true,
        },
    });
    const monthlyRevenue = Math.round((monthlyRevenueResult._sum.amount || 0) * 100) / 100;

    // 7. Active Subscriptions Count
    const activeSubscriptions = await prisma.businessSubscription.count({
        where: {
            status: "ACTIVE",
        },
    });

    // 8. Total Businesses Count
    const totalBusinessesCount = totalBusinesses;

    return {
        activeUsers,
        recentActivity,
        topPerformingSectors,
        businessDistribution,
        platformRevenue,
        monthlyRevenue,
        activeSubscriptions,
        totalBusinesses: totalBusinessesCount,
    };
};

export const DashboardOverviewSService = {
    getDashboardOverviewService,
};
