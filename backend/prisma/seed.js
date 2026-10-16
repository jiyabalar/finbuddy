/**
 * DEMO DATA ONLY. Creates the demo student "Jiya" (jiya@finbuddy.demo / Demo@1234) with realistic data.
 * It is skipped automatically if the demo user already exists. Never run it against real production data.
 */
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const EMAIL = 'jiya@finbuddy.demo';

async function main() {
  if (await prisma.user.findUnique({ where: { email: EMAIL } })) {
    console.log('Demo user already exists - skipping seed.');
    return;
  }
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const today = now.getDate();
  const at = (monthsBack, day) => {
    const d = new Date(y, m - monthsBack, 1);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const cap = monthsBack === 0 ? Math.min(day, today) : Math.min(day, last);
    return new Date(d.getFullYear(), d.getMonth(), cap, 12);
  };

  const user = await prisma.user.create({
    data: {
      name: 'Jiya Patel', email: EMAIL, passwordHash: await bcrypt.hash('Demo@1234', 10),
      college: 'SVNIT Surat', monthlyIncome: 15000, role: 'admin', preferences: { notifications: true, budgetAlerts: true },
    },
  });

  const rows = [];
  const add = (type, monthsBack, day, category, description, amount, paymentMethod) =>
    rows.push({ userId: user.id, type, category, description, amount, paymentMethod: paymentMethod || null, transactionDate: at(monthsBack, day) });

  // This month
  add('income', 0, 1, 'Allowance', 'Monthly allowance', 12000, 'Bank Transfer');
  add('income', 0, 3, 'Part-time Job', 'Weekend tutoring', 3000, 'UPI');
  [
    [1, 'Food', 'Groceries', 650, 'UPI'], [1, 'Bills', 'Mobile recharge', 299, 'UPI'],
    [2, 'Transport', 'Metro card', 300, 'UPI'], [2, 'Food', 'Canteen lunch', 180, 'Cash'],
    [3, 'Education', 'Notebooks', 420, 'Cash'], [3, 'Entertainment', 'Movie night', 450, 'UPI'],
    [4, 'Food', 'Dinner with friends', 720, 'UPI'], [4, 'Shopping', 'T-shirt', 899, 'Debit Card'],
    [5, 'Education', 'Online course', 1000, 'UPI'], [5, 'Transport', 'Cab', 250, 'UPI'],
    [6, 'Food', 'Coffee & snacks', 340, 'Cash'], [6, 'Entertainment', 'Streaming subscriptions', 650, 'Debit Card'],
    [7, 'Food', 'Lunch', 180, 'Cash'], [7, 'Food', 'Weekend brunch', 480, 'UPI'], [7, 'Entertainment', 'Gaming top-up', 300, 'UPI'],
  ].forEach(([d, c, desc, a, pm]) => add('expense', 0, d, c, desc, a, pm));

  // Previous months (for trends / comparisons)
  for (let k = 1; k <= 5; k += 1) {
    add('income', k, 1, 'Allowance', 'Monthly allowance', 12000, 'Bank Transfer');
    add('income', k, 5, k % 2 ? 'Part-time Job' : 'Freelancing', k % 2 ? 'Tutoring' : 'Logo design gig', 2500 + k * 200, 'UPI');
    add('expense', k, 3, 'Food', 'Groceries', 900 + k * 40, 'UPI');
    add('expense', k, 9, 'Food', 'Eating out', 700 + (k % 3) * 150, 'UPI');
    add('expense', k, 14, 'Food', 'Canteen', 520, 'Cash');
    add('expense', k, 6, 'Transport', 'Bus / metro', 700 + k * 30, 'UPI');
    add('expense', k, 12, 'Education', 'Books & printouts', 500 + (k % 2) * 300, 'Cash');
    add('expense', k, 18, 'Entertainment', 'Movies & outings', 800 + (k % 3) * 120, 'UPI');
    add('expense', k, 21, 'Shopping', 'Clothes', 900 + (k % 2) * 400, 'Debit Card');
    add('expense', k, 25, 'Bills', 'Phone + internet', 299, 'UPI');
  }
  await prisma.transaction.createMany({ data: rows });

  await prisma.budget.create({
    data: {
      userId: user.id, month: m + 1, year: y, totalBudget: 10000,
      categories: { create: [
        { category: 'Food', allocatedAmount: 3000 }, { category: 'Transport', allocatedAmount: 1500 },
        { category: 'Education', allocatedAmount: 2000 }, { category: 'Entertainment', allocatedAmount: 1500 },
        { category: 'Shopping', allocatedAmount: 1000 }, { category: 'Savings', allocatedAmount: 1000 },
      ] },
    },
  });

  await prisma.savingsGoal.createMany({ data: [
    { userId: user.id, name: 'Laptop', targetAmount: 60000, currentAmount: 18500, category: 'Tech', targetDate: new Date(y, m + 10, 1) },
    { userId: user.id, name: 'Goa Trip', targetAmount: 15000, currentAmount: 6200, category: 'Travel', targetDate: new Date(y, m + 5, 1) },
    { userId: user.id, name: 'Headphones', targetAmount: 8000, currentAmount: 5200, category: 'Tech', targetDate: new Date(y, m + 3, 1) },
  ] });

  const { checkBudgetAlerts } = require('../src/services/notify');
  await checkBudgetAlerts(user.id);
  await prisma.notification.create({ data: { userId: user.id, type: 'reminder', title: 'Welcome to FinBuddy 👋', message: 'Add your expenses daily — it takes 10 seconds and keeps Finny happy.' } });
  console.log('Seeded demo user: jiya@finbuddy.demo / Demo@1234');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
