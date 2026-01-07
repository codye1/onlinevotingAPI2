import { SignOptions } from 'jsonwebtoken';
import getEnvOrThrow from '../utils/getEnvOrThrow';

const jwtConfig = {
  accessSecret: getEnvOrThrow('JWT_ACCESS_SECRET'),
  refreshSecret: getEnvOrThrow('JWT_REFRESH_SECRET'),
  accessExpiresIn:
    (getEnvOrThrow('JWT_ACCESS_EXPIRES_IN') as SignOptions['expiresIn']) ||
    '15m',
  refreshExpiresIn: (getEnvOrThrow('JWT_REFRESH_EXPIRES_IN') ||
    '30d') as SignOptions['expiresIn'],
};

export default jwtConfig;
