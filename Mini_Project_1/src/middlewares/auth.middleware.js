import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const loggedIn = async (req, res, next) => {
  const refreshtoken = req.cookies.mini_project_1_refreshtoken;

  if (!refreshtoken)
    return res.status(401).json({
      message: "You are not logged in",
      success: false,
    });

  try {
    const decoded = jwt.verify(refreshtoken, process.env.JWT_REFRESH_SECRET_KEY);
    if(!decoded.id) {
      return res.status(401).json({
        message: "Invalid refresh token",
        success: false,
      });
    }
    console.log(decoded);
    req.userId = decoded.id;
  } catch (error) {
    return res.status(501).json({
      message: "Invalid refresh token",
      success: false,
    });
  }
  next();
};
