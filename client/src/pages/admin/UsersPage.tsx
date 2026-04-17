import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Select, Space, Table, Typography, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { ApiError } from '../../api/client';
import { getUsers, updateUserRole, UserResponse } from '../../api/users';
import PageEmpty from '../../components/PageEmpty';
import PageError from '../../components/PageError';
import PageLoading from '../../components/PageLoading';

const usersQueryKey = ['users'];
const roleOptions = ['Client', 'Master', 'Admin'];

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [messageApi, messageContext] = message.useMessage();
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});

  const usersQuery = useQuery({
    queryKey: usersQueryKey,
    queryFn: getUsers,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => updateUserRole(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey });
      messageApi.success('Роль пользователя обновлена');
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        messageApi.error(error.message);
      }
    },
  });

  const columns: TableColumnsType<UserResponse> = [
    {
      title: 'Имя',
      dataIndex: 'displayName',
      key: 'displayName',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Роль',
      key: 'role',
      render: (_, record) => {
        const currentValue = selectedRoles[record.id] ?? record.role;

        return (
          <Space>
            <Select
              value={currentValue}
              options={roleOptions.map((role) => ({ value: role, label: role }))}
              onChange={(role) =>
                setSelectedRoles((prev) => ({
                  ...prev,
                  [record.id]: role,
                }))
              }
            />
            <Button
              type="primary"
              disabled={currentValue === record.role}
              onClick={() => updateRoleMutation.mutate({ id: record.id, role: currentValue })}
            >
              Сохранить
            </Button>
          </Space>
        );
      },
    },
  ];

  if (usersQuery.isLoading) {
    return <PageLoading />;
  }

  if (usersQuery.isError) {
    const messageText = usersQuery.error instanceof ApiError ? usersQuery.error.message : undefined;
    return <PageError message={messageText} />;
  }

  const users = usersQuery.data ?? [];

  return (
    <Space direction="vertical" size="large">
      {messageContext}
      <Space direction="vertical">
        <Typography.Title level={3}>Пользователи системы</Typography.Title>
        <Typography.Text type="secondary">
          Здесь администратор назначает роли клиентам, мастерам и другим администраторам.
          Новая роль будет применена после следующего входа пользователя в систему.
        </Typography.Text>
      </Space>

      {users.length === 0 ? (
        <PageEmpty description="Пользователи не найдены" />
      ) : (
        <Table rowKey="id" columns={columns} dataSource={users} pagination={false} />
      )}
    </Space>
  );
}