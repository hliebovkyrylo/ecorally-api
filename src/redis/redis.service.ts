import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async get(key: string): Promise<string | null> {
    try {
      return await this.redisClient.get(key);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Failed to get key ${key}: ${error.message}`);
      } else {
        this.logger.error(`Failed to get key ${key}: Unknown error`);
      }
      throw new Error('Redis operation failed');
    }
  }

  async set(key: string, value: string | number, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.redisClient.set(key, value.toString(), 'EX', ttl);
      } else {
        await this.redisClient.set(key, value.toString());
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Failed to set key ${key}: ${error.message}`);
      }

      throw new Error('Redis operation failed');
    }
  }

  async increment(key: string, ttl?: number): Promise<number> {
    try {
      const result = await this.redisClient.incr(key);
      if (result === 1 && ttl) {
        await this.redisClient.expire(key, ttl);
      }
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Failed to increment key ${key}: ${error.message}`);
      }
      throw new Error('Redis operation failed');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Failed to delete key ${key}: ${error.message}`);
      }
      throw new Error('Redis operation failed');
    }
  }

  async getTtl(key: string): Promise<number> {
    try {
      return await this.redisClient.ttl(key);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Failed to get TTL for key ${key}: ${error.message}`);
      }
      throw new Error('Redis operation failed');
    }
  }
}
