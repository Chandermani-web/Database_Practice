import { db } from "../database/Database.js";

export const profile = async (req, res) => {
    try{
        const userId = req.userId;
        const { fullname, address, phoneno, bio, dob, hobbies, linkedin, github, portfolio } = req.body;

        const [existingProfile] = await db.execute(
            "SELECT * FROM profile WHERE user_id = ?",
            [userId]
        );

        if(existingProfile.length > 0){
            await db.execute(
                "UPDATE profile SET fullname = ?, address = ?, phoneno = ?, bio = ?, dob = ?, hobbies = ?, linkedin = ?, github = ?, portfolio = ? WHERE user_id = ?",
                [fullname, address, phoneno, bio, dob, hobbies, linkedin, github, portfolio, userId]
            );
            return res.status(200).json({
                message: "Profile updated successfully",
                success: true,
            });
        } else {
            await db.execute(
                "INSERT INTO profile (user_id, fullname, address, phoneno, bio, dob, hobbies, linkedin, github, portfolio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [userId, fullname, address, phoneno, bio, dob, hobbies, linkedin, github, portfolio]
            );
            return res.status(201).json({
                message: "Profile created successfully",
                success: true,
            });
        }
    }catch(error){
        return res.status(500).json({
            message: error.message  
        });
    }
}