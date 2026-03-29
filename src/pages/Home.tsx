import { useState } from 'react'
import { Button, Input, Select, Tag } from 'antd'
import { ArrowUpOutlined } from '@ant-design/icons'
import Sidebar from '@/components/layout/Sidebar'

const SUGGESTED_TOPICS = [
  '四代EGFR抑制剂竞争格局',
  'PD-1/PD-L1 最新临床进展',
  'KRAS G12C 抑制剂综述',
  'HER2 ADC 药物对比分析',
  'ALK 耐药突变谱汇总',
]

const AGENT_CARDS = [
  { id: 1, color: '#fff3e0', emoji: '📊' },
  { id: 2, color: '#e8f4fd', emoji: '🖥️' },
  { id: 3, color: '#e8f0fe', emoji: '📈' },
]

export default function Home() {
  const [inputValue, setInputValue] = useState('')

  const handleTopicClick = (topic: string) => {
    setInputValue(topic)
  }

  return (
    <div style={styles.layout}>
      <Sidebar />

      <main style={styles.main}>
        {/* Center content */}
        <div style={styles.center}>
          {/* Purple orb */}
          <div style={styles.orb} />

          <h1 style={styles.title}>药物研发 Agent 工作台</h1>

          {/* Chat input */}
          <div style={styles.inputBox}>
            <Input.TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="询问任何问题，创造任何事物..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              bordered={false}
              style={styles.textarea}
            />
            <div style={styles.inputFooter}>
              <Select
                defaultValue="快速问答"
                bordered={false}
                style={{ width: 110, color: '#555' }}
                options={[{ value: '快速问答', label: '快速问答' }]}
              />
              <Button
                type="primary"
                shape="circle"
                icon={<ArrowUpOutlined />}
                disabled={!inputValue.trim()}
              />
            </div>
          </div>

          {/* Suggested topics */}
          <div style={styles.topics}>
            {SUGGESTED_TOPICS.map((topic) => (
              <Tag
                key={topic}
                style={styles.topic}
                onClick={() => handleTopicClick(topic)}
              >
                {topic}
              </Tag>
            ))}
          </div>
        </div>

        {/* Agents section */}
        <div style={styles.agentsSection}>
          <div style={styles.agentsHeader}>
            <span style={styles.agentsTitle}>Agents</span>
            <Button type="link" style={{ padding: 0, fontSize: 13, color: '#8c8c8c' }}>
              更多 &gt;
            </Button>
          </div>
          <div style={styles.agentCards}>
            {AGENT_CARDS.map((card) => (
              <div key={card.id} style={{ ...styles.agentCard, background: card.color }}>
                <span style={{ fontSize: 32 }}>{card.emoji}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
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
    alignItems: 'center',
    padding: '0 40px 40px',
    minHeight: '100vh',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 80,
    width: '100%',
    maxWidth: 640,
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
    marginBottom: 28,
    textAlign: 'center',
  },
  inputBox: {
    width: '100%',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '12px 16px 8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
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
  topics: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 20,
    justifyContent: 'center',
  },
  topic: {
    cursor: 'pointer',
    padding: '4px 10px',
    borderRadius: 16,
    fontSize: 13,
    color: '#555',
    border: '1px solid #e5e7eb',
    background: '#fff',
    userSelect: 'none',
  },
  agentsSection: {
    width: '100%',
    maxWidth: 800,
    marginTop: 48,
  },
  agentsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  agentsTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1a1a1a',
  },
  agentCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
  },
  agentCard: {
    borderRadius: 12,
    height: 120,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
}
