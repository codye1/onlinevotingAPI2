import { randomUUID } from 'node:crypto';
import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';
import getEnvOrThrow from '../utils/getEnvOrThrow';
import { prisma } from '../lib/prisma';

class TokenService {
  static generateToken = (payload: string | object | Buffer) => {
    const accessSecret = getEnvOrThrow('JWT_ACCESS_SECRET') as Secret;
    const accessExpiresIn = getEnvOrThrow(
      'JWT_ACCESS_EXPIRES_IN',
    ) as SignOptions['expiresIn'];

    const refreshSecret = getEnvOrThrow('JWT_REFRESH_SECRET') as Secret;
    const refreshExpiresIn = getEnvOrThrow(
      'JWT_REFRESH_EXPIRES_IN',
    ) as SignOptions['expiresIn'];

    const accessToken = jwt.sign(payload, accessSecret, {
      expiresIn: accessExpiresIn,
      jwtid: randomUUID(),
    });
    const refreshToken = jwt.sign(payload, refreshSecret, {
      expiresIn: refreshExpiresIn,
      jwtid: randomUUID(),
    });
    return {
      accessToken,
      refreshToken,
    };
  };

  static verifyAccessToken = (token: string) => {
    const accessSecret = getEnvOrThrow('JWT_ACCESS_SECRET') as Secret;
    return jwt.verify(token, accessSecret) as { userId: number };
  };
  static verifyRefreshToken = (token: string) => {
    const refreshSecret = getEnvOrThrow('JWT_REFRESH_SECRET') as Secret;
    return jwt.verify(token, refreshSecret) as { userId: number };
  };

  static saveRefreshToken = async (data: {
    userId: number;
    refreshToken: string;
  }) => {
    const token = await prisma.refreshToken.create({
      data,
    });
    return token;
  };

  static removeRefreshToken = async (refreshToken: string) => {
    const token = await prisma.refreshToken.deleteMany({
      where: { refreshToken },
    });
    return token;
  };
  static findRefreshToken = async (refreshToken: string) => {
    const token = await prisma.refreshToken.findUnique({
      where: { refreshToken },
    });
    return token;
  };
}

export default TokenService;
