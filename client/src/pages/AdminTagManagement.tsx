import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Button, 
  Table, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Popconfirm, 
  message 
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { TextArea } = Input;

interface Tag {
  id: string;
  name: string;
  description: string;
}

const AdminTagManagement: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [form] = Form.useForm();

  // Tạo axios instance với interceptor tương tự AdminPage
  const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  });

  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        message.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
      return Promise.reject(error);
    }
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/tags');
      // Điều chỉnh theo cấu trúc response thực tế của API
      setTags(res.data.tags || res.data || []);
    } catch (error: any) {
      console.error('Fetch tags error:', error);
      if (error.response?.status !== 401) {
        message.error('Lỗi kết nối server khi tải danh sách thẻ!');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      form.setFieldsValue({
        name: tag.name,
        description: tag.description,
      });
    } else {
      setEditingTag(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancelModal = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingTag(null);
  };

  const handleSave = async (values: any) => {
    try {
      if (editingTag) {
        // Cập nhật thẻ hiện tại
        await axiosInstance.put(`/admin/tags/${editingTag.id}`, values);
        message.success('Cập nhật thẻ thành công!');
      } else {
        // Thêm thẻ mới
        await axiosInstance.post('/admin/tags', values);
        message.success('Thêm thẻ mới thành công!');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchData(); // Reload lại danh sách sau khi lưu
    } catch (error: any) {
      console.error('Save tag error:', error);
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu thẻ!');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/admin/tags/${id}`);
      message.success('Xóa thẻ thành công!');
      fetchData(); // Reload lại danh sách sau khi xóa
    } catch (error: any) {
      console.error('Delete tag error:', error);
      message.error(error.response?.data?.message || 'Xóa thẻ thất bại!');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Tên thẻ',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Tag) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleOpenModal(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa thẻ này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Quản lý danh mục thẻ (Tags)</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Thêm thẻ mới
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={tags} 
        rowKey="id" 
        loading={loading} 
        bordered
      />

      <Modal
        title={editingTag ? 'Sửa thẻ' : 'Thêm thẻ mới'}
        open={isModalVisible}
        onCancel={handleCancelModal}
        onOk={() => form.submit()}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="name"
            label="Tên thẻ"
            rules={[{ required: true, message: 'Vui lòng nhập tên thẻ!' }]}
          >
            <Input placeholder="Nhập tên thẻ..." />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea rows={4} placeholder="Nhập mô tả thẻ..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminTagManagement;
