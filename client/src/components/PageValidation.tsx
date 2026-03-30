import { Alert } from 'antd';

interface Props {
  title?: string;
  errors: string[];
}

export default function PageValidation({
  title = 'Исправьте следующие ошибки',
  errors,
}: Props) {
  return (
    <Alert
      type="warning"
      showIcon
      message={title}
      description={
        <ul>
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      }
    />
  );
}