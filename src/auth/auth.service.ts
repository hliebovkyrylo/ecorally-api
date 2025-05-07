import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SignUpDto } from './dto/sign-up.dto';
import * as bcrypt from 'bcrypt';
import {
  createAccessToken,
  createRefreshToken,
  verifyToken,
} from '../utils/tokens.util';
import { SignInDto } from './dto/sign-in.dto';
import { JsonWebTokenError } from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async signUp(data: SignUpDto) {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 8);
      const name = data.email.split('@')[0];

      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          name,
          password: hashedPassword,
        },
      });

      const accessToken = createAccessToken(user.id);
      const refreshToken = createRefreshToken(user.id);

      return { accessToken, refreshToken };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async signIn(data: SignInDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new ConflictException('Invalid data provided');
    }

    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);

    return { accessToken, refreshToken };
  }

  async refreshToken(accessToken?: string, refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      const userId = await verifyToken(refreshToken);
      if (!userId) {
        throw new ForbiddenException('Invalid refresh token');
      }

      const isBlacklisted = await this.prisma.blacklistToken.findUnique({
        where: { token: refreshToken },
      });

      if (isBlacklisted) {
        throw new ForbiddenException('Refresh token is revoked');
      }

      let blacklistData: { token: string; userId: string }[] = [
        { token: refreshToken, userId },
      ];

      if (accessToken) {
        try {
          const accessTokenUserId = await verifyToken(accessToken);
          if (accessTokenUserId && accessTokenUserId === userId) {
            blacklistData.push({ token: accessToken, userId });
          }
        } catch (error) {
          if (!(error instanceof JsonWebTokenError)) {
            throw error;
          }
        }
      }

      await this.prisma.blacklistToken.createMany({
        data: blacklistData,
      });

      const [newAccessToken, newRefreshToken] = await Promise.all([
        createAccessToken(userId),
        createRefreshToken(userId),
      ]);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        throw new ForbiddenException('Invalid refresh token');
      }

      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to refresh token');
    }
  }
}
