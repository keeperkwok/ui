import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Form, Input, Tabs, message } from 'antd'
import { authApi } from '@/services/auth'
import { token } from '@/utils/token'

export default function Login() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [loginForm] = Form.useForm()
  const [registerForm] = Form.useForm()

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const data = await authApi.login(values)
      token.set(data.access_token, data.refresh_token)
      navigate('/')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        '用户名或密码错误'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values: {
    username: string
    password: string
    name: string
    phone: string
    email: string
  }) => {
    setLoading(true)
    try {
      await authApi.register(values)
      message.success('注册成功，请登录')
      registerForm.resetFields()
      setActiveTab('login')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        '注册失败，请重试'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo & Title */}
        <div style={styles.header}>
          <div style={styles.logoPlaceholder} />
          <h1 style={styles.title}>药物研发 Agent 工作台</h1>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as 'login' | 'register')}
          centered
          items={[
            {
              key: 'login',
              label: '用户登录',
              children: (
                <Form form={loginForm} layout="vertical" onFinish={handleLogin} style={styles.form}>
                  <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                    <Input placeholder="请输入用户名" size="large" />
                  </Form.Item>
                  <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
                    <Input.Password placeholder="请输入密码" size="large" />
                  </Form.Item>
                  <Form.Item style={{ marginTop: 8 }}>
                    <Button type="primary" htmlType="submit" loading={loading} block size="large">
                      登录系统
                    </Button>
                  </Form.Item>
                  <div style={styles.footer}>
                    还没有账号？
                    <Button type="link" style={styles.link} onClick={() => setActiveTab('register')}>
                      立即注册
                    </Button>
                  </div>
                </Form>
              ),
            },
            {
              key: 'register',
              label: '注册账号',
              children: (
                <Form form={registerForm} layout="vertical" onFinish={handleRegister} style={styles.form}>
                  <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                    <Input placeholder="请输入用户名" size="large" />
                  </Form.Item>
                  <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入真实姓名' }]}>
                    <Input placeholder="请输入真实姓名" size="large" />
                  </Form.Item>
                  <Form.Item
                    label="手机号"
                    name="phone"
                    rules={[{ required: true, message: '请输入手机号' }]}
                  >
                    <Input placeholder="请输入手机号" size="large" />
                  </Form.Item>
                  <Form.Item
                    label="邮箱"
                    name="email"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' },
                    ]}
                  >
                    <Input placeholder="请输入邮箱" size="large" />
                  </Form.Item>
                  <Form.Item
                    label="密码"
                    name="password"
                    rules={[
                      { required: true, message: '请设置密码' },
                      { min: 6, message: '密码至少6位' },
                    ]}
                  >
                    <Input.Password placeholder="请设置密码（至少6位）" size="large" />
                  </Form.Item>
                  <Form.Item style={{ marginTop: 8 }}>
                    <Button type="primary" htmlType="submit" loading={loading} block size="large">
                      立即注册
                    </Button>
                  </Form.Item>
                  <div style={styles.footer}>
                    已有账号？
                    <Button type="link" style={styles.link} onClick={() => setActiveTab('login')}>
                      立即登录
                    </Button>
                  </div>
                </Form>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '40px 48px 32px',
    width: 480,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  header: {
    textAlign: 'center',
    marginBottom: 8,
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    margin: '0 auto 16px',
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    color: '#1a1a1a',
    margin: 0,
  },
  form: {
    marginTop: 16,
  },
  footer: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  link: {
    padding: '0 4px',
    fontSize: 14,
  },
}
