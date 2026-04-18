import { Tag } from 'antd';
import { TicketStatus } from '../api/tickets';

interface Props {
  status: TicketStatus;
}

export default function TicketStatusTag({ status }: Props) {
  switch (status) {
    case 'New':
      return <Tag color="blue">Новая</Tag>;
    case 'InProgress':
      return <Tag color="gold">В работе</Tag>;
    case 'Resolved':
      return <Tag color="green">Решена</Tag>;
    case 'Closed':
      return <Tag>Закрыта</Tag>;
    case 'Rejected':
      return <Tag color="red">Отклонена</Tag>;
    default:
      return <Tag>{status}</Tag>;
  }
}