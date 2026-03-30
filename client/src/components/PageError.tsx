import { Alert } from 'antd';

interface Props {
  message?: string;
}

export default function PageError({ message = 'Произошла ошибка' }: Props) {
  return <Alert type="error" message={message} showIcon />;
}