import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import jwtConfig from '../configs/jwtConfig';

class TokenService {
  static generateToken = (payload: string | object | Buffer) => {
    const accessToken = jwt.sign(payload, jwtConfig.accessSecret, {
      expiresIn: jwtConfig.accessExpiresIn,
      jwtid: randomUUID(),
    });
    const refreshToken = jwt.sign(payload, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiresIn,
      jwtid: randomUUID(),
    });
    return {
      accessToken,
      refreshToken,
    };
  };

  static verifyAccessToken = (token: string) => {
    const payload = jwt.verify(token, jwtConfig.accessSecret) as {
      userId: string;
    };
    return { userId: payload.userId };
  };

  static verifyRefreshToken = (token: string) => {
    const payload = jwt.verify(token, jwtConfig.refreshSecret) as {
      userId: string;
    };
    return { userId: payload.userId };
  };

  static saveRefreshToken = async (data: {
    userId: string;
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

  static removeRefreshTokensByUserId = async (userId: string) => {
    const tokens = await prisma.refreshToken.deleteMany({
      where: { userId },
    });
    return tokens;
  };

  static findRefreshToken = async (refreshToken: string) => {
    const token = await prisma.refreshToken.findUnique({
      where: { refreshToken },
    });
    return token;
  };
}

export default TokenService;
