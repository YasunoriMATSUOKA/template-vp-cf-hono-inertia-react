import { MainLayout } from "~/client/features/layout/MainLayout";

export default function PrivacyPolicy() {
  return (
    <MainLayout className="max-w-3xl">
      <article className="prose-like space-y-6 leading-relaxed">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold">プライバシーポリシー</h1>
          <p className="text-sm text-base-content/60">最終更新日: 2026年5月22日</p>
        </header>

        <p>
          Private Todo (以下「本サービス」) は、利用者の個人情報の保護を重要視し、本ポリシーに基づき
          適切に取り扱います。本サービスは個人開発者 YasunoriMATSUOKA (以下「運営者」)
          が運営しています。
        </p>

        <Section title="1. 取得する情報">
          <p>本サービスは、提供のために以下の情報を取得します。</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Google アカウント認証経由で取得する情報: メールアドレス、表示名、プロフィール画像
              URL、 Google アカウント ID
            </li>
            <li>利用者が本サービスに登録した Todo の内容、作成・更新・完了の状態</li>
            <li>セッション管理のための Cookie (Better Auth が発行するセッショントークン)</li>
            <li>
              Cloudflare Workers の標準ログとして記録されるアクセス情報 (IP アドレス、User-Agent、
              リクエストパス、タイムスタンプ等)
            </li>
          </ul>
        </Section>

        <Section title="2. 利用目的">
          <ul className="list-disc pl-6 space-y-1">
            <li>本サービスの提供および利用者の認証</li>
            <li>本サービスの不具合調査、不正利用の検知および対応</li>
            <li>本サービスの改善および利用状況の統計的把握 (個人を特定しない形に限る)</li>
          </ul>
        </Section>

        <Section title="3. 第三者提供および業務委託">
          <p>
            運営者は、法令に基づく場合を除き、利用者の同意なく個人情報を第三者に提供しません。
            ただし、本サービスの提供に必要な範囲で、以下の事業者を業務委託先として利用しています。
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Cloudflare, Inc. — アプリケーション基盤 (Workers / D1 / R2)。データは Cloudflare の
              データセンターに保存されます。
            </li>
            <li>Google LLC — OAuth 認証のための ID 連携。</li>
          </ul>
        </Section>

        <Section title="4. Cookie の利用">
          <p>
            本サービスは、認証セッションを維持するために HTTP Cookie を使用します。広告目的の
            トラッキング Cookie や第三者解析ツールは使用していません。
          </p>
        </Section>

        <Section title="5. 保存期間">
          <p>
            利用者の個人情報および Todo データは、アカウントが有効な期間中保存されます。
            アカウント削除の依頼を受けた場合、合理的な期間内に該当データを削除します。
          </p>
        </Section>

        <Section title="6. 開示・訂正・削除等の請求">
          <p>
            利用者は、自身の個人情報について開示・訂正・削除・利用停止を運営者に請求できます。
            下記「お問い合わせ」の窓口までご連絡ください。
          </p>
        </Section>

        <Section title="7. セキュリティ">
          <p>
            運営者は、HTTPS 通信、CSP/HSTS 等のセキュリティヘッダ、CSRF 対策、レートリミット
            等の合理的な措置により個人情報の漏洩・改ざんの防止に努めます。ただし、インターネット
            を介した通信の絶対的な安全性は保証できません。
          </p>
        </Section>

        <Section title="8. 本ポリシーの変更">
          <p>
            運営者は、必要に応じて本ポリシーを変更することがあります。変更後の内容は本ページに
            掲載した時点から有効となります。
          </p>
        </Section>

        <Section title="9. お問い合わせ">
          <p>
            本ポリシーおよび個人情報の取扱いに関するお問い合わせは、以下の GitHub リポジトリの issue
            にてお願いします。
          </p>
          <p>
            <a
              href="https://github.com/YasunoriMATSUOKA/template-vp-cf-hono-inertia-react/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary"
            >
              github.com/YasunoriMATSUOKA/template-vp-cf-hono-inertia-react/issues
            </a>
          </p>
        </Section>
      </article>
    </MainLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}
