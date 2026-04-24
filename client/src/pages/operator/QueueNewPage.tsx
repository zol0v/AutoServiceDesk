import { message, Space, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../../api/client';
import { assignTicket, getTickets } from '../../api/tickets';
import PageEmpty from '../../components/PageEmpty';
import PageError from '../../components/PageError';
import PageLoading from '../../components/PageLoading';
import TicketQueueTable from '../../components/TicketQueueTable';

export default function QueueNewPage() {
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();

  const ticketsQuery = useQuery({
    queryKey: ['tickets', 'queue', 'new'],
    queryFn: () =>
      getTickets({
        status: 'New',
        unassignedOnly: true,
      }),
  });

  const assignMutation = useMutation({
    mutationFn: assignTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      messageApi.success('Заявка назначена вам');
    },
    onError: (error) => {
      const text = error instanceof ApiError ? error.message : 'Не удалось взять заявку в работу.';
      messageApi.error(text);
    },
  });

  if (ticketsQuery.isLoading) {
    return <PageLoading />;
  }

  if (ticketsQuery.isError) {
    const text =
      ticketsQuery.error instanceof ApiError
        ? ticketsQuery.error.message
        : 'Не удалось загрузить новые заявки.';
    return <PageError message={text} />;
  }

  const tickets = ticketsQuery.data?.items ?? [];

  return (
    <Space direction="vertical" size="large">
      {contextHolder}

      <Space direction="vertical">
        <Typography.Title level={3}>Новые заявки</Typography.Title>
        <Typography.Text type="secondary">
          Здесь отображаются свободные обращения клиентов, которые можно взять в работу.
        </Typography.Text>
      </Space>

      {tickets.length === 0 ? (
        <PageEmpty description="Свободных новых заявок сейчас нет." />
      ) : (
        <TicketQueueTable
          tickets={tickets}
          mode="new"
          onAssign={(id) => assignMutation.mutate(id)}
        />
      )}
    </Space>
  );
}