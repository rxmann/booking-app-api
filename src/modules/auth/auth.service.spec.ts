/**
 * Unit tests for AuthService.
 *
 * Strategy: mock PrismaService and JwtService — no real DB, no HTTP.
 * These tests cover the service's business logic in isolation.
 * No rollback needed; nothing is written to a real database.
 */
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

// Shape of the mocked PrismaService — only the methods AuthService uses.
type MockPrisma = {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
};

function makePrismaMock(): MockPrisma {
  return {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: MockPrisma;
  let jwt: jest.Mocked<Pick<JwtService, 'sign'>>;

  beforeEach(async () => {
    prisma = makePrismaMock();
    jwt = { sign: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  // ─── register ────────────────────────────────────────────────────────────────

  describe('register', () => {
    it('creates a user and returns it without the password field', async () => {
      const created = {
        id: 1,
        email: 'alice@example.com',
        name: 'Alice',
        createdAt: new Date(),
      };
      prisma.user.findUnique.mockResolvedValue(null); // no existing user
      prisma.user.create.mockResolvedValue(created);

      const result = await service.register({
        email: 'alice@example.com',
        name: 'Alice',
        password: 'hunter2!',
      });

      expect(result).toEqual(created);
      expect(result).not.toHaveProperty('password');
      // Prisma create was called with a hashed password, not the plain one
      const callArg = prisma.user.create.mock.calls[0][0] as {
        data: { password: string };
      };
      expect(callArg.data.password).not.toBe('hunter2!');
    });

    it('throws ConflictException when email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 }); // email taken

      await expect(
        service.register({
          email: 'alice@example.com',
          name: 'Alice',
          password: 'hunter2!',
        }),
      ).rejects.toThrow(ConflictException);

      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  // ─── login ───────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns an accessToken for valid credentials', async () => {
      const hashed = await bcrypt.hash('hunter2!', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'alice@example.com',
        password: hashed,
      });
      jwt.sign.mockReturnValue('signed.jwt.token');

      const result = await service.login({
        email: 'alice@example.com',
        password: 'hunter2!',
      });

      expect(result).toEqual({ accessToken: 'signed.jwt.token' });
      expect(jwt.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'alice@example.com',
      });
    });

    it('throws UnauthorizedException for an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'hunter2!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for a wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'alice@example.com',
        password: await bcrypt.hash('correct-pass', 10),
      });

      await expect(
        service.login({ email: 'alice@example.com', password: 'wrong-pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── getProfile ──────────────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('returns the user matching the given id', async () => {
      const profile = {
        id: 1,
        email: 'alice@example.com',
        name: 'Alice',
        createdAt: new Date(),
      };
      prisma.user.findUnique.mockResolvedValue(profile);

      const result = await service.getProfile(1);

      expect(result).toEqual(profile);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, email: true, name: true, createdAt: true },
      });
    });
  });
});

