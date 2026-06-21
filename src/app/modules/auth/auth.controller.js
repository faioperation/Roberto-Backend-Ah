import DevBuildError from "../../lib/DevBuildError.js";
import { AuthService, forgotPasswordService } from "./auth.service.js";
import { OtpService } from "../otp/otp.service.js";
import jwt from "jsonwebtoken";
import { envVars } from "../../config/env.js";
import { createUserTokens } from "../../utils/userTokenGenerator.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { setAuthCookie } from "../../utils/setCookie.js";
import { StatusCodes } from "http-status-codes";
import passport from "passport";
import prisma from "../../prisma/client.js";

const credentialLogin = async (req, res, next) => {
  try {
    passport.authenticate("local", async (err, user, info) => {
      try {
        if (err) {
          return next(new DevBuildError(err, StatusCodes.UNAUTHORIZED));
        }

        if (!user) {
          return next(
            new DevBuildError(
              info?.message || "Authentication failed",
              StatusCodes.FORBIDDEN
            )
          );
        }

        // Generate access & refresh tokens
        const userToken = await createUserTokens(user);

        // Remove sensitive fields before sending user
        const { passwordHash, ...saveUser } = user;

        // Retrieve businessId and businessType for BUSINESS_OWNER or BRANCH_MANAGER
        const userRoleNames = user.roles?.map(r => r.role.name) || [];
        if (userRoleNames.includes("BUSINESS_OWNER")) {
          const business = await prisma.business.findFirst({
            where: { ownerId: user.id }
          });
          if (business) {
            saveUser.businessId = business.id;
            saveUser.businessType = business.businessType;
          }
        } else if (userRoleNames.includes("BRANCH_MANAGER")) {
          const manager = await prisma.branchManager.findUnique({
            where: { email: user.email },
            include: { branches: { select: { id: true } } }
          });
          if (manager) {
            saveUser.businessId = manager.businessId;
            saveUser.branchId = manager.branches?.[0]?.id || null;
            const business = await prisma.business.findUnique({
              where: { id: manager.businessId },
              select: { businessType: true }
            });
            if (business) {
              saveUser.businessType = business.businessType;
            }
          }
        }

        // Set cookies
        setAuthCookie(res, userToken);

        // Send response
        sendResponse(res, {
          success: true,
          message: "User logged in successfully",
          statusCode: StatusCodes.OK,
          data: {
            accessToken: userToken.accessToken,
            refreshToken: userToken.refreshToken,
            user: saveUser,
          },
        });
      } catch (innerError) {
        next(innerError);
      }
    })(req, res, next);
  } catch (error) {
    next(error);
  }
};

// ✅ Refresh Token

