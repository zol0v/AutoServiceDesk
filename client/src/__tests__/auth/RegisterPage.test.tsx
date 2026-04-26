import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import RegisterPage from '../../pages/RegisterPage';

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

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/tickets" element={<div>Tickets Route</div>} />
        <Route path="/queue/new" element={<div>Queue Route</div>} />
        <Route path="/admin/categories" element={<div>Admin Route</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RegisterPage', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it('renders required fields and submit button', () => {
    mockedUseAuth.mockReturnValue(createAuthValue());

    renderRegisterPage();

    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('submits entered registration data and redirects after successful registration', async () => {
    const user = userEvent.setup();
    const auth = createAuthValue();

    auth.register = vi.fn(async () => {
      auth.user = {
        id: 'u-1',
        email: 'new.client@example.com',
        displayName: 'New Client',
      };
      auth.role = 'Client';
      auth.token = 'token-123';
      auth.isAuthenticated = true;
    });
    mockedUseAuth.mockImplementation(() => auth);

    renderRegisterPage();

    await user.type(screen.getByLabelText(/display name/i), 'New Client');
    await user.type(screen.getByLabelText(/email/i), 'new.client@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'P@ssw0rd');
    await user.type(screen.getByLabelText(/confirm password/i), 'P@ssw0rd');
    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(auth.register).toHaveBeenCalledWith(
        'New Client',
        'new.client@example.com',
        'P@ssw0rd',
      );
    });

    expect(await screen.findByText('Tickets Route')).toBeInTheDocument();
  });

  it('shows an error message when registration fails', async () => {
    const user = userEvent.setup();
    const auth = createAuthValue({
      register: vi.fn(async () => {
        throw new ApiError(400, 'Email уже зарегистрирован');
      }),
    });
    mockedUseAuth.mockReturnValue(auth);

    renderRegisterPage();

    await user.type(screen.getByLabelText(/display name/i), 'Existing User');
    await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'P@ssw0rd');
    await user.type(screen.getByLabelText(/confirm password/i), 'P@ssw0rd');
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText('Email уже зарегистрирован')).toBeInTheDocument();
  });
});