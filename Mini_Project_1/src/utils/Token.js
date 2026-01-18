import jwt from 'jsonwebtoken';

export const ACCESSTOKEN = (id) => {
    const token = jwt.sign({ id:id }, process.env.JWT_ACCESS_SECRET_KEY, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "1h"
    });
    return token;
};

export const REFRESHTOKEN = (id) => {
    const token = jwt.sign({ id:id }, process.env.JWT_REFRESH_SECRET_KEY, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "1h"
    });
    return token;
};