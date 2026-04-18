import { useState } from 'react';
import { Button, Form, Input, Select, Space, Typography, message } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getCategories } from '../../api/categories';
import { ApiError } from '../../api/client';
import { createTicket, CreateTicketRequest, TicketPriority } from '../../api/tickets';
import PageError from '../../components/PageError';
import PageLoading from '../../components/PageLoading';
import PageValidation from '../../components/PageValidation';

interface FormValues {
  title: string;
  description: string;
  categoryId: number;
  priority: TicketPriority;
}

const priorityOptions: { value: TicketPriority; label: string }[] = [
  { value: 'Low', label: 'Низкий' },
  { value: 'Medium', label: 'Средний' },
  { value: 'High', label: 'Высокий' },
];

export default function NewTicketPage() {
  const navigate = useNavigate();
  const [messageApi, messageContext] = message.useMessage();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'create-ticket'],
    queryFn: () => getCategories(false),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateTicketRequest) => createTicket(payload),
    onSuccess: (ticket) => {
      messageApi.success('Обращение успешно создано');
      navigate(`/tickets/${ticket.id}`);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        const errors = error.problem?.errors
          ? Object.values(error.problem.errors).flat()
          : [];

        if (errors.length > 0) {
          setValidationErrors(errors);
          return;
        }

        messageApi.error(error.message);
        return;
      }

      messageApi.error('Не удалось создать обращение');
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setValidationErrors([]);

    createMutation.mutate({
      title: values.title.trim(),
      description: values.description.trim(),
      categoryId: values.categoryId,
      priority: values.priority,
    });
  };

  if (categoriesQuery.isLoading) {
    return <PageLoading />;
  }

  if (categoriesQuery.isError) {
    const messageText =
      categoriesQuery.error instanceof ApiError
        ? categoriesQuery.error.message
        : 'Не удалось загрузить категории.';
    return <PageError message={messageText} />;
  }

  const categories = categoriesQuery.data ?? [];

  return (
    <Space direction="vertical" size="large">
      {messageContext}

      <Space direction="vertical">
        <Typography.Title level={3}>Новая запись в автосервис</Typography.Title>
        <Typography.Text type="secondary">
          Опишите проблему автомобиля и выберите нужную категорию обслуживания.
        </Typography.Text>
      </Space>

      {validationErrors.length > 0 && <PageValidation errors={validationErrors} />}

      <Form<FormValues> layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Краткий заголовок"
          name="title"
          rules={[
            { required: true, message: 'Введите заголовок обращения' },
            { max: 200, message: 'Максимальная длина — 200 символов' },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Описание проблемы"
          name="description"
          rules={[
            { required: true, message: 'Опишите проблему' },
            { max: 2000, message: 'Максимальная длина — 2000 символов' },
          ]}
        >
          <Input.TextArea rows={6} />
        </Form.Item>

        <Form.Item
          label="Категория"
          name="categoryId"
          rules={[{ required: true, message: 'Выберите категорию' }]}
        >
          <Select
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Приоритет"
          name="priority"
          initialValue="Medium"
          rules={[{ required: true, message: 'Выберите приоритет' }]}
        >
          <Select options={priorityOptions} />
        </Form.Item>

        <Space>
          <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
            Отправить заявку
          </Button>
          <Button onClick={() => navigate('/tickets')}>Отмена</Button>
        </Space>
      </Form>
    </Space>
  );
}