const getNewAccessToken = async (req, res, next) => {
  try {
    // const prisma = req.app.get("prisma"); // REMOVED
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new DevBuildError(
        "No refresh token received from cookies",
        StatusCodes.BAD_REQUEST
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, envVars.JWT_REFRESH_TOKEN);
    } catch (err) {
      throw new DevBuildError("Invalid refresh token", StatusCodes.FORBIDDEN);
    }

    const user = await AuthService.findById(prisma, decoded.id);

    if (!user) {
      throw new DevBuildError("User not found", StatusCodes.NOT_FOUND);
    }

    if (!user.isVerified) {
      throw new DevBuildError(
        "User is not verified. Please verify your email.",
        StatusCodes.FORBIDDEN
      );
    }

    // Check business status for BUSINESS_OWNER and BRANCH_MANAGER roles
    const userRoleNames = user.roles?.map(r => r.role.name) || [];
    const isBusinessOwner = userRoleNames.includes("BUSINESS_OWNER");
    const isBranchManager = userRoleNames.includes("BRANCH_MANAGER");

    if (isBusinessOwner || isBranchManager) {
      if (isBusinessOwner) {
        const business = await prisma.business.findFirst({
          where: { ownerId: user.id }
        });
        // BUSINESS_OWNER can refresh token even if INACTIVE (to purchase subscription)
        // Block only if SUSPENDED or deleted
        if (!business || business.deletedAt || business.status === "SUSPENDED") {
          throw new DevBuildError(
            "Your business account is suspended. Please contact the administrator.",
            StatusCodes.FORBIDDEN
          );
        }
      } else if (isBranchManager) {
        const manager = await prisma.branchManager.findUnique({
          where: { email: user.email }
        });
        let business = null;
        if (manager) {
          business = await prisma.business.findUnique({
            where: { id: manager.businessId }
          });
        }
        // BRANCH_MANAGER requires business to be ACTIVE
        if (!business || business.deletedAt || business.status !== "ACTIVE") {
          throw new DevBuildError(
            "Your business account is suspended or inactive. Please contact the administrator.",
            StatusCodes.FORBIDDEN
          );
        }
      }
    }

    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, roles: user.roles ? user.roles.map(r => r.role.name) : [] },
      envVars.JWT_SECRET_TOKEN,
      { expiresIn: envVars.JWT_EXPIRES_IN }
    );

    setAuthCookie(res, {
      accessToken: newAccessToken,
      refreshToken,
    });

    sendResponse(res, {
      success: true,
      message: "New access token retrieved successfully",
      statusCode: StatusCodes.OK,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    sendResponse(res, {
      success: true,
      message: "User logged out successfully",
      statusCode: StatusCodes.OK,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    // const prisma = req.app.get("prisma"); // REMOVED
    const { email } = req.body;

    if (!email) {
      return sendResponse(res, {
        success: false,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Email is required",
        data: null,
      });
    }

    await forgotPasswordService(prisma, email);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Forgot password OTP sent successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const verifyForgotPasswordOtp = async (req, res, next) => {
  try {
    // const prisma = req.app.get("prisma"); // REMOVED
    const { email, otp } = req.body;

    if (!email || !otp) {
      return sendResponse(res, {
        success: false,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Email and OTP are required",
        data: null,
      });
    }

    const resetToken = await OtpService.verifyForgotPasswordOtp(prisma, email, otp);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "OTP verified successfully",
      data: { resetToken },
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { newPassword } = req.body;

    if (!newPassword) {
      return sendResponse(res, {
        success: false,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "newPassword is required",
        data: null,
      });
    }

    const payload = { id, newPassword };

    await AuthService.resetPassword(payload);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Password reset successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const googleCallback = async (req, res, next) => {
  try {
    let redirectTo = req.query.state ? String(req.query.state) : "";

    // Prevent open redirect issues
    if (redirectTo.startsWith("/")) {
      redirectTo = redirectTo.slice(1);
    }

    const user = req.user; // comes from Passport Google Strategy

    if (!user) {
      throw new DevBuildError("User not found", StatusCodes.NOT_FOUND);
    }

    // Generate tokens
    const tokenInfo = await createUserTokens(user);

    // Set auth cookies
    setAuthCookie(res, tokenInfo);

    // Redirect to frontend
    res.redirect(`${envVars.FRONT_END_URL}/${redirectTo}`);
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw new DevBuildError(
        "Both oldPassword and newPassword are required",
        StatusCodes.BAD_REQUEST
      );
    }

    await AuthService.changePassword(id, oldPassword, newPassword);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Password changed successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const getGoogleUrl = async (req, res, next) => {
  try {
    const redirect = req.query.redirect || "/";
    const baseUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const params = new URLSearchParams({
      client_id: envVars.GOOGLE_CLIENT_ID,
      redirect_uri: envVars.GOOGLE_CALLBACK_URL,
      response_type: "code",
      scope: "profile email",
      state: redirect,
      access_type: "offline",
      prompt: "consent",
    });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Google login URL retrieved successfully",
      data: {
        url: `${baseUrl}?${params.toString()}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const AuthController = {
  credentialLogin,
  getNewAccessToken,
  logout,
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
  googleCallback,
  changePassword,
  getGoogleUrl,
};
