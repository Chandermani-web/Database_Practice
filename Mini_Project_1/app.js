import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import cors from 'cors';

import AuthRoutes from './src/routes/auth.route.js';

dotenv.config();
const app = express();

app.use(cors({
    origin: "*",
    methods: ["GET","POST","PUT","DELETE","PATCH"],
    credentials: true
}));

app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());

app.use("/v1/api/auth", AuthRoutes);

export default app;