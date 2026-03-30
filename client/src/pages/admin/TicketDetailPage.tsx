import { Card, Typography } from 'antd';

export default function TicketDetailPage() {
  return (
    <Card>
      <Typography.Title level={3}>Ticket Details</Typography.Title>
      <Typography.Paragraph>
        Детали заявки будут добавлены позже.
      </Typography.Paragraph>
    </Card>
  );
}