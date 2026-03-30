import { Card, Typography } from 'antd';

export default function QueueAssignedPage() {
  return (
    <Card>
      <Typography.Title level={3}>Assigned to Me</Typography.Title>
      <Typography.Paragraph>
        Назначенные оператору заявки будут отображаться здесь.
      </Typography.Paragraph>
    </Card>
  );
}