import * as jwt from 'jsonwebtoken';
import { InternalServerErrorException } from '@nestjs/common';

const jwtSecret = process.env.JWT_SECRET as string;
const jwtAccessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN as string;
const jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN as string;

interface IPayload {
  id: string;
}

export const createAccessToken = (id: string): string => {
  try {
    return jwt.sign({ id }, jwtSecret, {
      expiresIn: jwtAccessExpiresIn,
    } as jwt.SignOptions);
  } catch {
    throw new InternalServerErrorException('Internal server error');
  }
};

export const createRefreshToken = (id: string): string => {
  try {
    return jwt.sign({ id }, jwtSecret, {
      expiresIn: jwtRefreshExpiresIn,
    } as jwt.SignOptions);
  } catch {
    throw new InternalServerErrorException('Internal server error');
  }
};

export const verifyToken = (token: string): string => {
  try {
    const payload = jwt.verify(token, jwtSecret) as IPayload;
    return payload.id;
  } catch {
    throw new InternalServerErrorException('Invalid token');
  }
};
