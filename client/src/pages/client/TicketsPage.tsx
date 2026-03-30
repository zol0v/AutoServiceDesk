import { Card, Typography } from 'antd';

export default function TicketsPage() {
  return (
    <Card>
      <Typography.Title level={3}>My Tickets</Typography.Title>
      <Typography.Paragraph>
        Список заявок клиента будет добавлен позже.
      </Typography.Paragraph>
    </Card>
  );
}