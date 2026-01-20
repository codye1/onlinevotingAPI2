import { Request, Response } from 'express';
import UserService from '../service/UserService';
import bcrypt from 'bcrypt';
import Send from '../utils/Send';
import TokenService from '../service/TokenService';
import expireToNumber from '../utils/expireToNumber';
import jwtConfig from '../configs/jwtConfig';
class AuthController {
  static issueTokensAndSetRefreshCookie = async (
    res: Response,
    user: { id: string; email: string },
  ) => {
    const tokens = TokenService.generateToken({ userId: user.id, ...user });

    await TokenService.saveRefreshToken({
      userId: user.id,
      refreshToken: tokens.refreshToken,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      maxAge: expireToNumber(jwtConfig.refreshExpiresIn),
      sameSite: 'none',
      secure: true,
      domain: 'https://onlinevoting-api-2.vercel.app',
    });

    return tokens;
  };

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

      const { password: _password, ...safeNewUser } = newUser;

      const tokens = await AuthController.issueTokensAndSetRefreshCookie(
        res,
        safeNewUser,
      );

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
      const { password: _password, ...safeUser } = user;

      await TokenService.removeRefreshTokensByUserId(user.id);

      const tokens = await AuthController.issueTokensAndSetRefreshCookie(
        res,
        safeUser,
      );
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
      const { password: _password, ...safeUser } = user;

      const tokens = await AuthController.issueTokensAndSetRefreshCookie(
        res,
        safeUser,
      );

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
