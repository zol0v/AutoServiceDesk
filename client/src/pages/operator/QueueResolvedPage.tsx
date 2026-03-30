import { Card, Typography } from 'antd';

export default function QueueResolvedPage() {
  return (
    <Card>
      <Typography.Title level={3}>Resolved Tickets</Typography.Title>
      <Typography.Paragraph>
        Решенные заявки будут отображаться здесь.
      </Typography.Paragraph>
    </Card>
  );
}