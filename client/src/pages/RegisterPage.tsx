import { useEffect, useState } from 'react';
import { Alert, Button, Card, Flex, Form, Input, Layout, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth, Role } from '../contexts/AuthContext';

interface RegisterFormValues {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const ROLE_REDIRECTS: Record<Role, string> = {
  Client: '/tickets',
  Operator: '/queue/new',
  Admin: '/admin/categories',
};

export default function RegisterPage() {
  const { register, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && role) {
      navigate(ROLE_REDIRECTS[role], { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const handleSubmit = async (values: RegisterFormValues) => {
    setErrorMessage(null);
    setLoading(true);

    try {
      await register(values.displayName, values.email, values.password);
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
          <Typography.Paragraph>Регистрация</Typography.Paragraph>

          {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}

          <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
            <Form.Item
              label="Display Name"
              name="displayName"
              rules={[{ required: true, message: 'Введите отображаемое имя' }]}
            >
              <Input />
            </Form.Item>

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
              rules={[
                { required: true, message: 'Введите пароль' },
                { min: 6, message: 'Минимум 6 символов' },
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label="Confirm Password"
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Подтвердите пароль' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }

                    return Promise.reject(new Error('Пароли не совпадают'));
                  },
                }),
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Register
              </Button>
            </Form.Item>
          </Form>

          <Typography.Text>
            Уже есть аккаунт? <Link to="/login">Вход</Link>
          </Typography.Text>
        </Card>
      </Flex>
    </Layout>
  );
}