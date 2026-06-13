import MailosaurClient from "mailosaur";

// Mailosaur 資格情報は playwright.config.ts が .dev.vars から process.env に流し込む。
const apiKey = process.env.MAILOSAUR_API_KEY ?? "";
const serverId = process.env.MAILOSAUR_SERVER_ID ?? "";

export const mailosaurConfigured = Boolean(apiKey && serverId);

const client = new MailosaurClient(apiKey);

// `{prefix}-{unique}@{serverId}.mailosaur.net` 形式の使い捨てアドレスを生成する。
export function uniqueEmail(prefix: string): string {
  const unique = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  return `${prefix}-${unique}@${serverId}.mailosaur.net`;
}

// 指定アドレス宛の最新メールを待って取得する。receivedAfter で過去メールを除外できる。
export async function waitForEmail(sentTo: string, receivedAfter?: Date) {
  return client.messages.get(serverId, { sentTo }, { receivedAfter, timeout: 30_000 });
}

type WithLinks = { html?: { links?: { href?: string }[] } };

// メール本文中のリンクから、href に includes を含む最初のものを返す。
export function findLink(message: WithLinks, includes: string): string {
  const links = message.html?.links ?? [];
  const found = links.find((l) => (l.href ?? "").includes(includes));
  if (!found?.href) {
    throw new Error(`Mailosaur: href に "${includes}" を含むリンクが見つかりませんでした。`);
  }
  return found.href;
}
