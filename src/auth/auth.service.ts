import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SignUpDto } from './dto/sign-up.dto';
import * as bcrypt from 'bcrypt';
import { createAccessToken, createRefreshToken } from 'src/utils/tokens.util';

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
}
