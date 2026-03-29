import { useState, useEffect, useRef } from 'react'
import { Button, Input, Spin, Typography, message } from 'antd'
import { ArrowUpOutlined, MessageOutlined } from '@ant-design/icons'
import Sidebar from '@/components/layout/Sidebar'
import SessionDrawer from '@/components/SessionDrawer'
import { chatApi, type Session, type Message } from '@/services/chat'

const SUGGESTED_TOPICS = [
  '四代EGFR抑制剂竞争格局',
  'PD-1/PD-L1 最新临床进展',
  'KRAS G12C 抑制剂综述',
  'HER2 ADC 药物对比分析',
  'ALK 耐药突变谱汇总',
]

interface DisplayMessage {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

export default function Home() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load sessions when drawer opens
  useEffect(() => {
    if (!drawerOpen) return
    setLoadingSessions(true)
    chatApi.listSessions()
      .then(setSessions)
      .catch(() => null)
      .finally(() => setLoadingSessions(false))
  }, [drawerOpen])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const switchSession = async (session: Session) => {
    setActiveSession(session)
    setMessages([])
    setLoadingHistory(true)
    try {
      const detail = await chatApi.getSession(session.id)
      setMessages(detail.messages.map((m: Message) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })))
    } catch {
      message.error('加载会话历史失败')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSend = async () => {
    const content = input.trim()
    if (!content || sending) return

    setInput('')
    setSending(true)

    // Create session lazily on first send
    let session = activeSession
    const isFirstMessage = messages.length === 0
    if (!session) {
      try {
        session = await chatApi.createSession()
        setActiveSession(session)
        setSessions((prev) => [session!, ...prev])
      } catch {
        message.error('创建会话失败')
        setSending(false)
        return
      }
    }

    // Append user message immediately
    setMessages((prev) => [...prev, { role: 'user', content }])

    // Placeholder for assistant streaming
    setMessages((prev) => [...prev, { role: 'assistant', content: '', streaming: true }])

    try {
      let full = ''
      for await (const delta of chatApi.streamChat(session.id, content)) {
        full += delta
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: full, streaming: true }
          return next
        })
      }
      // Mark streaming done
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: full }
        return next
      })
      // After first message, generate a title in the background
      if (isFirstMessage) {
        chatApi.generateTitle(session.id)
          .then((updated) => {
            setActiveSession(updated)
            setSessions((prev) => prev.map((s) => s.id === updated.id ? updated : s))
          })
          .catch(() => null)
      }
    } catch {
      message.error('发送失败，请重试')
      setMessages((prev) => prev.slice(0, -1)) // remove empty assistant bubble
    } finally {
      setSending(false)
    }
  }

  const showWelcome = messages.length === 0

  return (
    <div style={styles.layout}>
      <Sidebar />

      <main style={styles.main}>
        {/* Session button — top right */}
        <div style={styles.topBar}>
          <Button
            icon={<MessageOutlined />}
            onClick={() => setDrawerOpen(true)}
          >
            会话
          </Button>
        </div>

        {/* Welcome / message list */}
        <div style={styles.chatArea}>
          {showWelcome ? (
            <div style={styles.welcome}>
              <div style={styles.orb} />
              <h1 style={styles.title}>Agent 工作台</h1>
              <div style={styles.topics}>
                {SUGGESTED_TOPICS.map((topic) => (
                  <Button
                    key={topic}
                    size="small"
                    style={styles.topicBtn}
                    onClick={() => setInput(topic)}
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div style={styles.messageList}>
              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={msg.role === 'user' ? styles.userBubble : styles.assistantBubble}>
                      <Typography.Text style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {msg.content}
                        {msg.streaming && <span style={styles.cursor}>▋</span>}
                      </Typography.Text>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div style={styles.inputWrapper}>
          <div style={styles.inputBox}>
            <Input.TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入消息，按 Enter 发送..."
              autoSize={{ minRows: 1, maxRows: 5 }}
              bordered={false}
              disabled={sending}
              style={styles.textarea}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
            <div style={styles.inputFooter}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Shift+Enter 换行
              </Typography.Text>
              <Button
                type="primary"
                shape="circle"
                icon={sending ? <Spin size="small" /> : <ArrowUpOutlined />}
                disabled={!input.trim() || sending}
                onClick={handleSend}
              />
            </div>
          </div>
        </div>
      </main>

      <SessionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sessions={sessions}
        loading={loadingSessions}
        activeSessionId={activeSession?.id ?? null}
        onSelect={switchSession}
        onNewSession={() => {
          setActiveSession(null)
          setMessages([])
        }}
        onDeleted={(id) => {
          setSessions((prev) => prev.filter((s) => s.id !== id))
          if (activeSession?.id === id) {
            setActiveSession(null)
            setMessages([])
          }
        }}
      />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: '#fafafa',
  },
  main: {
    marginLeft: 64,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '12px 24px',
    borderBottom: '1px solid #f0f0f0',
    background: '#fff',
    flexShrink: 0,
  },
  chatArea: {
    flex: 1,
    overflow: 'auto',
    padding: '0 24px',
  },
  welcome: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 80,
  },
  orb: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 35%, #c084fc, #7c3aed 60%, #4f46e5)',
    boxShadow: '0 8px 32px rgba(124,58,237,0.35)',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  topics: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 8,
  },
  topicBtn: {
    borderRadius: 16,
    fontSize: 13,
    color: '#555',
  },
  messageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: '24px 0',
    maxWidth: 760,
    margin: '0 auto',
    width: '100%',
  },
  userBubble: {
    background: '#1677ff',
    color: '#fff',
    borderRadius: '16px 16px 4px 16px',
    padding: '10px 14px',
    maxWidth: '70%',
  },
  assistantBubble: {
    background: '#fff',
    border: '1px solid #f0f0f0',
    borderRadius: '16px 16px 16px 4px',
    padding: '10px 14px',
    maxWidth: '70%',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  cursor: {
    display: 'inline-block',
    animation: 'blink 1s step-end infinite',
    marginLeft: 2,
    color: '#1677ff',
  },
  inputWrapper: {
    padding: '12px 24px 20px',
    background: '#fafafa',
    flexShrink: 0,
  },
  inputBox: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '12px 16px 8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    maxWidth: 760,
    margin: '0 auto',
  },
  textarea: {
    fontSize: 15,
    resize: 'none',
    padding: 0,
  },
  inputFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
}
