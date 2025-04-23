import * as jwt from 'jsonwebtoken';
import { InternalServerErrorException } from '@nestjs/common';

const jwtSecret = process.env.JWT_SECRET as string;
const jwtAccessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN as string;
const jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN as string;

interface IPayload {
  id: string;
}

export const createAccessToken = (id: string) => {
  try {
    return jwt.sign(
      {
        id,
      },
      jwtSecret,
      {
        expiresIn: jwtAccessExpiresIn,
      },
    );
  } catch (error) {
    console.log(error);
    throw new InternalServerErrorException('Internal server error');
  }
};

export const createRefreshToken = (id: string) => {
  try {
    return jwt.sign(
      {
        id,
      },
      jwtSecret,
      {
        expiresIn: jwtRefreshExpiresIn,
      },
    );
  } catch (error) {
    console.log(error);
    throw new InternalServerErrorException('Internal server error');
  }
};

export const verifyToken = (token: string) => {
  const payload = jwt.verify(token, jwtSecret) as IPayload;

  return payload.id;
};
