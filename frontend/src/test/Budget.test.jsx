import { render, screen } from '@testing-library/react';
import BudgetProgress from '../components/BudgetProgress';

describe('BudgetProgress', () => {
  test('renders amounts and percentage', () => {
    render(<BudgetProgress category="Food" spent={2400} allocated={3000} percent={80} status="warning" currency="INR" />);
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /Food budget used/ })).toHaveAttribute('aria-valuenow', '80');
    expect(screen.getByText(/Almost there/)).toBeInTheDocument();
  });
  test('shows the danger state when over budget', () => {
    render(<BudgetProgress category="Entertainment" spent={2100} allocated={2000} percent={105} status="danger" currency="INR" />);
    expect(screen.getByText('Over budget')).toBeInTheDocument();
  });
  test('shows no warning when healthy', () => {
    render(<BudgetProgress category="Transport" spent={750} allocated={1500} percent={50} status="ok" currency="INR" />);
    expect(screen.queryByText('Over budget')).toBeNull();
    expect(screen.queryByText(/Almost there/)).toBeNull();
  });
});
