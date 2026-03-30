import { Card, Typography } from 'antd';

export default function QueueNewPage() {
  return (
    <Card>
      <Typography.Title level={3}>New Tickets</Typography.Title>
      <Typography.Paragraph>
        Новые заявки для оператора будут отображаться здесь.
      </Typography.Paragraph>
    </Card>
  );
}