
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../pages/AuthPages';

const login = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    login,
  }),
}));

const setup = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe('Login form', () => {
  beforeEach(() => {
    login.mockReset();
  });

  test('validates empty fields', async () => {
    setup();

    await userEvent.click(
      screen.getByRole('button', { name: 'Login' })
    );

    expect(
      await screen.findByText('Enter a valid email')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Enter your password')
    ).toBeInTheDocument();

    expect(login).not.toHaveBeenCalled();
  });

  test('submits credentials', async () => {
    login.mockResolvedValue({});

    setup();

    await userEvent.type(
      screen.getByLabelText('Email'),
      'jiya@finbuddy.demo'
    );

    await userEvent.type(
      screen.getByLabelText('Password'),
      'Demo@1234'
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Login' })
    );

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith(
        'jiya@finbuddy.demo',
        'Demo@1234',
        true
      );
    });
  });

  test('shows a friendly error on failure', async () => {
    login.mockRejectedValue({
      response: {
        data: {
          error: 'Invalid email or password.',
        },
      },
    });

    setup();

    await userEvent.type(
      screen.getByLabelText('Email'),
      'a@b.com'
    );

    await userEvent.type(
      screen.getByLabelText('Password'),
      'wrongpass'
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Login' })
    );

    const alert = await screen.findByRole('alert');

    console.log('ALERT FOUND:', alert.textContent);

    if (!alert.textContent.includes('Invalid email or password.')) {
      throw new Error(
        `Unexpected login error: ${alert.textContent}`
      );
    }
  });
});



