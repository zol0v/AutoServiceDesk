import { Card, Typography } from 'antd';

export default function TicketDetailPage() {
  return (
    <Card>
      <Typography.Title level={3}>Ticket Details</Typography.Title>
      <Typography.Paragraph type="secondary">
        Detailed information about a selected service ticket will be shown here.
      </Typography.Paragraph>
    </Card>
  );
}