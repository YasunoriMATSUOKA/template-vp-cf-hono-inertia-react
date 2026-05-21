import { createAuthClient } from "better-auth/react";

// アプリ全体で唯一の authClient インスタンス。
// createAuthClient() は client object を生成するだけで、ネットワーク呼び出しは
// signIn.social() / signOut() 等のメソッド実行まで遅延される。
export const authClient = createAuthClient();
