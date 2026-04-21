import type { Metadata } from "next"
import Link from "next/link"
import { APP_NAME } from "@/lib/constants"
import { messages } from "@/lib/messages"

export const metadata: Metadata = {
  title: `利用規約 | ${APP_NAME}`,
  description: `${APP_NAME} の利用規約ページです。本サービスをご利用いただく前にご確認ください。`,
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

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-muted/20 py-10">
      <div className="container max-w-3xl">
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-10">
          <header className="mb-8 border-b pb-6">
            <p className="text-sm text-muted-foreground">{APP_NAME}</p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">利用規約</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              制定日: 2026年2月1日 / 最終改定日: 2026年4月21日
            </p>
          </header>

          <p className="leading-relaxed text-foreground/90">
            この利用規約（以下「本規約」といいます）は、株式会社ファンクション・ティ（以下「当社」といいます）が提供する患者体験改善プラットフォーム「{APP_NAME}」（以下「本サービス」といいます）の利用条件を定めるものです。本サービスを利用される医療機関およびそのスタッフ（以下「利用者」といいます）は、本規約に同意のうえ、本サービスをご利用ください。
          </p>

          <SectionHeading number="第1条" title="適用" />
          <ol className="list-decimal space-y-2 pl-6 leading-relaxed text-foreground/90">
            <li>本規約は、利用者と当社との間の本サービスの利用に関わる一切の関係に適用されます。</li>
            <li>当社が本サービス上で掲載する個別規定は、本規約の一部を構成するものとします。</li>
            <li>本規約の内容と個別規定の内容が矛盾する場合には、個別規定が優先して適用されるものとします。</li>
          </ol>

          <SectionHeading number="第2条" title="利用登録" />
          <ol className="list-decimal space-y-2 pl-6 leading-relaxed text-foreground/90">
            <li>本サービスの利用を希望する者（以下「登録希望者」といいます）は、本規約に同意したうえで、当社所定の方法により利用登録を申請するものとします。</li>
            <li>当社は、登録希望者が以下のいずれかに該当する場合、利用登録の申請を承認しないことがあります。
              <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-muted-foreground">
                <li>申請事項に虚偽の情報が含まれている場合</li>
                <li>過去に本規約違反により利用停止等の処分を受けたことがある場合</li>
                <li>登録希望者が医療機関以外であるなど、本サービスの目的に適合しないと当社が判断した場合</li>
                <li>その他、当社が利用登録を相当でないと判断した場合</li>
              </ul>
            </li>
          </ol>

          <SectionHeading number="第3条" title="アカウント管理" />
          <ol className="list-decimal space-y-2 pl-6 leading-relaxed text-foreground/90">
            <li>利用者は、自己の責任においてアカウント情報（メールアドレス・パスワード等）を適切に管理するものとします。</li>
            <li>利用者は、アカウント情報を第三者に譲渡・貸与し、または共用することはできません。</li>
            <li>アカウント情報の管理不十分、使用上の過誤、第三者の使用等による損害の責任は、利用者が負うものとし、当社は一切の責任を負いません。</li>
          </ol>

          <SectionHeading number="第4条" title="料金および支払方法" />
          <ol className="list-decimal space-y-2 pl-6 leading-relaxed text-foreground/90">
            <li>本サービスの料金体系および支払方法は、当社ウェブサイト上に表示するとおりとします。</li>
            <li>有料プランを契約した利用者は、当社所定の方法により料金を支払うものとします。</li>
            <li>既に支払われた料金は、本規約に別段の定めがある場合または当社が特に認めた場合を除き、返金されません。</li>
          </ol>

          <SectionHeading number="第5条" title="禁止事項" />
          <p className="leading-relaxed text-foreground/90">
            利用者は、本サービスの利用にあたり、以下の行為をしてはなりません。
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-foreground/90">
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>当社、本サービスの他の利用者、またはその他の第三者の知的財産権、肖像権、プライバシー、名誉その他の権利または利益を侵害する行為</li>
            <li>本サービスのサーバーまたはネットワークの機能を破壊・妨害する行為</li>
            <li>不正アクセスを試みる行為、またはリバースエンジニアリング、スクレイピング等により本サービスを解析する行為</li>
            <li>患者に対し本サービス外での口コミ投稿を強要・誘導する行為、または医療広告ガイドラインに反する形で患者アンケートの結果を用いる行為</li>
            <li>本サービスを通じて取得した情報を、本サービスの利用目的以外に利用する行為</li>
            <li>その他、当社が不適切と判断する行為</li>
          </ul>

          <SectionHeading number="第6条" title="本サービスの提供の停止等" />
          <ol className="list-decimal space-y-2 pl-6 leading-relaxed text-foreground/90">
            <li>当社は、以下のいずれかに該当する場合、利用者に事前の通知をすることなく本サービスの全部または一部の提供を停止または中断することができるものとします。
              <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-muted-foreground">
                <li>本サービスのコンピュータシステムの保守点検または更新を行う場合</li>
                <li>地震、落雷、火災、停電、天災等の不可抗力により本サービスの提供が困難となった場合</li>
                <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                <li>その他、当社が本サービスの提供が困難と判断した場合</li>
              </ul>
            </li>
            <li>当社は、本サービスの提供の停止または中断により、利用者または第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。</li>
          </ol>

          <SectionHeading number="第7条" title="利用者データの取扱い" />
          <ol className="list-decimal space-y-2 pl-6 leading-relaxed text-foreground/90">
            <li>本サービスは、患者個人を特定できる情報（氏名・連絡先等）を原則として収集しません。IPアドレスはSHA-256によりハッシュ化したうえで保存します。</li>
            <li>利用者が本サービスを通じて入力または登録したデータの取扱いについては、別途定めるプライバシーポリシーに従うものとします。</li>
            <li>当社は、統計データおよび匿名化されたデータを、本サービスの品質向上・新機能開発・研究目的等に利用することができるものとします。</li>
          </ol>

          <SectionHeading number="第8条" title="著作権および知的財産権" />
          <ol className="list-decimal space-y-2 pl-6 leading-relaxed text-foreground/90">
            <li>本サービスに関する著作権、商標権その他一切の知的財産権は、当社または正当な権利者に帰属します。</li>
            <li>利用者は、本サービスの利用に必要な範囲を超えて、本サービスのコンテンツを複製、改変、配布、販売、その他の方法で利用してはならないものとします。</li>
          </ol>

          <SectionHeading number="第9条" title="免責事項" />
          <ol className="list-decimal space-y-2 pl-6 leading-relaxed text-foreground/90">
            <li>当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます）がないことを明示的にも黙示的にも保証しません。</li>
            <li>当社は、本サービスに起因して利用者に生じたあらゆる損害について、当社の故意または重過失による場合を除き、一切の責任を負いません。</li>
            <li>前項の規定にかかわらず、本サービスに関する当社の利用者に対する損害賠償責任は、当該利用者が当社に支払った直近12ヶ月分の利用料金を上限とします。</li>
          </ol>

          <SectionHeading number="第10条" title="サービス内容の変更・終了" />
          <p className="leading-relaxed text-foreground/90">
            当社は、利用者に通知することなく本サービスの内容を変更し、または本サービスの提供を終了することができるものとします。これによって利用者に生じた損害について、当社は一切の責任を負いません。
          </p>

          <SectionHeading number="第11条" title="利用規約の変更" />
          <ol className="list-decimal space-y-2 pl-6 leading-relaxed text-foreground/90">
            <li>当社は、必要と判断した場合には、利用者に通知することなくいつでも本規約を変更することができるものとします。</li>
            <li>本規約の変更後に利用者が本サービスの利用を継続した場合、当該利用者は変更後の規約に同意したものとみなします。</li>
          </ol>

          <SectionHeading number="第12条" title="準拠法および裁判管轄" />
          <ol className="list-decimal space-y-2 pl-6 leading-relaxed text-foreground/90">
            <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
            <li>本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。</li>
          </ol>

          <div className="mt-12 rounded-lg bg-muted/40 p-5 text-sm text-muted-foreground">
            <p>{messages.landing.companyName}</p>
            <p className="mt-1">お問い合わせ: 本サービス内のサポート窓口までご連絡ください。</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 border-t pt-6 text-sm">
            <Link href="/privacy" className="text-primary underline-offset-4 hover:underline">
              プライバシーポリシー
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
