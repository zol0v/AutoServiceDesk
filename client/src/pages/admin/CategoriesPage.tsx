import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Form, Input, Modal, Space, Switch, Table, Typography, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { ApiError } from '../../api/client';
import {
  CategoryResponse,
  createCategory,
  getCategories,
  setCategoryActive,
  updateCategory,
} from '../../api/categories';
import PageEmpty from '../../components/PageEmpty';
import PageError from '../../components/PageError';
import PageLoading from '../../components/PageLoading';

const categoriesQueryKey = ['categories', 'admin'];

interface CategoryFormValues {
  name: string;
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [messageApi, messageContext] = message.useMessage();
  const [form] = Form.useForm<CategoryFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);

  const categoriesQuery = useQuery({
    queryKey: categoriesQueryKey,
    queryFn: () => getCategories(true),
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      messageApi.success('Категория создана');
      setModalOpen(false);
      form.resetFields();
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        messageApi.error(error.message);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateCategory(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      messageApi.success('Категория обновлена');
      setModalOpen(false);
      form.resetFields();
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        messageApi.error(error.message);
      }
    },
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      setCategoryActive(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      messageApi.success('Статус категории изменен');
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        messageApi.error(error.message);
      }
    },
  });

  const handleCreate = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (category: CategoryResponse) => {
    setEditingCategory(category);
    form.setFieldsValue({ name: category.name });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const name = values.name.trim();

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, name });
      return;
    }

    createMutation.mutate({ name });
  };

  const columns: TableColumnsType<CategoryResponse> = [
    {
      title: 'Категория',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Активна',
      key: 'isActive',
      render: (_, record) => (
        <Switch
          checked={record.isActive}
          onChange={(isActive) => activeMutation.mutate({ id: record.id, isActive })}
        />
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => <Button onClick={() => handleEdit(record)}>Редактировать</Button>,
    },
  ];

  if (categoriesQuery.isLoading) {
    return <PageLoading />;
  }

  if (categoriesQuery.isError) {
    const messageText =
      categoriesQuery.error instanceof ApiError ? categoriesQuery.error.message : undefined;
    return <PageError message={messageText} />;
  }

  const categories = categoriesQuery.data ?? [];

  return (
    <Space direction="vertical" size="large">
      {messageContext}
      <Space direction="vertical">
        <Typography.Title level={3}>Категории автосервиса</Typography.Title>
        <Typography.Text type="secondary">
          Здесь администратор управляет видами услуг, которые клиент сможет выбрать при
          создании обращения в следующих лабораторных.
        </Typography.Text>
      </Space>

      <Button type="primary" onClick={handleCreate}>
        Добавить категорию
      </Button>

      {categories.length === 0 ? (
        <PageEmpty description="Категории пока не добавлены" />
      ) : (
        <Table rowKey="id" columns={columns} dataSource={categories} pagination={false} />
      )}

      <Modal
        title={editingCategory ? 'Редактирование категории' : 'Новая категория'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Название"
            name="name"
            rules={[
              { required: true, message: 'Введите название категории' },
              { max: 100, message: 'Максимум 100 символов' },
            ]}
          >
            <Input maxLength={100} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}