import app from "./app.js";
import dotenv from 'dotenv';
import { db } from "./src/database/Database.js";

dotenv.config();

const port = process.env.PORT || 8000;

if(db) console.log(`MySQL connected successfully!`);
app.listen(port, ()=>{
    console.log(`Server is running on port: http://localhost:${port}`);
});