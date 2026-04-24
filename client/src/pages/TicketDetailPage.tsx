import { Button, Descriptions, Space, Typography, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { assignTicket, changeTicketStatus, getTicketById, rejectTicket } from '../api/tickets';
import PageError from '../components/PageError';
import PageLoading from '../components/PageLoading';
import TicketPriorityTag from '../components/TicketPriorityTag';
import TicketStatusTag from '../components/TicketStatusTag';
import { useAuth } from '../contexts/AuthContext';

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, user } = useAuth();
  const [messageApi, contextHolder] = message.useMessage();

  const ticketId = Number(id);

  const ticketQuery = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => getTicketById(ticketId),
    enabled: Number.isFinite(ticketId),
  });

  const assignMutation = useMutation({
    mutationFn: assignTicket,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      await queryClient.invalidateQueries({ queryKey: ['tickets'] });
      messageApi.success('Заявка назначена вам');
    },
    onError: (error) => {
      const text = error instanceof ApiError ? error.message : 'Не удалось назначить заявку.';
      messageApi.error(text);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'InProgress' | 'Resolved' }) =>
      changeTicketStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      await queryClient.invalidateQueries({ queryKey: ['tickets'] });
      messageApi.success('Статус заявки обновлен');
    },
    onError: (error) => {
      const text = error instanceof ApiError ? error.message : 'Не удалось изменить статус заявки.';
      messageApi.error(text);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectTicket(id, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      await queryClient.invalidateQueries({ queryKey: ['tickets'] });
      messageApi.success('Заявка отклонена');
    },
    onError: (error) => {
      const text = error instanceof ApiError ? error.message : 'Не удалось отклонить заявку.';
      messageApi.error(text);
    },
  });

  if (!Number.isFinite(ticketId)) {
    return <PageError message="Некорректный идентификатор обращения." />;
  }

  if (ticketQuery.isLoading) {
    return <PageLoading />;
  }

  if (ticketQuery.isError) {
    const text =
      ticketQuery.error instanceof ApiError
        ? ticketQuery.error.message
        : 'Не удалось загрузить карточку обращения.';
    return <PageError message={text} />;
  }

  const ticket = ticketQuery.data;

  if (!ticket) {
    return <PageError message="Карточка обращения не найдена." />;
  }

  const isMaster = role === 'Master';
  const isUnassigned = ticket.assignee === null;
  const isAssignedToCurrentMaster = ticket.assignee?.id === user?.id;

  const canAssign = isMaster && isUnassigned && ticket.status === 'New';
  const canStart = isMaster && isAssignedToCurrentMaster && ticket.status === 'New';
  const canResolve = isMaster && isAssignedToCurrentMaster && ticket.status === 'InProgress';
  const canReject =
    isMaster &&
    isAssignedToCurrentMaster &&
    ticket.status !== 'Resolved' &&
    ticket.status !== 'Rejected' &&
    ticket.status !== 'Closed';

  const handleReject = () => {
    const reason = window.prompt('Укажите причину отклонения заявки');

    if (reason === null) {
      return;
    }

    const normalizedReason = reason.trim();

    if (!normalizedReason) {
      messageApi.warning('Причина отклонения обязательна.');
      return;
    }

    rejectMutation.mutate({ id: ticket.id, reason: normalizedReason });
  };

  const backPath = role === 'Client' ? '/tickets' : '/queue/new';

  return (
    <Space direction="vertical" size="large">
      {contextHolder}

      <Space direction="vertical">
        <Typography.Title level={3}>{ticket.title}</Typography.Title>
        <Typography.Text type="secondary">
          Карточка обращения клиента в автосервис.
        </Typography.Text>
      </Space>

      <Descriptions bordered column={1}>
        <Descriptions.Item label="Описание">{ticket.description}</Descriptions.Item>

        <Descriptions.Item label="Статус">
          <TicketStatusTag status={ticket.status} />
        </Descriptions.Item>

        <Descriptions.Item label="Приоритет">
          <TicketPriorityTag priority={ticket.priority} />
        </Descriptions.Item>

        <Descriptions.Item label="Категория">{ticket.categoryName}</Descriptions.Item>

        <Descriptions.Item label="Автор">
          {ticket.author.displayName} ({ticket.author.email})
        </Descriptions.Item>

        <Descriptions.Item label="Исполнитель">
          {ticket.assignee
            ? `${ticket.assignee.displayName} (${ticket.assignee.email})`
            : 'Мастер ещё не назначен'}
        </Descriptions.Item>

        <Descriptions.Item label="Создано">
          {new Date(ticket.createdAt).toLocaleString('ru-RU')}
        </Descriptions.Item>
      </Descriptions>

      <Space wrap>
        {canAssign && (
          <Button type="primary" onClick={() => assignMutation.mutate(ticket.id)}>
            Взять в работу
          </Button>
        )}

        {canStart && (
          <Button onClick={() => statusMutation.mutate({ id: ticket.id, status: 'InProgress' })}>
            Начать работу
          </Button>
        )}

        {canResolve && (
          <Button type="primary" onClick={() => statusMutation.mutate({ id: ticket.id, status: 'Resolved' })}>
            Завершить заявку
          </Button>
        )}

        {canReject && (
          <Button danger onClick={handleReject}>
            Отклонить заявку
          </Button>
        )}

        <Button onClick={() => navigate(backPath)}>Назад</Button>
      </Space>
    </Space>
  );
}