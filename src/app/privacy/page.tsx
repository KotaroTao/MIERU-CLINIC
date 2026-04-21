import type { Metadata } from "next"
import Link from "next/link"
import { APP_NAME } from "@/lib/constants"
import { messages } from "@/lib/messages"

export const metadata: Metadata = {
  title: `プライバシーポリシー | ${APP_NAME}`,
  description: `${APP_NAME} のプライバシーポリシーです。個人情報の取扱いについてご確認ください。`,
  robots: "noindex, nofollow",
}

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <h2 className="mt-10 mb-4 border-l-4 border-primary pl-3 text-xl font-bold sm:text-2xl">
      <span className="mr-2 text-primary">{number}</span>
      {title}
    </h2>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-muted/20 py-10">
      <div className="container max-w-3xl">
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-10">
          <header className="mb-8 border-b pb-6">
            <p className="text-sm text-muted-foreground">{APP_NAME}</p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">プライバシーポリシー</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              制定日: 2026年2月1日 / 最終改定日: 2026年4月21日
            </p>
          </header>

          <p className="leading-relaxed text-foreground/90">
            株式会社ファンクション・ティ（以下「当社」といいます）は、当社が提供する患者体験改善プラットフォーム「{APP_NAME}」（以下「本サービス」といいます）における、利用者および患者の個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。当社は、個人情報の保護に関する法律（以下「個人情報保護法」といいます）その他の関係法令を遵守し、適切な取扱いに努めます。
          </p>

          <SectionHeading number="第1条" title="収集する情報" />
          <p className="leading-relaxed text-foreground/90">
            当社は、本サービスの提供にあたり、以下の情報を取得する場合があります。
          </p>

          <h3 className="mt-4 text-lg font-semibold">(1) 利用者（医療機関および医療機関スタッフ）の情報</h3>
          <ul className="mt-2 list-disc space-y-1 pl-6 leading-relaxed text-foreground/90">
            <li>メールアドレス</li>
            <li>氏名（管理者名・スタッフ名）</li>
            <li>クリニック名・クリニック情報</li>
            <li>パスワード（ハッシュ化して保存）</li>
            <li>ログイン履歴、操作ログ等の利用状況に関する情報</li>
            <li>ご請求に関する情報（有料プランご利用時）</li>
          </ul>

          <h3 className="mt-6 text-lg font-semibold">(2) 患者アンケート回答に関する情報</h3>
          <p className="mt-2 leading-relaxed text-foreground/90">
            本サービスのアンケート機能は<strong>匿名</strong>かつ<strong>回答は任意</strong>であり、患者個人を特定できる情報（氏名・住所・電話番号・メールアドレス等）は<strong>取得しません</strong>。アンケートを通じて取得する情報は以下のとおりです。
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 leading-relaxed text-foreground/90">
            <li>アンケートへの回答内容（設問への回答、自由記述コメント）</li>
            <li>回答日時</li>
            <li>患者属性に関する情報（年代・性別など、匿名の統計情報のみ）</li>
            <li>IPアドレスのハッシュ値（SHA-256により一方向変換したもの。元のIPアドレスは保存されません）</li>
          </ul>

          <SectionHeading number="第2条" title="利用目的" />
          <p className="leading-relaxed text-foreground/90">
            当社は、取得した情報を以下の目的のために利用します。
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-foreground/90">
            <li>本サービスの提供、維持、および改善のため</li>
            <li>利用者に対する本サービスに関するご案内、お問い合わせ等への対応のため</li>
            <li>料金のご請求、未払い料金の請求、その他の支払関連業務のため</li>
            <li>利用規約違反等に対する対応のため</li>
            <li>本サービスに関する重要なお知らせの送信のため</li>
            <li>統計データの作成、新機能の開発、学術研究等のため（いずれも個人が特定できない形式で行います）</li>
          </ul>

          <SectionHeading number="第3条" title="安全管理措置" />
          <ol className="list-decimal space-y-2 pl-6 leading-relaxed text-foreground/90">
            <li>当社は、取得した情報の漏えい、滅失または毀損の防止のため、必要かつ適切な安全管理措置を講じます。</li>
            <li>パスワードは一方向ハッシュにより保存し、平文では保持しません。</li>
            <li>通信は TLS（HTTPS）により暗号化します。</li>
            <li>アクセス権限は最小権限の原則に基づき管理し、業務上必要な従業員のみがアクセスできる状態とします。</li>
          </ol>

          <SectionHeading number="第4条" title="第三者提供" />
          <p className="leading-relaxed text-foreground/90">
            当社は、以下のいずれかに該当する場合を除き、取得した個人情報を第三者に提供しません。
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-foreground/90">
            <li>本人の同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
            <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
            <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
          </ul>

          <SectionHeading number="第5条" title="外部サービスの利用" />
          <p className="leading-relaxed text-foreground/90">
            当社は、本サービスの運営のため、以下の外部サービスを利用しています。これらのサービス提供者には必要最小限の情報のみを提供し、各社のプライバシーポリシーに基づき適切に管理されます。
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-foreground/90">
            <li>クラウドホスティング（Google Cloud / asia-northeast1 リージョン）</li>
            <li>データベースホスティング</li>
            <li>メール送信サービス</li>
            <li>スパム・不正アクセス対策（Cloudflare Turnstile 等）</li>
          </ul>

          <SectionHeading number="第6条" title="Cookie（クッキー）の利用" />
          <ol className="list-decimal space-y-2 pl-6 leading-relaxed text-foreground/90">
            <li>本サービスは、利用者の認証状態の維持やセッション管理のためにCookieを使用します。</li>
            <li>利用者はブラウザの設定によりCookieの受け入れを拒否することができますが、その場合、本サービスの一部の機能が利用できなくなる可能性があります。</li>
          </ol>

          <SectionHeading number="第7条" title="データの保存期間" />
          <ol className="list-decimal space-y-2 pl-6 leading-relaxed text-foreground/90">
            <li>利用者アカウント情報は、利用者が退会するまで、または当社が利用停止措置を講じるまで保存されます。</li>
            <li>アンケート回答データは、利用中のプランに応じた保存期間に従って保存されます。保存期間経過後は順次削除されます。</li>
            <li>退会後も、法令の定める期間、会計帳簿等の保管のため必要な情報を保存することがあります。</li>
          </ol>

          <SectionHeading number="第8条" title="開示・訂正・利用停止等の請求" />
          <ol className="list-decimal space-y-2 pl-6 leading-relaxed text-foreground/90">
            <li>利用者は、当社に対して自己の個人情報について、開示、訂正、追加、削除、利用停止、第三者提供の停止等を請求することができます。</li>
            <li>請求にあたっては、本人確認のため、当社所定の方法にて手続きをお願いする場合があります。</li>
            <li>法令の定めにより当社が対応を拒否できる場合は、この限りではありません。</li>
          </ol>

          <SectionHeading number="第9条" title="患者アンケートに関する特記事項" />
          <ol className="list-decimal space-y-2 pl-6 leading-relaxed text-foreground/90">
            <li>本サービスのアンケート機能は、医療広告ガイドラインに準拠し、匿名・任意の回答のみを取得します。</li>
            <li>アンケート結果は、個人を特定できない統計データとして利用者（医療機関）に提示されます。</li>
            <li>本サービスは、口コミサイトへの投稿を誘導・強制する機能を搭載していません。</li>
          </ol>

          <SectionHeading number="第10条" title="本ポリシーの変更" />
          <ol className="list-decimal space-y-2 pl-6 leading-relaxed text-foreground/90">
            <li>当社は、必要に応じて本ポリシーを変更することがあります。</li>
            <li>変更後のプライバシーポリシーは、本サービス上に掲載した時点から効力を生じるものとします。</li>
          </ol>

          <SectionHeading number="第11条" title="お問い合わせ" />
          <p className="leading-relaxed text-foreground/90">
            本ポリシーに関するお問い合わせは、本サービス内のサポート窓口までご連絡ください。
          </p>

          <div className="mt-12 rounded-lg bg-muted/40 p-5 text-sm text-muted-foreground">
            <p>{messages.landing.companyName}</p>
            <p className="mt-1">本社所在地：当社公式サイトに掲載のとおり</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 border-t pt-6 text-sm">
            <Link href="/terms" className="text-primary underline-offset-4 hover:underline">
              利用規約
            </Link>
            <Link href="/" className="text-primary underline-offset-4 hover:underline">
              {APP_NAME} トップページへ戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
