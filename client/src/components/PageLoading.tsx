import { Flex, Spin } from 'antd';

export default function PageLoading() {
  return (
    <Flex justify="center" align="center" vertical gap="middle">
      <Spin size="large" />
    </Flex>
  );
}