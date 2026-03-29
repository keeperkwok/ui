import { useState } from 'react'
import { Button, Drawer, List, Typography, Empty, Spin, Popconfirm, message } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { chatApi, type Session } from '@/services/chat'

interface Props {
  open: boolean
  onClose: () => void
  sessions: Session[]
  loading: boolean
  activeSessionId: string | null
  onSelect: (session: Session) => void
  onNewSession: () => void
  onDeleted: (sessionId: string) => void
}

export default function SessionDrawer({
  open, onClose, sessions, loading, activeSessionId, onSelect, onNewSession, onDeleted,
}: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleNewSession = () => {
    onNewSession()
    onClose()
  }

  const handleDelete = async (e: React.MouseEvent | undefined, sessionId: string) => {
    e?.stopPropagation()
    setDeletingId(sessionId)
    try {
      await chatApi.deleteSession(sessionId)
      onDeleted(sessionId)
    } catch {
      message.error('删除会话失败')
    } finally {
      setDeletingId(null)
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    return isToday
      ? d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }

  return (
    <Drawer
      title="会话列表"
      placement="right"
      width={300}
      open={open}
      onClose={onClose}
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="small"
          onClick={handleNewSession}
        >
          新建会话
        </Button>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: 40 }}>
          <Spin />
        </div>
      ) : sessions.length === 0 ? (
        <Empty description="点击「新建会话」开始对话" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          dataSource={sessions}
          renderItem={(s) => (
            <List.Item
              style={{
                cursor: 'pointer',
                padding: '10px 12px',
                borderRadius: 8,
                background: s.id === activeSessionId ? '#f0f5ff' : 'transparent',
                marginBottom: 4,
              }}
              onClick={() => { onSelect(s); onClose() }}
            >
              <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                <Typography.Text
                  strong={s.id === activeSessionId}
                  ellipsis
                  style={{ display: 'block', color: s.id === activeSessionId ? '#1677ff' : undefined }}
                >
                  {s.title}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {formatTime(s.updated_at)}
                </Typography.Text>
              </div>
              <Popconfirm
                title="删除会话"
                description="确定要删除这个会话吗？"
                okText="删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
                onConfirm={(e) => handleDelete(e, s.id)}
                onCancel={(e) => e?.stopPropagation()}
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  loading={deletingId === s.id}
                  onClick={(e) => e.stopPropagation()}
                />
              </Popconfirm>
            </List.Item>
          )}
        />
      )}
    </Drawer>
  )
}
