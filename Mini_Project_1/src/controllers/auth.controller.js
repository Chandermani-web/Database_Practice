import bcrypt, { hash } from "bcrypt";
import { ACCESSTOKEN, REFRESHTOKEN } from "../utils/Token.js";
import { db } from "../database/Database.js";

export const signup = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role)
      return res.status(403).json({
        message: "Username, Email, Password, and Role must be required",
      });

    const [existingUser] = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [email],
    );

    if (existingUser.length > 0)
      return res.status(403).json({ message: "User is already exist!" });

    const hashPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashPassword, role],
    );

    const userId = result.insertId;

    const accesstoken = ACCESSTOKEN(userId);
    const refreshtoken = REFRESHTOKEN(userId);

    const hashRefreshToken = await bcrypt.hash(refreshtoken, 10);

    await db.execute(
        "UPDATE users SET refreshtoken = ? WHERE id = ?",
        [hashRefreshToken, userId]
    )

    res.cookie("mini_project_1_refreshtoken", refreshtoken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
        message: "User Registered Successfully",
        accesstoken,
        data: {
            id: userId,
            username: username,
            password: hashPassword,
            email: email,
            refreshtoken: refreshtoken,
            role: role
        }
    });
  } catch (error) {
    return res
      .status(500)
      .json({ 
            message: "Internal Server Error",
            error: error.message 
      });
  }
};

export const login = async (req, res) => {
    try{
        const { email, password } = req.body;

        if(!email || !password) return res.status(403).json({
            message: "Email and Password must be required",
            success: false,
        })

        const [existingUser] = await db.execute(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if(existingUser.length !== 0) return res.status(403).json({
            message: "User not found",
            success: false
        });

        const user = existingUser[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) return res.status(403).json({
            message: "Password is incorrect",
            success: false
        });

        const accesstoken = ACCESSTOKEN(user.id);
        const refreshtoken = REFRESHTOKEN(user.id);

        const hashedRefreshToken = await bcrypt.hash(refreshtoken, 10);

        await db.execute(
            "UPDATE users SET refreshtoken = ? WHERE email = ?",
            [hashedRefreshToken, email]
        );

        res.cookie("mini_project_1_refreshtoken", refreshtoken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(201).json({
            message: "Login successfully",
            accesstoken,
            data : {
                id: user.id,
                username: user.username,
                email: user.email,
                password: user.password,
                role: user.role,
                refreshtoken: user.refreshtoken
            }
        })

    } catch (error) {
        return res
            .status(500)
            .json({
                message: "Internal Server Error",
                error: error.message
            })
    }
}