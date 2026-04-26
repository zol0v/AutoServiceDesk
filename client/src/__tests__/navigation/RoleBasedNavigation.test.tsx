import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppLayout from '../../components/AppLayout';
import { RequireRole } from '../../components/RequireRole';
import { useAuth } from '../../contexts/AuthContext';
import { renderWithProviders } from '../../test/renderWithProviders';

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
    user: {
      id: 'u-1',
      email: 'user@example.com',
      displayName: 'Test User',
    },
    role: 'Client',
    token: 'token-123',
    isAuthenticated: true,
    login: vi.fn(async () => undefined),
    register: vi.fn(async () => undefined),
    logout: vi.fn(),
    init: vi.fn(async () => undefined),
    ...overrides,
  };
}

function renderLayout(route: string) {
  return renderWithProviders(
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="*" element={<div>Page Content</div>} />
      </Route>
    </Routes>,
    { route },
  );
}

describe('Role-based behavior', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it('shows client navigation and hides admin links for Client role', () => {
    mockedUseAuth.mockReturnValue(createAuthValue({ role: 'Client' }));

    renderLayout('/tickets');

    expect(screen.getByRole('link', { name: 'Мои обращения' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Новая запись' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Категории услуг' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Пользователи' })).not.toBeInTheDocument();
  });

  it('shows admin navigation and hides client links for Admin role', () => {
    mockedUseAuth.mockReturnValue(createAuthValue({ role: 'Admin' }));

    renderLayout('/admin/categories');

    expect(screen.getByRole('link', { name: 'Категории услуг' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Пользователи' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Мои обращения' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Новая запись' })).not.toBeInTheDocument();
  });

  it('shows master navigation for Master role', () => {
    mockedUseAuth.mockReturnValue(createAuthValue({ role: 'Master' }));

    renderLayout('/queue/new');

    expect(screen.getByRole('link', { name: 'Новые заявки' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Назначенные мне' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Завершенные' })).toBeInTheDocument();
  });

  it('blocks Client from Admin-only content', () => {
    mockedUseAuth.mockReturnValue(createAuthValue({ role: 'Client' }));

    renderWithProviders(
      <Routes>
        <Route
          path="/admin-only"
          element={
            <RequireRole roles={['Admin']}>
              <div>Admin-only content</div>
            </RequireRole>
          }
        />
      </Routes>,
      { route: '/admin-only' },
    );

    expect(screen.getByText('У вас нет доступа к этой странице')).toBeInTheDocument();
    expect(screen.queryByText('Admin-only content')).not.toBeInTheDocument();
  });
});