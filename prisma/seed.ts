import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function seats(rows: string[], perRow: number) {
  return rows.flatMap((row) =>
    Array.from({ length: perRow }, (_, i) => ({ row, number: i + 1, type: 'STANDARD' })),
  );
}

async function main() {
  // Admin user is upserted (never wiped) so existing logins survive re-seeding.
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin12345';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN' },
    create: {
      email: adminEmail,
      name: 'Admin',
      password: await bcrypt.hash(adminPassword, 10),
      role: 'ADMIN',
    },
  });

  // Clean slate so re-runs are deterministic
  await prisma.bookingSeat.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.screening.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.auditorium.deleteMany();
  await prisma.theatre.deleteMany();
  await prisma.address.deleteMany();
  await prisma.movie.deleteMany();

  // ── Movies ────────────────────────────────────────────────────────────────
  const [interstellar, darkKnight] = await Promise.all([
    prisma.movie.create({
      data: {
        title: 'Interstellar',
        description: 'A team of explorers travel through a wormhole in space.',
        durationMin: 169,
        releaseDate: new Date('2014-11-07'),
      },
    }),
    prisma.movie.create({
      data: {
        title: 'The Dark Knight',
        description: 'Batman faces the Joker in a battle for Gotham City.',
        durationMin: 152,
        releaseDate: new Date('2008-07-18'),
      },
    }),
  ]);

  // ── Theatre 1 — 2 auditoriums ─────────────────────────────────────────────
  const theatre1 = await prisma.theatre.create({
    data: {
      name: 'Cineplex Downtown',
      address: {
        create: {
          line1: '123 Main Street',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postalCode: '10001',
        },
      },
      auditoriums: {
        create: [
          { name: 'Hall A', seats: { create: seats(['A', 'B', 'C', 'D', 'E'], 2) } },
          { name: 'Hall B', seats: { create: seats(['A', 'B', 'C', 'D', 'E'], 2) } },
        ],
      },
    },
    include: { auditoriums: true },
  });

  // ── Theatre 2 — 3 auditoriums ─────────────────────────────────────────────
  const theatre2 = await prisma.theatre.create({
    data: {
      name: 'Grand Cinema',
      address: {
        create: {
          line1: '456 Broadway Avenue',
          city: 'Los Angeles',
          state: 'CA',
          country: 'USA',
          postalCode: '90001',
        },
      },
      auditoriums: {
        create: [
          { name: 'Hall 1', seats: { create: seats(['A', 'B', 'C', 'D', 'E'], 2) } },
          { name: 'Hall 2', seats: { create: seats(['A', 'B', 'C', 'D'], 2) } },
          { name: 'Hall 3', seats: { create: seats(['A', 'B', 'C', 'D', 'E'], 2) } },
        ],
      },
    },
    include: { auditoriums: true },
  });

  const [hallA] = theatre1.auditoriums;
  const [hall1] = theatre2.auditoriums;

  // ── Screenings ────────────────────────────────────────────────────────────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0);

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(19, 0, 0, 0);

  await Promise.all([
    prisma.screening.create({
      data: {
        movieId: interstellar.id,
        auditoriumId: hallA.id,
        startsAt: tomorrow,
        endsAt: new Date(tomorrow.getTime() + interstellar.durationMin * 60_000),
        price: 12.5,
      },
    }),
    prisma.screening.create({
      data: {
        movieId: darkKnight.id,
        auditoriumId: hall1.id,
        startsAt: dayAfter,
        endsAt: new Date(dayAfter.getTime() + darkKnight.durationMin * 60_000),
        price: 11.0,
      },
    }),
  ]);

  console.log('Seeded: 2 movies, 2 theatres, 5 auditoriums, 48 seats, 2 screenings.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
