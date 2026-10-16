import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import api from '../api/client';

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { name: 'Jiya Patel', role: 'user', currency: 'INR' } }) }));
vi.mock('recharts', async () => {
  const React = await import('react');
  const Stub = ({ children }) => React.createElement('div', null, children);
  return { ResponsiveContainer: Stub, BarChart: Stub, Bar: Stub, Cell: Stub, XAxis: Stub, YAxis: Stub, Tooltip: Stub };
});

const overview = {
  user: { name: 'Jiya Patel', currency: 'INR' },
  summary: { income: 15000, expenses: 7250, remaining: 7750, savings: 7750, savingsRate: 51.7 },
  health: { score: 82, label: 'Excellent', explanation: 'Great shape.', factors: [{ name: 'Savings rate', points: 25, max: 25 }] },
  spending: { period: 'month', total: 7250, byCategory: [{ category: 'Food', total: 2850 }] },
  budget: { hasBudget: true, rows: [{ id: 1, category: 'Food', allocated: 3000, spent: 2400, remaining: 600, percent: 80, status: 'warning' }], totals: {} },
  recent: [{ id: 1, type: 'expense', category: 'Food', description: 'Lunch', amount: 180, transactionDate: '2026-10-05T12:00:00Z' }],
  insights: [{ tone: 'info', text: 'You have ₹1,450 remaining in your monthly budget.' }],
  finny: { mood: 'worried', message: 'Uh-oh! Your food budget is almost finished.' },
  prediction: 9800, recommendation: [], goals: [], unread: 0,
};

describe('Dashboard', () => {
  afterEach(() => vi.restoreAllMocks());

  test('renders backend numbers, health score and Finny message', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: overview });
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(await screen.findByText(/Jiya!/)).toBeInTheDocument();
    expect(screen.getByText('₹15,000')).toBeInTheDocument();
    expect(screen.getByText('₹7,250')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText(/almost finished/)).toBeInTheDocument();
    expect(screen.getByText('You have ₹1,450 remaining in your monthly budget.')).toBeInTheDocument();
  });

  test('shows a friendly empty state for new users', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: { ...overview, recent: [], finny: { mood: 'neutral', message: 'Hi!' } } });
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(await screen.findByText(/Your financial journey starts here/)).toBeInTheDocument();
  });

  test('shows an error state when the API fails', async () => {
    vi.spyOn(api, 'get').mockRejectedValue({ response: { data: {} } });
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load your dashboard.');
  });
});
