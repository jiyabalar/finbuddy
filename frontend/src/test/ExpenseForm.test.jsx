import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionForm from '../components/TransactionForm';

describe('Expense form', () => {
  test('requires amount and category', async () => {
    const onSubmit = vi.fn();
    render(<TransactionForm type="expense" onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add expense' }));
    expect(await screen.findByText('Enter an amount greater than 0')).toBeInTheDocument();
    expect(screen.getByText('Choose a category')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('submits a valid expense', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<TransactionForm type="expense" onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText('Amount (₹)'), '180');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'Food');
    await userEvent.type(screen.getByLabelText('Description'), 'Lunch');
    await userEvent.click(screen.getByRole('button', { name: 'Add expense' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ type: 'expense', amount: 180, category: 'Food', description: 'Lunch', paymentMethod: 'UPI' });
  });

  test('income mode shows sources instead of categories', () => {
    render(<TransactionForm type="income" onSubmit={vi.fn()} />);
    expect(screen.getByLabelText('Source')).toBeInTheDocument();
    expect(screen.queryByLabelText('Payment method')).toBeNull();
  });
});
