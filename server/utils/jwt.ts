require("dotenv").config();
import { Response } from "express";
import { IUser } from "../models/user.model";
import { redis } from "./redis";

interface ITokenOptions {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | undefined;
  secure?: boolean;
}

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();

  //upload session to redis
  //redis.set(user._id, JSON.stringify(user) as any);
  redis.set(String(user._id), JSON.stringify(user));

  //parse environment variables to integrate with fallback values
  const accessTokenExpired = parseInt(
    process.env.ACCESS_TOKEN_EXPIRED || "300",
    10
  );
  const refreshTokenExpired = parseInt(
    process.env.REFRESH_TOKEN_EXPIRED || "1200",
    10
  );

  // cookies options
  const accessTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + accessTokenExpired * 1000),
    maxAge: accessTokenExpired * 1000,
    httpOnly: true,
    sameSite: "lax",
  };

  const refreshTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpired * 1000),
    maxAge: refreshTokenExpired * 1000,
    httpOnly: true,
    sameSite: "lax",
  };

  // Only set secure to true in production
  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
  }

  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);

  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};
