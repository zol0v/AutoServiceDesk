import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import LoginPage from '../../pages/LoginPage';

vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../../contexts/AuthContext')>(
    '../../contexts/AuthContext',
  );

  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

type AuthValue = ReturnType<typeof useAuth>;

const mockedUseAuth = vi.mocked(useAuth);

function createAuthValue(overrides: Partial<AuthValue> = {}): AuthValue {
  return {
    user: null,
    role: null,
    token: null,
    isAuthenticated: false,
    login: vi.fn(async () => undefined),
    register: vi.fn(async () => undefined),
    logout: vi.fn(),
    init: vi.fn(async () => undefined),
    ...overrides,
  };
}

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/tickets" element={<div>Tickets Route</div>} />
        <Route path="/queue/new" element={<div>Queue Route</div>} />
        <Route path="/admin/categories" element={<div>Admin Route</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it('renders required fields and submit button', () => {
    mockedUseAuth.mockReturnValue(createAuthValue());

    renderLoginPage();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('submits entered credentials to auth login handler', async () => {
    const user = userEvent.setup();
    const auth = createAuthValue({
      login: vi.fn(async () => undefined),
    });
    mockedUseAuth.mockReturnValue(auth);

    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'client@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'P@ssw0rd');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(auth.login).toHaveBeenCalledWith('client@example.com', 'P@ssw0rd');
    });
  });

  it('redirects to role home after successful login', async () => {
    const user = userEvent.setup();
    const auth = createAuthValue();
    auth.login = vi.fn(async () => {
      auth.user = {
        id: 'u-1',
        email: 'client@example.com',
        displayName: 'Client User',
      };
      auth.role = 'Client';
      auth.token = 'token-123';
      auth.isAuthenticated = true;
    });
    mockedUseAuth.mockImplementation(() => auth);

    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'client@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'P@ssw0rd');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Tickets Route')).toBeInTheDocument();
  });

  it('shows an error message when login fails', async () => {
    const user = userEvent.setup();
    const auth = createAuthValue({
      login: vi.fn(async () => {
        throw new ApiError(401, 'Неверный email или пароль');
      }),
    });
    mockedUseAuth.mockReturnValue(auth);

    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'client@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Неверный email или пароль')).toBeInTheDocument();
  });
});