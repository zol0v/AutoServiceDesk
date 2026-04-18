import { Tag } from 'antd';
import { TicketPriority } from '../api/tickets';

interface Props {
  priority: TicketPriority;
}

export default function TicketPriorityTag({ priority }: Props) {
  switch (priority) {
    case 'Low':
      return <Tag>Низкий</Tag>;
    case 'Medium':
      return <Tag color="blue">Средний</Tag>;
    case 'High':
      return <Tag color="red">Высокий</Tag>;
    default:
      return <Tag>{priority}</Tag>;
  }
}