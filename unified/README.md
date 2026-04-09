# Unified Project (Frontend + Backend + Cloud DB)

本项目把你仓库中两套实现的优势合并成一个“统一版”：

- **前端**：保留“测评 / 故事 / 我的”三页完整交互（类似根目录 `index (2).html` 的完整页面体验），但改为 React + Vite 便于扩展与部署。
- **后端**：保留现有 API 能力（`/api/questions`、`/api/analyze`、`/api/chat`），并把**人物库/故事数据**迁移为**云端数据库（Supabase Postgres）**读取；题库保持后端固定（免维护）。

---

## 目录结构

```text
unified/
  frontend/   # React + Vite
  backend/    # FastAPI + Supabase + DeepSeek
```

---

## 后端（FastAPI）

### 1) 安装依赖

```bash
cd unified/backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 2) 配置环境变量

复制 `.env.example` 为 `.env`，并填写：

- `DEEPSEEK_API_KEY`：模型调用
- `SUPABASE_URL`、`SUPABASE_KEY`：Supabase 项目连接信息

### 3) 初始化 Supabase 表

在 Supabase SQL Editor 执行 `schema.sql`。
可选执行 `seed.sql` 写入示例人物数据。

### 4) 启动后端

```bash
uvicorn main:app --reload --port 8000
```

---

## 前端（React + Vite）

### 1) 安装依赖

```bash
cd unified/frontend
npm install
```

### 2) 配置 API 地址（可选）

复制 `.env.example` 为 `.env`，修改 `VITE_API_BASE` 指向你的后端，例如：

- `http://127.0.0.1:8000/api`

### 3) 启动前端

```bash
npm run dev
```

