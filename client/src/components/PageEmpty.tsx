import { Empty } from 'antd';

interface Props {
  description?: string;
}

export default function PageEmpty({ description = 'Нет данных' }: Props) {
  return <Empty description={description} />;
}