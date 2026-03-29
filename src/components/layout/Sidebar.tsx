import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Avatar, Dropdown } from 'antd'
import { HomeOutlined, RobotOutlined, LogoutOutlined } from '@ant-design/icons'
import { authApi, type UserInfo } from '@/services/auth'
import { token } from '@/utils/token'
import BeeIcon from '@/components/BeeIcon'

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState<UserInfo | null>(null)

  useEffect(() => {
    authApi.getMe().then(setUser).catch(() => null)
  }, [])

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    } finally {
      token.clear()
      navigate('/login')
    }
  }

  const navItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/agents', icon: <RobotOutlined />, label: 'Agents' },
  ]

  return (
    <div style={styles.sidebar}>
      {/* Brand icon */}
      <div style={styles.brand}>
        <BeeIcon size={32} />
      </div>

      {/* Nav items */}
      <nav style={styles.nav}>
        {navItems.map((item) => (
          <div
            key={item.key}
            style={{
              ...styles.navItem,
              ...(location.pathname === item.key ? styles.navItemActive : {}),
            }}
            onClick={() => navigate(item.key, { state: { newSession: Date.now() } })}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span style={styles.navLabel}>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* User avatar at bottom */}
      <div style={styles.userArea}>
        <Dropdown
          menu={{
            items: [
              {
                key: 'name',
                label: (
                  <span style={{ color: '#595959' }}>
                    {user?.name || user?.username || '—'}
                  </span>
                ),
                disabled: true,
              },
              { type: 'divider' },
              {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: '退出登录',
                danger: true,
                onClick: handleLogout,
              },
            ],
          }}
          placement="topLeft"
        >
          <div style={styles.userBtn}>
            <Avatar size={32} style={{ background: '#764ba2', flexShrink: 0 }}>
              {user?.name?.[0] ?? user?.username?.[0]?.toUpperCase() ?? 'U'}
            </Avatar>
            <span style={styles.username}>{user?.username ?? ''}</span>
          </div>
        </Dropdown>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 64,
    minHeight: '100vh',
    background: '#fff',
    borderRight: '1px solid #f0f0f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 12,
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
  },
  brand: {
    marginBottom: 24,
    padding: 8,
  },
  nav: {
    flex: 1,
    width: '100%',
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px 0',
    cursor: 'pointer',
    color: '#8c8c8c',
    fontSize: 11,
    gap: 4,
    transition: 'color 0.2s',
  },
  navItemActive: {
    color: '#1677ff',
  },
  navIcon: {
    fontSize: 20,
  },
  navLabel: {
    fontSize: 11,
  },
  userArea: {
    paddingBottom: 16,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  userBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
    padding: '8px 0',
  },
  username: {
    fontSize: 10,
    color: '#8c8c8c',
    maxWidth: 56,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'center',
  },
}
