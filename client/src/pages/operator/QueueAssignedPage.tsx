import { message, Space, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../../api/client';
import { changeTicketStatus, getTickets, rejectTicket } from '../../api/tickets';
import PageEmpty from '../../components/PageEmpty';
import PageError from '../../components/PageError';
import PageLoading from '../../components/PageLoading';
import TicketQueueTable from '../../components/TicketQueueTable';

export default function QueueAssignedPage() {
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();

  const ticketsQuery = useQuery({
    queryKey: ['tickets', 'queue', 'assigned'],
    queryFn: () =>
      getTickets({
        assignedToMe: true,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'InProgress' | 'Resolved' }) =>
      changeTicketStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      messageApi.success('Статус заявки обновлен');
    },
    onError: (error) => {
      const text = error instanceof ApiError ? error.message : 'Не удалось изменить статус заявки.';
      messageApi.error(text);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectTicket(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      messageApi.success('Заявка отклонена');
    },
    onError: (error) => {
      const text = error instanceof ApiError ? error.message : 'Не удалось отклонить заявку.';
      messageApi.error(text);
    },
  });

  const handleReject = (id: number) => {
    const reason = window.prompt('Укажите причину отклонения заявки');

    if (reason === null) {
      return;
    }

    const normalizedReason = reason.trim();

    if (!normalizedReason) {
      messageApi.warning('Причина отклонения обязательна.');
      return;
    }

    rejectMutation.mutate({ id, reason: normalizedReason });
  };

  if (ticketsQuery.isLoading) {
    return <PageLoading />;
  }

  if (ticketsQuery.isError) {
    const text =
      ticketsQuery.error instanceof ApiError
        ? ticketsQuery.error.message
        : 'Не удалось загрузить назначенные заявки.';
    return <PageError message={text} />;
  }

  const tickets = ticketsQuery.data?.items ?? [];

  return (
    <Space direction="vertical" size="large">
      {contextHolder}

      <Space direction="vertical">
        <Typography.Title level={3}>Назначенные мне</Typography.Title>
        <Typography.Text type="secondary">
          Здесь находятся заявки, которые уже взяты вами в работу.
        </Typography.Text>
      </Space>

      {tickets.length === 0 ? (
        <PageEmpty description="У вас пока нет назначенных заявок." />
      ) : (
        <TicketQueueTable
          tickets={tickets}
          mode="assigned"
          onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
          onReject={handleReject}
        />
      )}
    </Space>
  );
}