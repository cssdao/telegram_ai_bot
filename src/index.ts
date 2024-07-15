/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { Bot, Composer, Context, GrammyError, HttpError, NextFunction, webhookCallback } from "grammy";
import Groq from "groq-sdk";

function escapeMarkdown(text: string) {
	return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

const welcomeMessages = [
	"欢迎 {name} 加入我们的大家庭！希望你在这里能找到志同道合的朋友。",
	"嘿，{name}！很高兴你来到这里。我们准备了热茶和小饼干，快来聊聊天吧！",
	"{name} 来啦！我们的圈子因为你的加入而变得更精彩。",
	"热烈欢迎 {name}！这里就是你的第二个家，随时感到自在哦。",
	"看看是谁来了？{name}，欢迎你！我们迫不及待想听听你的故事了。",
	"嗨 {name}，欢迎登船！系好安全带，我们准备启程去探险啦！",
	"{name} 成功加入我们的小队！准备好一起学习、分享和成长了吗？",
	"欢迎 {name} 来到我们的知识乐园！这里的每一天都有新发现哦。",
	"哇！{name} 来了！我们的话题圈又添一位有趣的灵魂。",
	"亲爱的 {name}，从现在开始，你就是我们中的一员啦！一起来创造美好回忆吧。"
];

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const bot = new Bot(env.BOT_TOKEN, { botInfo: JSON.parse(env.BOT_INFO) });
		const groq = new Groq({ apiKey: env.GROQ_API_KEY });

		/** 统计 bot 的响应时间，并将其记录到 `console`。 */
		async function responseTime(
			ctx: Context,
			next: NextFunction, // 这是 `() => Promise<void>` 的一个别名
		): Promise<void> {
			// 开始计时
			const before = Date.now(); // 毫秒
			// 调用下游的中间件
			await next(); // 请务必使用 `await`！
			// 停止计时
			const after = Date.now(); // 毫秒
			// 打印时间差
			// console.log(`Response time: ${after - before} ms`);
			ctx.reply(`响应时间：${after - before} 毫秒`);
		}

		const composer = new Composer();

		bot.use(composer);

		// composer.use(responseTime);

		// 监听新成员加入事件
		bot.chatType("supergroup").on("message:new_chat_members", async (ctx) => {
			// 获取新加入的成员列表
			const newMembers = ctx.message.new_chat_members;

			for (const member of newMembers) {
				// 构建欢迎消息
				const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
				const name = member.username ? `@${member.username}` : (member.first_name + (member.last_name || '')).trim();
				const personalizedMessage = randomMessage.replace("{name}", name);
				const message = `
${personalizedMessage}

🌟 这里有几个小贴士帮你快速融入我们：
1️⃣ 可以简单介绍下自己哦
2️⃣ 看看群置顶，了解我们的日常话题
3️⃣ 随时提问，大家都很乐意帮忙

再次欢迎你的加入！让我们一起度过愉快的时光吧~ 😊
    `;
				// 发送欢迎消息
				await ctx.reply(message);
			}
		});

		bot.chatType("private").on("message", async (ctx: Context) => {
			const messageText = ctx.message?.text;

			if (!messageText) return;
			console.info('私聊消息：', messageText);
			const replay = await ctx.reply("...")
			let fullText = "";
			try {
				// const stream = await groq.chat.completions.create({
				// 	messages: [
				// 		{
				// 			"role": "system", "content": ""
				// 		},
				// 		{
				// 			role: "user",
				// 			content: messageText,
				// 		},
				// 	],
				// 	model: "gemma2-9b-it",
				// 	stream: true
				// });
				// for await (const chunk of stream) {
				// 	console.info("chunk: ", chunk)
				// 	const { choices = [] } = chunk;
				// 	const { finish_reason = '', delta: { content = '' } = {} } = choices[0] || {};

				// 	if (!content?.trimEnd()) continue;
				// 	console.info("fullText: ", fullText, '-', content)
				// 	fullText += content.trimEnd()

				// 	await bot.api.editMessageText(
				// 		replay.chat.id,
				// 		replay.message_id,
				// 		fullText
				// 	)
				// }
				const chatCompletion = await groq.chat.completions.create({
					messages: [
						{
							"role": "user",
							"content": messageText
						}
					],
					model: "gemma2-9b-it"
				})

				await bot.api.editMessageText(
					replay.chat.id,
					replay.message_id,
					chatCompletion.choices[0]?.message?.content || ""
				)
			} catch (error) {
				// console.error(error)
				await bot.api.editMessageText(
					replay.chat.id,
					replay.message_id,
					"发生了未知错误"
				)
			}
		})

		bot.chatType("supergroup").on("::mention", async (ctx: Context) => {
			const { username } = await bot.api.getMe();
			const botUsername = `@${username}`;

			if (!ctx.message?.text?.includes(botUsername)) return;
			let messageText = '';

			if (ctx.message?.text) {
				messageText = ctx.message.text.replace(botUsername, '').trim();
			} else {
				await ctx.reply(`我现在只支持文字互动，请发文字与我互动`, {
					reply_parameters: {
						message_id: ctx.msg?.message_id || 0
					},
					reply_markup: {
						force_reply: true,
						// inline_keyboard: [
						// 	[{ text: '赞', callback_data: 'like' }],
						// 	[{ text: '踩', callback_data: 'dislike' }]
						// ]
					}
				})

				return;
			}
			console.info('群聊消息：', messageText);

			const replay = await ctx.reply("...", {
				reply_parameters: {
					message_id: ctx.message.message_id
				}
			})
			let fullText = "";
			try {
				// const stream = await groq.chat.completions.create({
				// 	messages: [
				// 		{
				// 			"role": "system", "content": ""
				// 		},
				// 		{
				// 			role: "user",
				// 			content: messageText,
				// 		},
				// 	],
				// 	model: "gemma2-9b-it",
				// 	stream: true
				// });
				// for await (const chunk of stream) {
				// 	const { choices = [] } = chunk;
				// 	const { finish_reason = '', delta: { content = '' } = {} } = choices[0] || {};
				// 	fullText += content
				// 	await bot.api.editMessageText(
				// 		replay.chat.id,
				// 		replay.message_id,
				// 		fullText
				// 	)
				// }
				const chatCompletion = await groq.chat.completions.create({
					messages: [
						{
							"role": "user",
							"content": messageText
						}
					],
					model: "gemma2-9b-it"
				})

				await bot.api.editMessageText(
					replay.chat.id,
					replay.message_id,
					chatCompletion.choices[0]?.message?.content || ""
				)
			} catch (error) {
				console.error(error)
				await bot.api.editMessageText(
					replay.chat.id,
					replay.message_id,
					"发生了未知错误"
				)
			}
		})

		bot.catch(async (err) => {
			const ctx = err.ctx;
			console.error(`Error while handling update ${ctx.update.update_id}:`);
			const e = err.error;

			let errorMessage = "抱歉，发生了一个错误。我们会尽快修复它。";

			if (e instanceof GrammyError) {
				console.error("Error in request:", e.description);
				errorMessage = "抱歉，我暂时无法完成这个请求。请稍后再试。";
			} else if (e instanceof HttpError) {
				console.error("Could not contact Telegram:", e);
				errorMessage = "抱歉，我现在无法连接到 Telegram 服务器。请稍后再试。";
			} else {
				console.error("Unknown error:", e);
			}

			try {
				await ctx.reply(errorMessage);
			} catch (replyError) {
				console.error("Error while sending error message to user:", replyError);
			}
		});

		return webhookCallback(bot, "cloudflare-mod")(request);
	},
} satisfies ExportedHandler<Env>;
