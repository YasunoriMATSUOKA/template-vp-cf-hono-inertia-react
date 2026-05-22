import { Link } from "@inertiajs/react";
import { MainLayout } from "~/client/features/layout/MainLayout";

export default function TermsOfService() {
  return (
    <MainLayout className="max-w-3xl">
      <article className="space-y-6 leading-relaxed">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold">利用規約</h1>
          <p className="text-sm text-base-content/60">最終更新日: 2026年5月22日</p>
        </header>

        <p>
          本利用規約 (以下「本規約」) は、個人開発者 YasunoriMATSUOKA (以下「運営者」) が提供する
          Private Todo (以下「本サービス」) の利用条件を定めるものです。利用者は本サービスを
          利用することにより本規約に同意したものとみなされます。
        </p>

        <Section title="1. 適用">
          <p>本規約は、本サービスの利用に関する運営者と利用者との間の一切の関係に適用されます。</p>
        </Section>

        <Section title="2. 利用登録">
          <p>
            本サービスの利用には Google アカウントによるサインインが必要です。利用者は、自身の
            Google アカウントの管理について自己責任を負うものとし、第三者による利用を許諾して
            はなりません。
          </p>
        </Section>

        <Section title="3. 禁止事項">
          <p>利用者は、本サービスの利用にあたり、以下の行為を行ってはなりません。</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>本サービスのサーバまたはネットワークの機能を妨害する行為</li>
            <li>本サービスの運営を妨害する行為</li>
            <li>他の利用者または第三者の権利・利益を侵害する行為</li>
            <li>不正アクセス、リバースエンジニアリング、その他の不正な技術的手段による行為</li>
            <li>運営者が不適切と判断する行為</li>
          </ul>
        </Section>

        <Section title="4. 本サービスの提供の停止等">
          <p>
            運営者は、以下のいずれかに該当する場合、利用者に事前通知することなく本サービスの
            全部または一部の提供を停止または中断できるものとします。
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>本サービスのメンテナンス、点検または更新を行う場合</li>
            <li>地震・落雷・火災・停電・天災等の不可抗力により提供が困難となった場合</li>
            <li>クラウドインフラ (Cloudflare 等) に障害が発生した場合</li>
            <li>その他、運営者が停止または中断を必要と判断した場合</li>
          </ul>
        </Section>

        <Section title="5. 著作権">
          <p>
            利用者が本サービスに登録した Todo の内容 (以下「投稿コンテンツ」) の著作権は利用者に
            帰属します。運営者は、本サービスを提供・改善・障害調査するために必要な範囲で投稿
            コンテンツを利用できるものとします。
          </p>
        </Section>

        <Section title="6. 免責事項">
          <p>
            本サービスは個人開発によるテンプレート / 実験的サービスとして提供されており、運営者は
            次の事項について一切の保証を行いません。
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>本サービスが利用者の特定の目的に適合すること</li>
            <li>本サービスが期待する機能・正確性・有用性・完全性を有すること</li>
            <li>本サービスの提供が中断・停止しないこと、エラーやバグが発生しないこと</li>
            <li>投稿コンテンツの保存および復旧</li>
          </ul>
          <p>
            運営者は、本サービスの利用に関連して利用者または第三者に生じた一切の損害について、
            運営者の故意または重過失による場合を除き、責任を負わないものとします。
          </p>
        </Section>

        <Section title="7. サービス内容の変更・終了">
          <p>
            運営者は、利用者に事前通知することなく、本サービスの内容を変更し、または提供を終了
            することができるものとします。これにより利用者に損害が生じた場合でも、運営者は責任を
            負いません。
          </p>
        </Section>

        <Section title="8. 利用規約の変更">
          <p>
            運営者は、必要と判断した場合には、利用者に通知することなく本規約を変更できるものと
            します。変更後の規約は、本ページに掲載した時点から効力を生じます。
          </p>
        </Section>

        <Section title="9. 個人情報の取扱い">
          <p>
            本サービスにおける個人情報の取扱いについては、
            <Link href="/privacy-policy" className="link link-primary">
              プライバシーポリシー
            </Link>
            に定めるところによります。
          </p>
        </Section>

        <Section title="10. 準拠法・裁判管轄">
          <p>
            本規約の解釈にあたっては日本法を準拠法とします。本サービスに関して紛争が生じた場合、
            運営者の住所地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </Section>

        <Section title="11. お問い合わせ">
          <p>本規約に関するお問い合わせは、以下の GitHub リポジトリの issue にてお願いします。</p>
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
