import { Space, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '../../api/client';
import { getTickets } from '../../api/tickets';
import PageEmpty from '../../components/PageEmpty';
import PageError from '../../components/PageError';
import PageLoading from '../../components/PageLoading';
import TicketQueueTable from '../../components/TicketQueueTable';

export default function QueueResolvedPage() {
  const ticketsQuery = useQuery({
    queryKey: ['tickets', 'queue', 'resolved'],
    queryFn: () =>
      getTickets({
        status: 'Resolved',
        assignedToMe: true,
      }),
  });

  if (ticketsQuery.isLoading) {
    return <PageLoading />;
  }

  if (ticketsQuery.isError) {
    const text =
      ticketsQuery.error instanceof ApiError
        ? ticketsQuery.error.message
        : 'Не удалось загрузить завершенные заявки.';
    return <PageError message={text} />;
  }

  const tickets = ticketsQuery.data?.items ?? [];

  return (
    <Space direction="vertical" size="large">
      <Space direction="vertical">
        <Typography.Title level={3}>Завершенные заявки</Typography.Title>
        <Typography.Text type="secondary">
          Здесь отображаются обращения, которые вы уже успешно завершили.
        </Typography.Text>
      </Space>

      {tickets.length === 0 ? (
        <PageEmpty description="У вас пока нет завершенных заявок." />
      ) : (
        <TicketQueueTable tickets={tickets} mode="resolved" />
      )}
    </Space>
  );
}