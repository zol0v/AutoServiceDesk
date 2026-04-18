import { useState } from 'react';
import { Button, Select, Space, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories } from '../../api/categories';
import { ApiError } from '../../api/client';
import { getTickets, TicketResponse, TicketStatus } from '../../api/tickets';
import PageEmpty from '../../components/PageEmpty';
import PageError from '../../components/PageError';
import PageLoading from '../../components/PageLoading';
import TicketPriorityTag from '../../components/TicketPriorityTag';
import TicketStatusTag from '../../components/TicketStatusTag';

const statusOptions: { value: TicketStatus; label: string }[] = [
  { value: 'New', label: 'Новая' },
  { value: 'InProgress', label: 'В работе' },
  { value: 'Resolved', label: 'Решена' },
  { value: 'Closed', label: 'Закрыта' },
  { value: 'Rejected', label: 'Отклонена' },
];

export default function TicketsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<TicketStatus | undefined>();
  const [categoryId, setCategoryId] = useState<number | undefined>();

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'client-active'],
    queryFn: () => getCategories(false),
  });

  const ticketsQuery = useQuery({
    queryKey: ['tickets', status, categoryId],
    queryFn: () =>
      getTickets({
        status,
        categoryId,
      }),
  });

  if (categoriesQuery.isLoading || ticketsQuery.isLoading) {
    return <PageLoading />;
  }

  if (categoriesQuery.isError) {
    const message =
      categoriesQuery.error instanceof ApiError ? categoriesQuery.error.message : 'Не удалось загрузить категории.';
    return <PageError message={message} />;
  }

  if (ticketsQuery.isError) {
    const message =
      ticketsQuery.error instanceof ApiError ? ticketsQuery.error.message : 'Не удалось загрузить обращения.';
    return <PageError message={message} />;
  }

  const tickets = ticketsQuery.data?.items ?? [];
  const categories = categoriesQuery.data ?? [];

  const columns: TableColumnsType<TicketResponse> = [
    {
      title: 'Обращение',
      key: 'title',
      render: (_, record) => <Link to={`/tickets/${record.id}`}>{record.title}</Link>,
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_, record) => <TicketStatusTag status={record.status} />,
    },
    {
      title: 'Приоритет',
      key: 'priority',
      render: (_, record) => <TicketPriorityTag priority={record.priority} />,
    },
    {
      title: 'Категория',
      dataIndex: 'categoryName',
      key: 'categoryName',
    },
    {
      title: 'Создано',
      key: 'createdAt',
      render: (_, record) => new Date(record.createdAt).toLocaleString('ru-RU'),
    },
  ];

  return (
    <Space direction="vertical" size="large">
      <Space direction="vertical">
        <Typography.Title level={3}>Мои обращения</Typography.Title>
        <Typography.Text type="secondary">
          Здесь отображаются ваши заявки на ремонт и обслуживание автомобиля.
        </Typography.Text>
      </Space>

      <Space wrap>
        <Select
          allowClear
          placeholder="Фильтр по статусу"
          value={status}
          options={statusOptions}
          onChange={(value) => setStatus(value)}
        />

        <Select
          allowClear
          placeholder="Фильтр по категории"
          value={categoryId}
          options={categories.map((category) => ({
            value: category.id,
            label: category.name,
          }))}
          onChange={(value) => setCategoryId(value)}
        />

        <Button type="primary" onClick={() => navigate('/tickets/new')}>
          Новая запись
        </Button>
      </Space>

      {tickets.length === 0 ? (
        <PageEmpty description="По выбранным условиям обращения не найдены." />
      ) : (
        <Table rowKey="id" columns={columns} dataSource={tickets} pagination={false} />
      )}
    </Space>
  );
}