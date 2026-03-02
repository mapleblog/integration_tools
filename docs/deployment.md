# 部署指南 (Deployment Guide)

本文档将指导您将 **VersaTools** 部署到生产环境。

## 方案一：Vercel (推荐)

Vercel 是 Next.js 的官方平台，提供最佳的性能和开发者体验。

### 1. 准备工作
- 确保代码已推送到 GitHub / GitLab / Bitbucket。
- 确保您已注册 Vercel 账号。

### 2. 连接项目
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)。
2. 点击 "Add New..." -> "Project"。
3. 导入您的 **VersaTools** 仓库。

### 3. 配置环境变量
在 "Configure Project" 页面，展开 "Environment Variables" 部分，根据 `.env.example` 填入必要的变量：

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | Prisma 连接字符串 (必须) | `postgresql://...` |
| `DIRECT_URL` | Prisma 直连字符串 (必须) | `postgresql://...` |
| `DEEPSEEK_API_KEY` | 翻译工具 API Key (可选) | `sk-xxxxxxxx` |

### 4. 部署
- 点击 "Deploy"。
- Vercel 会自动识别 Next.js 项目并开始构建。
- 构建完成后，您的项目将上线，并获得一个自动分配的域名。

### 5. 数据库迁移
在项目部署成功后，您可能需要运行数据库迁移。由于 Vercel 是 Serverless 环境，推荐在本地连接生产数据库运行迁移，或者在 Vercel 的 "Settings" -> "Build & Development Settings" -> "Build Command" 中修改为：
```bash
npx prisma migrate deploy && next build
```
但这会增加构建时间。通常建议在本地或 CI/CD 流程中执行迁移。

---

## 方案二：Docker / Railway / Zeabur

如果您希望使用容器化部署，或者需要长时间运行的后端任务，可以使用 Docker。

### 1. Docker 镜像构建
项目已包含优化过的 `Dockerfile`，支持 Next.js 的 Standalone 模式。

```bash
# 构建镜像
docker build -t versatools .

# 运行容器
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e DIRECT_URL="postgresql://..." \
  versatools
```

### 2. 部署到 Railway
1. 在 Railway 创建新项目。
2. 选择 "Deploy from GitHub repo"。
3. Railway 会自动检测 `Dockerfile` 并构建。
4. 在 Railway 项目设置中添加环境变量（Variables）。
5. 同样需要配置 PostgreSQL 数据库（Railway 提供一键添加 Postgres 插件）。

### 3. 注意事项
- **Sharp & Image Optimization**: Dockerfile 基于 `node:20-bullseye-slim`，已包含运行 `sharp` 所需的基本库。
- **Prisma**: 容器启动时默认只运行 `node server.js`。如果需要自动迁移数据库，可以修改 `CMD` 或使用 `Entrypoint` 脚本，例如：
  ```bash
  # 在 Dockerfile 或启动命令中
  CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
  ```

## 常见问题

**Q: 部署后图片处理工具报错？**
A: 请检查 `next.config.ts` 中的 `serverExternalPackages` 是否包含 `sharp` 和 `@imgly/background-removal-node`。如果使用的是 Vercel，通常会自动处理。如果使用 Docker，请确保基础镜像兼容。

**Q: 翻译功能不工作？**
A: 请检查 `DEEPSEEK_API_KEY` 是否正确设置，且账户有余额。
