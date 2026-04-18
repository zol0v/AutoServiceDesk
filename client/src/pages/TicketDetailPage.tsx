import { Button, Descriptions, Space, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { getTicketById } from '../api/tickets';
import PageError from '../components/PageError';
import PageLoading from '../components/PageLoading';
import TicketPriorityTag from '../components/TicketPriorityTag';
import TicketStatusTag from '../components/TicketStatusTag';
import { useAuth } from '../contexts/AuthContext';

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();

  const ticketId = Number(id);

  const ticketQuery = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => getTicketById(ticketId),
    enabled: Number.isFinite(ticketId),
  });

  if (!Number.isFinite(ticketId)) {
    return <PageError message="Некорректный идентификатор обращения." />;
  }

  if (ticketQuery.isLoading) {
    return <PageLoading />;
  }

  if (ticketQuery.isError) {
    const message =
      ticketQuery.error instanceof ApiError
        ? ticketQuery.error.message
        : 'Не удалось загрузить карточку обращения.';
    return <PageError message={message} />;
  }

  const ticket = ticketQuery.data;

  if (!ticket) {
    return <PageError message="Карточка обращения не найдена." />;
  }

  const backPath = role === 'Client' ? '/tickets' : '/queue/new';

  return (
    <Space direction="vertical" size="large">
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

      <Button onClick={() => navigate(backPath)}>Назад</Button>
    </Space>
  );
}