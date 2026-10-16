process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

jest.mock('../src/db', () => ({
  $queryRaw: jest.fn().mockResolvedValue([1]),
  user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  transaction: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), deleteMany: jest.fn() },
  budget: { findUnique: jest.fn().mockResolvedValue(null), findFirst: jest.fn() },
  notification: { findFirst: jest.fn(), create: jest.fn() },
}));

const request = require('supertest');
const bcrypt = require('bcryptjs');
const prisma = require('../src/db');
const app = require('../src/app');
const { signToken } = require('../src/middleware/auth');

const token = (id = 1) => signToken({ id, role: 'user' });
const auth = (id) => ({ Authorization: `Bearer ${token(id)}` });

beforeEach(() => jest.clearAllMocks());

describe('health', () => {
  test('GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'healthy', database: 'connected' });
  });
  test('reports unhealthy when DB is down', async () => {
    prisma.$queryRaw.mockRejectedValueOnce(new Error('down'));
    expect((await request(app).get('/api/health')).status).toBe(503);
  });
});

describe('registration', () => {
  const body = { name: 'Jiya', email: 'JIYA@test.com', password: 'secret123', college: 'SVNIT', monthlyIncome: 15000 };
  test('creates a user, hashes the password and returns a JWT', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data }) => ({ id: 1, role: 'user', ...data }));
    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    const saved = prisma.user.create.mock.calls[0][0].data;
    expect(saved.passwordHash).not.toBe('secret123');
    expect(await bcrypt.compare('secret123', saved.passwordHash)).toBe(true);
    expect(saved.email).toBe('jiya@test.com');
    expect(res.body.user.passwordHash).toBeUndefined();
  });
  test('rejects short passwords', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...body, password: '123' });
    expect(res.status).toBe(400);
  });
  test('rejects duplicate emails', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 9 });
    expect((await request(app).post('/api/auth/register').send(body)).status).toBe(409);
  });
});

describe('login', () => {
  test('succeeds with the right password', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, role: 'user', email: 'a@b.com', passwordHash: await bcrypt.hash('secret123', 4) });
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'secret123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });
  test('fails with a generic message on wrong password', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, passwordHash: await bcrypt.hash('secret123', 4) });
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'nope' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password.');
  });
});

describe('transactions & authorization', () => {
  test('requires a token', async () => {
    expect((await request(app).get('/api/transactions')).status).toBe(401);
    expect((await request(app).get('/api/transactions').set('Authorization', 'Bearer junk')).status).toBe(401);
  });
  test('only queries the logged-in user\'s rows', async () => {
    await request(app).get('/api/transactions?category=Food').set(auth(7));
    expect(prisma.transaction.findMany.mock.calls[0][0].where).toMatchObject({ userId: 7, category: 'Food' });
  });
  test('creates an expense for the logged-in user', async () => {
    prisma.transaction.create.mockImplementation(async ({ data }) => ({ id: 1, ...data }));
    const res = await request(app).post('/api/transactions').set(auth(3))
      .send({ amount: 180, category: 'Food', date: '2026-10-05', paymentMethod: 'UPI', description: 'Lunch' });
    expect(res.status).toBe(201);
    expect(prisma.transaction.create.mock.calls[0][0].data).toMatchObject({ userId: 3, type: 'expense', amount: 180, category: 'Food' });
  });
  test('validates amount and category', async () => {
    const res = await request(app).post('/api/transactions').set(auth()).send({ amount: -5, category: 'Pizza', date: '2026-10-05' });
    expect(res.status).toBe(400);
  });
  test('cannot edit or delete another user\'s transaction', async () => {
    prisma.transaction.findFirst.mockResolvedValue(null);
    prisma.transaction.deleteMany.mockResolvedValue({ count: 0 });
    const put = await request(app).put('/api/transactions/5').set(auth(2)).send({ amount: 1, category: 'Food', date: '2026-10-05' });
    expect(put.status).toBe(404);
    const del = await request(app).delete('/api/transactions/5').set(auth(2));
    expect(del.status).toBe(404);
    expect(prisma.transaction.deleteMany.mock.calls[0][0].where).toMatchObject({ id: 5, userId: 2 });
  });
  test('DevOps endpoint is admin only', async () => {
    expect((await request(app).get('/api/devops/status').set(auth())).status).toBe(403);
  });
});
