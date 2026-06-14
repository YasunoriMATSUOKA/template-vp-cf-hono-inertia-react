import MailosaurClient from "mailosaur";

// Mailosaur 資格情報は playwright.config.ts が .env / .dev.vars を parse して
// process.env に流し込む (実値は .env 側の MAILOSAUR_*)。
const apiKey = process.env.MAILOSAUR_API_KEY ?? "";
const serverId = process.env.MAILOSAUR_SERVER_ID ?? "";

export const mailosaurConfigured = Boolean(apiKey && serverId);

const client = new MailosaurClient(apiKey);

// この run 固有の ID (playwright.config.ts が全ワーカー共通で process.env に設定する)。
// 生成アドレスに埋め込むことで、global-teardown が「自分の run が作ったユーザー」だけを
// 削除できる (= 同時並行 run の使用中ユーザーを巻き込まない)。ハイフンを含まない base36 なので
// teardown 側の `LIKE '%-{runId}-%'` 区切りが一意に効く。
const runId = process.env.E2E_RUN_ID ?? "norun";

// `{prefix}-{runId}-{unique}@{serverId}.mailosaur.net` 形式の使い捨てアドレスを生成する。
export function uniqueEmail(prefix: string): string {
  const unique = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  return `${prefix}-${runId}-${unique}@${serverId}.mailosaur.net`;
}

// 指定アドレス宛の最新メールを待って取得する。receivedAfter で過去メールを除外できる。
export async function waitForEmail(sentTo: string, receivedAfter?: Date) {
  return client.messages.get(serverId, { sentTo }, { receivedAfter, timeout: 30_000 });
}

type Links = { links?: { href?: string }[] };
type WithLinks = { html?: Links; text?: Links };

// メール本文中のリンクから、href に includes を含む最初のものを返す。
// メールリレーは text のみ転送するので text.links を優先し、html があれば併せて見る。
export function findLink(message: WithLinks, includes: string): string {
  const links = [...(message.text?.links ?? []), ...(message.html?.links ?? [])];
  const found = links.find((l) => (l.href ?? "").includes(includes));
  if (!found?.href) {
    throw new Error(`Mailosaur: href に "${includes}" を含むリンクが見つかりませんでした。`);
  }
  return found.href;
}
