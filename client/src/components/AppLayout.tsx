import { Layout, Menu, Button, Typography, Space, theme } from 'antd';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header, Sider, Content } = Layout;

const clientMenuItems = [
  { key: '/tickets', label: <Link to="/tickets">Мои обращения</Link> },
  { key: '/tickets/new', label: <Link to="/tickets/new">Новая запись</Link> },
];

const masterMenuItems = [
  { key: '/queue/new', label: <Link to="/queue/new">Новые заявки</Link> },
  { key: '/queue/assigned', label: <Link to="/queue/assigned">Назначенные мне</Link> },
  { key: '/queue/resolved', label: <Link to="/queue/resolved">Завершенные</Link> },
];

const adminMenuItems = [
  { key: '/admin/categories', label: <Link to="/admin/categories">Категории услуг</Link> },
  { key: '/admin/users', label: <Link to="/admin/users">Пользователи</Link> },
];

export default function AppLayout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuItems =
    role === 'Client'
      ? clientMenuItems
      : role === 'Master'
        ? masterMenuItems
        : role === 'Admin'
          ? adminMenuItems
          : [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        <Typography.Title level={4} style={{ color: 'white', margin: 0 }}>
          Auto Service Desk
        </Typography.Title>

        <Space>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>
            {user?.displayName ?? 'Гость'} · {role}
          </Typography.Text>
          <Button type="link" style={{ color: 'white', padding: 0 }} onClick={handleLogout}>
            Выход
          </Button>
        </Space>
      </Header>

      <Layout>
        <Sider width={220} style={{ background: colorBgContainer }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>

        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              background: colorBgContainer,
              borderRadius: 8,
              padding: 24,
              minHeight: 360,
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}