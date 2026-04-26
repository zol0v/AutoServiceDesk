import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { RequireAuth } from '../../components/RequireAuth';

describe('Route protection', () => {
  it('redirects unauthenticated users from protected route to login', () => {
    localStorage.removeItem('token');

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/private"
            element={
              <RequireAuth>
                <div>Protected Page</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Page')).not.toBeInTheDocument();
  });

  it('allows authenticated users to access protected route', () => {
    localStorage.setItem('token', 'token-123');

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/private"
            element={
              <RequireAuth>
                <div>Protected Page</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Protected Page')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('keeps public route accessible without authentication', () => {
    localStorage.removeItem('token');

    render(
      <MemoryRouter initialEntries={['/public']}>
        <Routes>
          <Route path="/public" element={<div>Public Page</div>} />
          <Route
            path="/private"
            element={
              <RequireAuth>
                <div>Protected Page</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Public Page')).toBeInTheDocument();
  });
});