import { envVars } from "../config/env.js";
import { AppError } from "../errorHelper/appError.js";

export const publicApiAuth = (req, res, next) => {
  try {
    const token = req.headers["x-api-token"];

    if (!token) {
      throw new AppError(401, "API token is required in the x-api-token header.");
    }

    if (token !== envVars.PUBLIC_API_TOKEN) {
      throw new AppError(401, "Invalid API token.");
    }

    next();
  } catch (error) {
    next(error);
  }
};
