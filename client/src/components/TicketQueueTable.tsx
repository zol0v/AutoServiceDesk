import { Button, Space, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { Link } from 'react-router-dom';
import { TicketResponse } from '../api/tickets';
import TicketPriorityTag from './TicketPriorityTag';
import TicketStatusTag from './TicketStatusTag';

type Props = {
  tickets: TicketResponse[];
  mode: 'new' | 'assigned' | 'resolved';
  onAssign?: (id: number) => void;
  onStatusChange?: (id: number, status: 'InProgress' | 'Resolved') => void;
  onReject?: (id: number) => void;
};

export default function TicketQueueTable({
  tickets,
  mode,
  onAssign,
  onStatusChange,
  onReject,
}: Props) {
  const columns: TableColumnsType<TicketResponse> = [
    {
      title: 'Заявка',
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
      title: 'Клиент',
      key: 'author',
      render: (_, record) => record.author.displayName,
    },
    {
      title: 'Создано',
      key: 'createdAt',
      render: (_, record) => new Date(record.createdAt).toLocaleString('ru-RU'),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {mode === 'new' && onAssign && (
            <Button size="small" type="primary" onClick={() => onAssign(record.id)}>
              Взять в работу
            </Button>
          )}

          {mode === 'assigned' && onStatusChange && record.status === 'New' && (
            <Button size="small" onClick={() => onStatusChange(record.id, 'InProgress')}>
              Начать работу
            </Button>
          )}

          {mode === 'assigned' && onStatusChange && record.status === 'InProgress' && (
            <Button size="small" type="primary" onClick={() => onStatusChange(record.id, 'Resolved')}>
              Завершить
            </Button>
          )}

          {mode === 'assigned' &&
            onReject &&
            record.status !== 'Resolved' &&
            record.status !== 'Rejected' &&
            record.status !== 'Closed' && (
              <Button size="small" danger onClick={() => onReject(record.id)}>
                Отклонить
              </Button>
            )}
        </Space>
      ),
    },
  ];

  return <Table rowKey="id" columns={columns} dataSource={tickets} pagination={false} />;
}