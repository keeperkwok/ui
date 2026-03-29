import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Avatar, Button, Input, Spin, Tooltip, Typography, message } from 'antd'
import { ArrowUpOutlined, MessageOutlined, UserOutlined } from '@ant-design/icons'
import BeeIcon from '@/components/BeeIcon'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Sidebar from '@/components/layout/Sidebar'
import SessionDrawer from '@/components/SessionDrawer'
import { authApi, type UserInfo } from '@/services/auth'
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
  sentAt?: string          // ISO timestamp
  tokenCount?: number | null
  durationMs?: number | null
  ttfMs?: number | null
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
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => {
    authApi.getMe().then(setUserInfo).catch(() => null)
  }, [])

  // Reset to new session whenever sidebar navigates here
  useEffect(() => {
    if ((location.state as { newSession?: number } | null)?.newSession) {
      setActiveSession(null)
      setMessages([])
    }
  }, [location.state])

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
        sentAt: m.created_at,
        tokenCount: m.token_count,
        durationMs: m.duration_ms,
        ttfMs: m.ttf_ms,
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

    const sentAt = new Date().toISOString()

    // Append user message immediately
    setMessages((prev) => [...prev, { role: 'user', content, sentAt }])

    // Placeholder for assistant streaming
    setMessages((prev) => [...prev, { role: 'assistant', content: '', streaming: true }])

    try {
      let full = ''
      let metaSnapshot: { tokenCount: number | null; durationMs: number | null; ttfMs: number | null } | null = null

      for await (const delta of chatApi.streamChat(
        session.id,
        content,
        (meta) => { metaSnapshot = meta },
      )) {
        full += delta
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: full, streaming: true }
          return next
        })
      }
      // Mark streaming done, attach meta
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = {
          role: 'assistant',
          content: full,
          sentAt: new Date().toISOString(),
          tokenCount: metaSnapshot?.tokenCount ?? null,
          durationMs: metaSnapshot?.durationMs ?? null,
          ttfMs: metaSnapshot?.ttfMs ?? null,
        }
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
              <div style={styles.orbWrap}>
                <BeeIcon size={64} />
              </div>
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
                messages.map((msg, i) => {
                  const isUser = msg.role === 'user'
                  const userInitial = userInfo?.name?.[0] ?? userInfo?.username?.[0]?.toUpperCase() ?? 'U'
                  const timeStr = msg.sentAt
                    ? new Date(msg.sentAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : null

                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 10 }}>
                      {/* Avatar */}
                      {isUser ? (
                        <Avatar size={32} style={styles.userAvatar} icon={!userInitial ? <UserOutlined /> : undefined}>
                          {userInitial}
                        </Avatar>
                      ) : (
                        <div style={styles.agentAvatar}>
                          <BeeIcon size={20} />
                        </div>
                      )}

                      {/* Bubble + meta */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', maxWidth: '72%' }}>
                        <div style={isUser ? styles.userBubble : styles.assistantBubble}>
                          {isUser ? (
                            <Typography.Text style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#fff' }}>
                              {msg.content}
                            </Typography.Text>
                          ) : msg.streaming && !msg.content ? (
                            <div style={styles.typingIndicator}>
                              <span style={{ ...styles.dot, animationDelay: '0ms' }} />
                              <span style={{ ...styles.dot, animationDelay: '160ms' }} />
                              <span style={{ ...styles.dot, animationDelay: '320ms' }} />
                            </div>
                          ) : (
                            <div className="md-body" style={styles.markdownBody}>
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  code({ className, children, ...rest }) {
                                    const match = /language-(\w+)/.exec(className || '')
                                    const inline = !match
                                    return inline ? (
                                      <code style={styles.inlineCode} {...rest}>{children}</code>
                                    ) : (
                                      <SyntaxHighlighter
                                        style={oneLight}
                                        language={match[1]}
                                        PreTag="div"
                                        customStyle={styles.codeBlock}
                                      >
                                        {String(children).replace(/\n$/, '')}
                                      </SyntaxHighlighter>
                                    )
                                  },
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                              {msg.streaming && <span style={styles.cursor}>▋</span>}
                            </div>
                          )}
                        </div>

                        {/* Timestamp + meta */}
                        <div style={styles.msgMeta}>
                          {timeStr && (
                            <Tooltip title={new Date(msg.sentAt!).toLocaleString('zh-CN')}>
                              <span>{timeStr}</span>
                            </Tooltip>
                          )}
                          {!isUser && msg.ttfMs != null && (
                            <span>首响 {(msg.ttfMs / 1000).toFixed(1)}s</span>
                          )}
                          {!isUser && msg.durationMs != null && (
                            <span>耗时 {(msg.durationMs / 1000).toFixed(1)}s</span>
                          )}
                          {!isUser && msg.tokenCount != null && (
                            <span>{msg.tokenCount} tokens</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
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
  orbWrap: {
    marginBottom: 20,
    filter: 'drop-shadow(0 6px 18px rgba(251,191,36,0.45))',
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
  userAvatar: {
    background: '#764ba2',
    flexShrink: 0,
  },
  agentAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: '#FFFBEB',
    border: '1px solid #FDE68A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userBubble: {
    background: '#1677ff',
    color: '#fff',
    borderRadius: '16px 16px 4px 16px',
    padding: '10px 14px',
  },
  assistantBubble: {
    background: '#fff',
    border: '1px solid #f0f0f0',
    borderRadius: '16px 16px 16px 4px',
    padding: '10px 14px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  msgMeta: {
    display: 'flex',
    gap: 8,
    marginTop: 4,
    fontSize: 11,
    color: '#9ca3af',
  },
  cursor: {
    display: 'inline-block',
    animation: 'blink 1s step-end infinite',
    marginLeft: 2,
    color: '#1677ff',
  },
  markdownBody: {
    fontSize: 14,
    lineHeight: 1.7,
    wordBreak: 'break-word',
  },
  inlineCode: {
    background: '#f3f4f6',
    borderRadius: 4,
    padding: '1px 5px',
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#d63384',
  },
  codeBlock: {
    borderRadius: 8,
    fontSize: 13,
    margin: '8px 0',
  },
  typingIndicator: {
    display: 'flex',
    gap: 5,
    alignItems: 'center',
    padding: '4px 2px',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#9ca3af',
    display: 'inline-block',
    animation: 'dotBounce 1.2s ease-in-out infinite',
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
