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
import { Bot, Composer, Context, NextFunction, webhookCallback } from "grammy";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const bot = new Bot(env.BOT_TOKEN, { botInfo: JSON.parse(env.BOT_INFO) });

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

		composer.use(responseTime);

		bot.command("start", async (ctx: Context) => {
			await ctx.reply("Hello, Brother blockchain!");
		});

		bot.on("::mention", async (ctx: Context) => {
			const { username } = await bot.api.getMe();
			const botUsername = `@${username}`;
			console.info(ctx.message?.text, ctx.chat?.type);
			// 检查消息是否来自频道
			if (ctx.chat?.type !== "supergroup") return;
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
			console.info('收到消息：', messageText);
			await ctx.reply(`有人在叫我吗？我知道了！${messageText}`, {
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
		})

		return webhookCallback(bot, "cloudflare-mod")(request);
	},
} satisfies ExportedHandler<Env>;
