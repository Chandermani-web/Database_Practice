import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cookieParser());

// DB Connection
const db = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE, // ✅ BEST
});

console.log("MySQL connected");

// Create & use database
// await db.execute(`USE ${process.env.MYSQL_DATABASE}`);

// Signup API
app.post("/v1/api/auth/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: "All fields required" });
    }

    const [existingUser] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, role]
    );

    const userId = result.insertId;

    const accessToken = jwt.sign(
      { id: userId },
      process.env.JWT_ACCESS_TOKEN,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { id: userId },
      process.env.JWT_REFRESH_TOKEN,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );

    // ✅ HASH refresh token
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    // ✅ SAVE refresh token in same row
    await db.execute(
      "UPDATE users SET refreshtoken = ? WHERE id = ?",
      [hashedRefreshToken, userId]
    );

    res.cookie("REFRESHTOKEN", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "User registered successfully",
      accessToken,
      user: { id: userId, username, email },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});


// login API
app.post("/v1/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    const [users] = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const accessToken = jwt.sign(
      { id: user.id },
      process.env.JWT_ACCESS_TOKEN,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_TOKEN,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );

    // ✅ HASH & UPDATE refresh token
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await db.execute(
      "UPDATE users SET refreshtoken = ? WHERE id = ?",
      [hashedRefreshToken, user.id]
    );

    res.cookie("REFRESHTOKEN", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// app.get('/v1/api/get/alluser', async (req,res,next) => {
//     try{
//         const refreshtoken = req.cookies.REFRESHTOKEN;
//         console.log(refreshtoken)

//         if(!refreshtoken) return res.status(403).json({ message: "No refresh token!" })

//         const decoded = jwt.verify(refreshtoken, process.env.JWT_REFRESH_TOKEN);
//         console.log(decoded)

//         if(!decoded) return res.status(403).json({ message: "Invalid refresh token" });

//         const [checkUser] = await db.execute(
//             "SELECT * FROM users WHERE insertId = ?",
//             [decoded.id]
//         );
//         console.log(checkUser);

//         const User = checkUser[0];

//         req.user = User;
//         next();
//     } catch (err) {
//         return res.status(501).json({ message: "Internal server error" });
//     }
// } , async (req,res) => {
//     try{
//         const { role } = req.user;

//         if(!role == "super_admin") return res.status(403).json({ message: "you are not valid for this operation" });

//         const [result] = await db.execute("SELECT * FROM users")

//         return res.status(200).json({
//             message: "All user data retrieve successfully",
//             data: result
//         })
//     } catch (err) {
//         console.log(err);
//         return res.status(500).json({ message: "Internal Server Error" });
//     }
// })

const verifyRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.REFRESHTOKEN;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_TOKEN
    );

    const [users] = await db.execute(
      "SELECT * FROM users WHERE id = ?",
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = users[0];

    // ✅ compare refresh token with hashed one in DB
    const isValid = await bcrypt.compare(
      refreshToken,
      user.refreshtoken
    );

    if (!isValid) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    req.user = user;
    next();

  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

app.get(
  "/v1/api/get/alluser",
  verifyRefreshToken,
  async (req, res) => {
    try {
      const { role } = req.user;

      if (role !== "super_admin") {
        return res
          .status(403)
          .json({ message: "Access denied" });
      }

      const [users] = await db.execute(
        "SELECT id, username, email, password, role, refreshtoken FROM users"
      );

      return res.status(200).json({
        message: "All users fetched successfully",
        data: users,
      });

    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Internal Server Error" });
    }
  }
);

export default app;
