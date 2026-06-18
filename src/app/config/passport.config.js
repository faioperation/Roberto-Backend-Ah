import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcrypt";
import prisma from "../prisma/client.js";
import { envVars } from "../config/env.js";

passport.use(
    new LocalStrategy(
        {
            usernameField: "email",
            passwordField: "password",
        },
        async (email, password, done) => {
            try {
                const user = await prisma.user.findUnique({
                    where: { email },
                    include: { roles: { include: { role: true } } },
                });

                if (!user) {
                    return done(null, false, { message: "Incorrect email." });
                }

                if (!user.passwordHash) {
                    return done(null, false, {
                        message: "Please login with your social account.",
                    });
                }

                const isMatch = await bcrypt.compare(password, user.passwordHash);

                if (!isMatch) {
                    return done(null, false, { message: "Incorrect password." });
                }

                if (!user.isVerified) {
                    return done(null, false, {
                        message: "User is not verified. Please verify your email.",
                    });
                }

                // Check business status for BUSINESS_OWNER and BRANCH_MANAGER roles
                const userRoleNames = user.roles?.map(r => r.role.name) || [];
                const isBusinessOwner = userRoleNames.includes("BUSINESS_OWNER");
                const isBranchManager = userRoleNames.includes("BRANCH_MANAGER");

                if (isBusinessOwner || isBranchManager) {
                    let business = null;
                    if (isBusinessOwner) {
                        business = await prisma.business.findFirst({
                            where: { ownerId: user.id }
                        });
                        // BUSINESS_OWNER can login even if INACTIVE (to purchase subscription)
                        // Block only if SUSPENDED or deleted
                        if (!business || business.deletedAt || business.status === "SUSPENDED") {
                            return done(null, false, {
                                message: "Your business account is suspended. Please contact the administrator.",
                            });
                        }
                    } else if (isBranchManager) {
                        const manager = await prisma.branchManager.findUnique({
                            where: { email: user.email }
                        });
                        if (manager) {
                            business = await prisma.business.findUnique({
                                where: { id: manager.businessId }
                            });
                        }
                        // BRANCH_MANAGER requires business to be ACTIVE
                        if (!business || business.deletedAt || business.status !== "ACTIVE") {
                            return done(null, false, {
                                message: "Your business account is suspended or inactive. Please contact the administrator.",
                            });
                        }
                    }
                }

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    )
);

passport.use(
    new GoogleStrategy(
        {
            clientID: envVars.GOOGLE_CLIENT_ID,
            clientSecret: envVars.GOOGLE_CLIENT_SECRET,
            callbackURL: envVars.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                const name = profile.displayName;
                const avatarUrl = profile.photos[0]?.value;

                let user = await prisma.user.findUnique({
                    where: { email },
                    include: { roles: { include: { role: true } } },
                });

                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            email,
                            firstName: name,
                            profilePicture: avatarUrl,
                            isVerified: true,
                            passwordHash: "", // Ensure it has a fallback or handle optional passwordHash
                            roles: {
                                create: {
                                    role: {
                                        connect: { name: "CUSTOMER" }
                                    }
                                }
                            }
                        },
                    });
                } else {
                    // Check business status for existing user if they are a BUSINESS_OWNER or BRANCH_MANAGER
                    const userRoleNames = user.roles?.map(r => r.role.name) || [];
                    const isBusinessOwner = userRoleNames.includes("BUSINESS_OWNER");
                    const isBranchManager = userRoleNames.includes("BRANCH_MANAGER");

                    if (isBusinessOwner || isBranchManager) {
                        let business = null;
                        if (isBusinessOwner) {
                            business = await prisma.business.findFirst({
                                where: { ownerId: user.id }
                            });
                            // BUSINESS_OWNER can login even if INACTIVE (to purchase subscription)
                            // Block only if SUSPENDED or deleted
                            if (!business || business.deletedAt || business.status === "SUSPENDED") {
                                return done(null, false, {
                                    message: "Your business account is suspended. Please contact the administrator.",
                                });
                            }
                        } else if (isBranchManager) {
                            const manager = await prisma.branchManager.findUnique({
                                where: { email: user.email }
                            });
                            if (manager) {
                                business = await prisma.business.findUnique({
                                    where: { id: manager.businessId }
                                });
                            }
                            // BRANCH_MANAGER requires business to be ACTIVE
                            if (!business || business.deletedAt || business.status !== "ACTIVE") {
                                return done(null, false, {
                                    message: "Your business account is suspended or inactive. Please contact the administrator.",
                                });
                            }
                        }
                    }
                }

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    )
);

// Optional: Serialize/Deserialize if sessions are used (not strictly needed for JWT but good to have)
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id }, include: { roles: { include: { role: true } } } });
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});
