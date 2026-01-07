import { Request, Response } from 'express';
import UserService from '../service/UserService';
import bcrypt from 'bcrypt';
import Send from '../utils/Send';
import TokenService from '../service/TokenService';
import expireToNumber from '../utils/expireToNumber';
import jwtConfig from '../configs/jwtConfig';
class AuthController {
  static register = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
      const user = await UserService.getUserByEmail(email);
      if (user) return Send.badRequest(res, null, 'User already exists', 409);
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await UserService.createUser({
        email,
        password: hashedPassword,
      });

      const { password: _password, id: userId, ...safeNewUser } = newUser;

      const tokens = TokenService.generateToken({ userId, ...safeNewUser });
      await TokenService.saveRefreshToken({
        userId: newUser.id,
        refreshToken: tokens.refreshToken,
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24h
        sameSite: 'strict',
      });

      return Send.success(
        res,
        { accessToken: tokens.accessToken },
        'User registered successfully',
      );
    } catch (error) {
      console.error('Registration error:', error);
      return Send.error(res, null, 'Unexpected error occurred');
    }
  };

  static login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
      const user = await UserService.getUserByEmail(email);
      if (!user) return Send.notFound(res, null, 'User not found');
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid)
        return Send.unauthorized(res, null, 'Invalid credentials');
      // Exclude password from user object and rename id to userId
      const { password: _password, id: userId, ...safeUser } = user;

      await TokenService.removeRefreshTokensByUserId(user.id);

      const tokens = TokenService.generateToken({ userId, ...safeUser });
      await TokenService.saveRefreshToken({
        userId: user.id,
        refreshToken: tokens.refreshToken,
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: expireToNumber(jwtConfig.refreshExpiresIn),
        sameSite: 'strict',
      });

      return Send.success(
        res,
        { accessToken: tokens.accessToken, user: safeUser },
        'Login successful',
      );
    } catch (error) {
      console.error('Login error:', error);
      return Send.error(res, null, 'Unexpected error occurred');
    }
  };
  static logout = async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken)
        return Send.badRequest(res, null, 'No refresh token provided');
      await TokenService.removeRefreshToken(refreshToken);

      res.clearCookie('refreshToken');
      return Send.success(res, null, 'Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      return Send.error(res, null, 'Unexpected error occurred');
    }
  };
  static refreshToken = async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken)
        return Send.unauthorized(res, null, 'No refresh token provided');
      const tokenData = TokenService.verifyRefreshToken(refreshToken);
      const savedToken = await TokenService.findRefreshToken(refreshToken);
      if (!savedToken)
        return Send.unauthorized(res, null, 'Invalid refresh token');

      const user = await UserService.getUserById(tokenData.userId);
      if (!user) return Send.notFound(res, null, 'User not found');
      await TokenService.removeRefreshToken(refreshToken);

      // Exclude password from user object and rename id to userId
      const { password: _password, id: userId, ...safeUser } = user;
      const tokens = TokenService.generateToken({ userId, ...safeUser });

      await TokenService.saveRefreshToken({
        userId: user.id,
        refreshToken: tokens.refreshToken,
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: expireToNumber(jwtConfig.refreshExpiresIn),
        sameSite: 'strict',
      });
      return Send.success(
        res,
        { accessToken: tokens.accessToken },
        'Token refreshed successfully',
      );
    } catch (error) {
      console.error('Refresh token error:', error);

      if (
        error instanceof Error &&
        (error.name === 'TokenExpiredError' ||
          error.name === 'JsonWebTokenError' ||
          error.name === 'NotBeforeError')
      ) {
        return Send.unauthorized(res, null, 'Invalid or expired refresh token');
      }

      return Send.error(res, null, 'Unexpected error occurred');
    }
  };
}

export default AuthController;
