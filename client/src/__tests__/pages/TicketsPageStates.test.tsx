import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/client';
import { getCategories } from '../../api/categories';
import { getTickets } from '../../api/tickets';
import TicketsPage from '../../pages/client/TicketsPage';
import { renderWithProviders } from '../../test/renderWithProviders';

vi.mock('../../api/categories', async () => {
  const actual = await vi.importActual<typeof import('../../api/categories')>(
    '../../api/categories',
  );

  return {
    ...actual,
    getCategories: vi.fn(),
  };
});

vi.mock('../../api/tickets', async () => {
  const actual = await vi.importActual<typeof import('../../api/tickets')>(
    '../../api/tickets',
  );

  return {
    ...actual,
    getTickets: vi.fn(),
  };
});

const getCategoriesMock = vi.mocked(getCategories);
const getTicketsMock = vi.mocked(getTickets);

describe('TicketsPage states', () => {
  beforeEach(() => {
    getCategoriesMock.mockReset();
    getTicketsMock.mockReset();
  });

  it('renders loading state while data is being fetched', () => {
    getCategoriesMock.mockReturnValue(
      new Promise(() => undefined) as ReturnType<typeof getCategories>,
    );
    getTicketsMock.mockResolvedValue({
      items: [],
      totalCount: 0,
    });

    renderWithProviders(<TicketsPage />, { route: '/tickets' });

    expect(document.querySelector('.ant-spin')).toBeInTheDocument();
  });

  it('renders error state when tickets loading fails', async () => {
    getCategoriesMock.mockResolvedValue([
      { id: 1, name: 'Диагностика двигателя', isActive: true },
    ]);
    getTicketsMock.mockRejectedValue(new ApiError(500, 'Не удалось загрузить обращения.'));

    renderWithProviders(<TicketsPage />, { route: '/tickets' });

    expect(await screen.findByText('Не удалось загрузить обращения.')).toBeInTheDocument();
  });

  it('renders empty state when there are no tickets', async () => {
    getCategoriesMock.mockResolvedValue([
      { id: 1, name: 'Диагностика двигателя', isActive: true },
    ]);
    getTicketsMock.mockResolvedValue({
      items: [],
      totalCount: 0,
    });

    renderWithProviders(<TicketsPage />, { route: '/tickets' });

    expect(
      await screen.findByText('По выбранным условиям обращения не найдены.'),
    ).toBeInTheDocument();
  });
});