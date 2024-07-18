# Telegram Bot with Groq Integration

这是一个运行在 Cloudflare Workers 上的 Telegram 机器人项目，集成了 Groq AI 功能。该机器人可以在群组中欢迎新成员，并能够回答私聊和群聊中的问题。

## 功能特点

- 自动欢迎加入群组的新成员
- 回答私聊消息
- 在群聊中通过@机器人名称触发回答
- 使用 Groq AI 生成回复

## 快速开始

1. 克隆此仓库到本地

```bash
git clone <repository-url>
cd <repository-name>
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量

在项目根目录创建一个`.env`文件，添加以下内容：

```
BOT_TOKEN=your_telegram_bot_token
BOT_INFO={"id": your_bot_id, "first_name": "Your Bot Name", "username": "your_bot_username"}
GROQ_API_KEY=your_groq_api_key
```

确保替换上述占位符为你的实际配置信息。

4. 本地开发

```bash
npm run dev
```

5. 部署到 Cloudflare Workers

```bash
npm run deploy
```

## 使用说明

- 将机器人添加到你的 Telegram 群组中
- 当新成员加入时，机器人会自动发送欢迎消息
- 在私聊中直接向机器人发送消息，它会使用 Groq AI 生成回复
- 在群聊中，通过@机器人的用户名来触发回复

## 注意事项

- 确保你的 Cloudflare Workers 账户已正确设置
- 需要一个有效的 Telegram Bot Token 和 Groq API 密钥
- 机器人的响应可能需要一些时间，特别是在处理长消息时

## 贡献

欢迎提交问题和拉取请求来改进这个项目！