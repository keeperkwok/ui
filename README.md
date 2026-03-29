# Beryl UI

药物研发 Agent 工作台前端。

---

## Requirements

- Node.js 18+
- pnpm 8+

---

## Setup

```bash
pnpm install
```

---

## Run

```bash
# 开发模式（http://localhost:3000）
pnpm dev

# 生产构建
pnpm build

# 预览生产包
pnpm preview
```

> 开发模式下 `/api` 请求自动代理到 `http://localhost:8002`，请确保 auth_service 已启动。

---

## Stop

前台运行时直接 `Ctrl+C`。

---

## Environment

环境变量文件：

| 文件 | 用途 |
|------|------|
| `.env.development` | 开发环境（已提交，无敏感信息） |
| `.env.production` | 生产环境（不提交，自行创建） |

| 变量 | 开发默认 | 说明 |
|------|----------|------|
| `VITE_API_BASE_URL` | 空 | 开发时留空，走 Vite proxy 到 `localhost:8002`；生产填写实际地址 |

生产环境示例：
```bash
cp .env.example .env.production
# 编辑 .env.production
VITE_API_BASE_URL=https://api.your-domain.com
```
