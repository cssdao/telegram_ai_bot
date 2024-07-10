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
import { Bot, Context, webhookCallback } from "grammy";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const bot = new Bot(env.BOT_TOKEN, { botInfo: JSON.parse(env.BOT_INFO) });

		bot.command("start", async (ctx: Context) => {
			await ctx.reply("Hello, Brother blockchain!");
		});

		return webhookCallback(bot, "cloudflare-mod")(request);
	},
} satisfies ExportedHandler<Env>;
