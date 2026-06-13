import { and, eq } from "drizzle-orm";
import type { Db } from "~/server/db";
import { account } from "~/server/db/schema";

// email/password の資格情報アカウント (Better Auth の providerId "credential") を持つか。
// social のみ (Google など) のアカウントはパスワードを持たず、メールも provider 管理なので、
// この値が false のときは設定画面でメール変更・パスワード変更を出さない。
export const hasCredentialAccount = async (db: Db, userId: string): Promise<boolean> => {
  const row = await db.query.account.findFirst({
    where: and(eq(account.userId, userId), eq(account.providerId, "credential")),
    columns: { id: true },
  });
  return Boolean(row);
};
