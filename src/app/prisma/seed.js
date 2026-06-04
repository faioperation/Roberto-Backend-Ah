import prisma from "./client.js";
import bcrypt from "bcrypt";
import { envVars } from "../config/env.js";

export const seedDatabase = async () => {
  try {
    const ownerEmail = "system@admin.com";
    
    // Check if seed data already exists
    const existingOwner = await prisma.user.findUnique({
      where: { email: ownerEmail },
    });

    if (existingOwner) {
      console.log("Primary seed data already exists, checking for new seed updates...");
    }
    console.log("--- Starting seed process ---");

    // Seed Permissions
    const permissionsData = [
      { name: "MANAGE_USERS", description: "Can manage users" },
      { name: "MANAGE_ROLES", description: "Can manage roles and permissions" },
      { name: "MANAGE_BUSINESS", description: "Can manage businesses" },
      { name: "VIEW_DASHBOARD", description: "Can view system dashboard" },
    ];

    const createdPermissions = [];
    for (const perm of permissionsData) {
      const p = await prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: perm,
      });
      createdPermissions.push(p);
    }

    // Seed Roles
    const rolesData = [
      { name: "SYSTEM_OWNER", description: "System Owner Role" },
      { name: "BUSINESS_OWNER", description: "Business Owner Role" },
      { name: "BRANCH_MANAGER", description: "Branch Manager Role" },
      { name: "CUSTOMER", description: "Customer Role" },
    ];

    const createdRoles = {};
    for (const role of rolesData) {
      const r = await prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role,
      });
      createdRoles[role.name] = r;
    }

    // Attach all permissions to SYSTEM_OWNER role
    const systemOwnerRole = createdRoles["SYSTEM_OWNER"];
    for (const p of createdPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: systemOwnerRole.id,
            permissionId: p.id,
          },
        },
        update: {},
        create: {
          roleId: systemOwnerRole.id,
          permissionId: p.id,
        },
      });
    }

    // Seed System Owner User
    const passwordHash = await bcrypt.hash(
      "11",
      Number(envVars?.BCRYPT_SALT_ROUND || 10)
    );
    
    if (!existingOwner) {
      const owner = await prisma.user.create({
        data: {
          email: ownerEmail,
          passwordHash,
          firstName: "System",
          lastName: "Owner",
          status: "ACTIVE",
          isVerified: true,
        },
      });

      await prisma.userRole.create({
        data: {
          userId: owner.id,
          roleId: systemOwnerRole.id,
        },
      });

      console.log("Primary seed created successfully");
    }

    // Seed new users as requested
    const newPasswordHash = await bcrypt.hash(
      "123456",
      Number(envVars?.BCRYPT_SALT_ROUND || 10)
    );

    const usersToSeed = [
      { email: "systemowner@test.com", firstName: "System", lastName: "Owner", roleName: "SYSTEM_OWNER" },
      { email: "businessowner@test.com", firstName: "Business", lastName: "Owner", roleName: "BUSINESS_OWNER" }
    ];

    for (const u of usersToSeed) {
      let existingUser = await prisma.user.findUnique({ where: { email: u.email } });
      if (!existingUser) {
        const createdUser = await prisma.user.create({
          data: {
            email: u.email,
            passwordHash: newPasswordHash,
            firstName: u.firstName,
            lastName: u.lastName,
            status: "ACTIVE",
            isVerified: true,
          },
        });
        await prisma.userRole.create({
          data: {
            userId: createdUser.id,
            roleId: createdRoles[u.roleName].id,
          },
        });
        console.log(`Seeded user ${u.email}`);
      }
    }
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
};
