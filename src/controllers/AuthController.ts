import { Request, Response } from 'express';
import UserService from '../service/UserService';
import bcrypt from 'bcrypt';
import Send from '../utils/Send';
import TokenService from '../service/TokenService';
class AuthController {
  static register = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    console.log('Register request body:', req.body);
    try {
      const user = await UserService.getUserByEmail(email);
      if (user) return Send.error(res, null, 'User already exists');

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await UserService.createUser({
        email,
        password: hashedPassword,
      });

      const tokens = TokenService.generateToken({
        userId: newUser.id,
        email: newUser.email,
      });
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

      const tokens = TokenService.generateToken({
        userId: user.id,
        email: user.email,
      });
      await TokenService.saveRefreshToken({
        userId: user.id,
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
        { accessToken: tokens.accessToken, user },
        'Login successful',
      );
    } catch (error) {
      console.error('Login error:', error);
      return Send.error(res, null, 'Unexpected error occurred');
    }
  };
  static logout = (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken)
        return Send.badRequest(res, null, 'No refresh token provided');
      TokenService.removeRefreshToken(refreshToken);
      res.clearCookie('accessToken');
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
      console.log(refreshToken);
      const savedToken = await TokenService.findRefreshToken(refreshToken);
      if (!savedToken)
        return Send.unauthorized(res, null, 'Invalid refresh token');
      console.log(savedToken);
      const user = await UserService.getUserById(tokenData.userId);
      if (!user) return Send.notFound(res, null, 'User not found');
      await TokenService.removeRefreshToken(refreshToken);
      console.log('Generating new tokens for user:', user.id, user.email);
      const tokens = TokenService.generateToken({
        userId: user.id,
        email: user.email,
      });

      await TokenService.saveRefreshToken({
        userId: user.id,
        refreshToken: tokens.refreshToken,
      });
      console.log('New tokens generated and saved for user:', user.id);

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24h
        sameSite: 'strict',
      });
      return Send.success(
        res,
        { accessToken: tokens.accessToken },
        'Token refreshed successfully',
      );
    } catch (error) {
      console.error('Refresh token error:', error);
      return Send.error(res, null, 'Unexpected error occurred');
    }
  };
}

export default AuthController;
