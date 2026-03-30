import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import PageNotFound from './components/PageNotFound';
import { RequireAuth } from './components/RequireAuth';
import { RequireRole } from './components/RequireRole';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TicketDetailPage from './pages/TicketDetailPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import UsersPage from './pages/admin/UsersPage';
import NewTicketPage from './pages/client/NewTicketPage';
import TicketsPage from './pages/client/TicketsPage';
import QueueAssignedPage from './pages/operator/QueueAssignedPage';
import QueueNewPage from './pages/operator/QueueNewPage';
import QueueResolvedPage from './pages/operator/QueueResolvedPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route
            path="/tickets"
            element={
              <RequireRole roles={['Client']}>
                <TicketsPage />
              </RequireRole>
            }
          />

          <Route
            path="/tickets/new"
            element={
              <RequireRole roles={['Client']}>
                <NewTicketPage />
              </RequireRole>
            }
          />

          <Route
            path="/tickets/:id"
            element={
              <RequireRole roles={['Client', 'Operator']}>
                <TicketDetailPage />
              </RequireRole>
            }
          />

          <Route
            path="/queue/new"
            element={
              <RequireRole roles={['Operator']}>
                <QueueNewPage />
              </RequireRole>
            }
          />

          <Route
            path="/queue/assigned"
            element={
              <RequireRole roles={['Operator']}>
                <QueueAssignedPage />
              </RequireRole>
            }
          />

          <Route
            path="/queue/resolved"
            element={
              <RequireRole roles={['Operator']}>
                <QueueResolvedPage />
              </RequireRole>
            }
          />

          <Route
            path="/admin/categories"
            element={
              <RequireRole roles={['Admin']}>
                <CategoriesPage />
              </RequireRole>
            }
          />

          <Route
            path="/admin/users"
            element={
              <RequireRole roles={['Admin']}>
                <UsersPage />
              </RequireRole>
            }
          />
        </Route>

        <Route path="/" element={<Navigate to="/tickets" replace />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </BrowserRouter>
  );
}