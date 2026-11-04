/**
 * E2E tests for the Auth endpoints.
 *
 * Strategy: boot the full NestJS app against the real dev database.
 * Tests run in sequence (register → login → profile) because later
 * describe blocks depend on a user being present.
 *
 * Cleanup: deleteMany() wipes every user row created by this suite in
 * afterAll. Transaction rollback is not used here because the HTTP layer
 * commits each request before the test can intercept it.
 *
 * Run with: pnpm test:e2e
 * Requires: DB running and migrations applied (npx prisma migrate dev)
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

const TEST_USER = {
  email: 'e2e-auth@example.com',
  name: 'E2E User',
  password: 'password123',
};

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    // Mirror main.ts setup so routes and validation behave identically.
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = module.get(PrismaService);
  });

  afterAll(async () => {
    // Wipe only the rows this suite created, keyed by the unique test email.
    await prisma.user.deleteMany({ where: { email: TEST_USER.email } });
    await app.close();
  });

  // ─── POST /api/v1/auth/register ───────────────────────────────────────────

  describe('POST /api/v1/auth/register', () => {
    it('201 — creates a user and returns profile without password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(TEST_USER)
        .expect(201);

      expect(res.body.email).toBe(TEST_USER.email);
      expect(res.body.name).toBe(TEST_USER.name);
      expect(res.body).toHaveProperty('id');
      expect(res.body).not.toHaveProperty('password');
    });

    it('409 — duplicate email is rejected', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(TEST_USER) // same email, second attempt
        .expect(409);
    });

    it('400 — missing required fields are rejected by the validation pipe', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'bad' }) // no name, no password, invalid email
        .expect(400);
    });
  });

  // ─── POST /api/v1/auth/login ──────────────────────────────────────────────

  describe('POST /api/v1/auth/login', () => {
    it('200 — returns an accessToken for valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(typeof res.body.accessToken).toBe('string');
    });

    it('401 — wrong password is rejected', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: TEST_USER.email, password: 'wrong-password' })
        .expect(401);
    });

    it('401 — unknown email is rejected', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: TEST_USER.password })
        .expect(401);
    });
  });

  // ─── GET /api/v1/auth/profile ─────────────────────────────────────────────

  describe('GET /api/v1/auth/profile', () => {
    let token: string;

    beforeAll(async () => {
      // Obtain a real JWT by logging in — no mocks, no fixtures.
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password });
      token = res.body.accessToken as string;
    });

    it('200 — returns the authenticated user's profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.email).toBe(TEST_USER.email);
      expect(res.body.name).toBe(TEST_USER.name);
      expect(res.body).not.toHaveProperty('password');
    });

    it('401 — request without a token is rejected', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(401);
    });

    it('401 — request with a tampered token is rejected', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer this.is.invalid')
        .expect(401);
    });
  });
});
