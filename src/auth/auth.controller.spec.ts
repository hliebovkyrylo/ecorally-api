import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { Response } from 'express';
import { SignInDto } from './dto/sign-in.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signIn: jest.fn(),
    signUp: jest.fn(),
  };

  const mockResponse = {
    cookie: jest.fn(),
    send: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signUp', () => {
    it('should set refresh token cookie and return accessToken', async () => {
      const signUpDto: SignUpDto = {
        email: 'test@example.com',
        password: 'password',
        confirmPassword: 'password',
      };
      const result = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      mockAuthService.signUp.mockResolvedValue(result);

      await controller.signUp(signUpDto, mockResponse);

      expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        result.refreshToken,
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        },
      );
      expect(mockResponse.send).toHaveBeenCalledWith({
        accessToken: result.accessToken,
      });
    });
  });

  describe('signIn', () => {
    it('should set refreshToken cookie and return accessToken', async () => {
      const signInDto: SignInDto = {
        email: 'test@example.com',
        password: 'password',
      };
      const result = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      mockAuthService.signIn.mockResolvedValue(result);

      await controller.signIn(signInDto, mockResponse);

      expect(authService.signIn).toHaveBeenCalledWith(signInDto);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        result.refreshToken,
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        },
      );
      expect(mockResponse.send).toHaveBeenCalledWith({
        accessToken: result.accessToken,
      });
    });
  });
});
