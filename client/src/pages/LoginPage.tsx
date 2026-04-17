import { useEffect, useState } from 'react';
import { Alert, Button, Card, Flex, Form, Input, Layout, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth, Role } from '../contexts/AuthContext';

interface LoginFormValues {
  email: string;
  password: string;
}

const ROLE_REDIRECTS: Record<Role, string> = {
  Client: '/tickets',
  Master: '/queue/new',
  Admin: '/admin/categories',
};

export default function LoginPage() {
  const { login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && role) {
      navigate(ROLE_REDIRECTS[role], { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const handleSubmit = async (values: LoginFormValues) => {
    setErrorMessage(null);
    setLoading(true);

    try {
      await login(values.email, values.password);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Ошибка сети или сервера');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fb' }}>
      <Flex justify="center" align="center" style={{ minHeight: '100vh', padding: 24 }}>
        <Card title="Auto Service Desk" style={{ width: 420 }}>
          <Typography.Paragraph>Вход в систему</Typography.Paragraph>

          {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}

          <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Введите email' },
                { type: 'email', message: 'Неверный формат email' },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Введите пароль' }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Sign in
              </Button>
            </Form.Item>
          </Form>

          <Typography.Text>
            Нет аккаунта? <Link to="/register">Регистрация</Link>
          </Typography.Text>
        </Card>
      </Flex>
    </Layout>
  );
}