# MIERU Clinic - 運用・デプロイ

## デプロイ

- **CI/CD**: main push → GitHub Actions → Docker build → Cloud Run自動デプロイ
- **設定ファイル**: `Dockerfile`, `.github/workflows/deploy.yml`, `deploy/docker-entrypoint.sh`
- **Cloud SQL**: PostgreSQL 15, `mieru-clinic-db`（日次バックアップ+PITR）
- **環境変数**: DATABASE_URL, AUTH_SECRET, AUTH_URL, NEXT_PUBLIC_APP_URL, SMTP_HOST, SMTP_PASS, SMTP_FROM（Cloud Run環境変数として直接設定、Secrets Managerではない）

## 本番DB操作

### 接続情報

- **DBユーザー**: `mieru`（`postgres` ではない。全テーブルの所有者は `mieru`）
- **DATABASE_URL（Cloud Run）**: Cloud Run環境変数に直接設定（`gcloud run services describe` で確認可能）

### Cloud Shell からの接続手順

```bash
# 1. Cloud SQL Auth Proxy 起動
cloud-sql-proxy mieru-clinic:asia-northeast1:mieru-clinic-db --port=5432 &
# 2. proxy起動を待ってからコマンド実行（sleepを入れる）
sleep 2 && DATABASE_URL="postgresql://mieru:<パスワード>@127.0.0.1:5432/mieru_clinic" npm run db:update-templates
# 3. 完了後 proxy 停止
kill %1
```

### 禁止事項

- **`gcloud sql users set-password` でDBユーザーのパスワードを変更しないこと** — Cloud Runの環境変数に設定されたDATABASE_URLと不整合が発生し、本番サイトが即座にダウンする
- パスワードが不明な場合は `gcloud run services describe mieru-clinic --region=asia-northeast1 --format=json` でCloud RunのDATABASE_URL環境変数から確認する

## メール設定（Resend API）

確認メール・パスワードリセットメールの送信には [Resend](https://resend.com) を使用。
**未設定のまま本番デプロイすると、登録確認メールが送信されずユーザーが認証できない。**

### 必須の Cloud Run 環境変数

| 変数名 | 値の例 | 説明 |
|--------|--------|------|
| `SMTP_HOST` | `https://api.resend.com/emails` | Resend API エンドポイント（固定値） |
| `SMTP_PASS` | `re_xxxxxxxxxxxx` | Resend APIキー（Resendダッシュボードで発行） |
| `SMTP_FROM` | `MIERU Clinic <register@mieru-clinic.com>` | 送信元アドレス（Resendで認証済みドメインが必要） |

### 設定手順

1. [resend.com](https://resend.com) でアカウント作成
2. 「Domains」でドメイン `mieru-clinic.com` を追加し、DNS設定（DKIM等）を完了
3. 「API Keys」でAPIキーを発行（送信権限あり）
4. Cloud Run の環境変数に上記3つを追加:
   ```bash
   gcloud run services update mieru-clinic \
     --region=asia-northeast1 \
     --set-env-vars="SMTP_HOST=https://api.resend.com/emails,SMTP_PASS=re_xxx,SMTP_FROM=MIERU Clinic <register@mieru-clinic.com>"
   ```

### メール未設定時の応急処置

メール設定が完了するまでの間、登録済みユーザーのメール認証は管理者画面から手動承認できる:

1. `/admin` を開く
2. 対象クリニックの「未認証」バッジをクリック
3. 「認証済みにする」を実行

### メール送信履歴の確認

`/admin` の各クリニック行にある「メール履歴」ボタン、または `/admin/clinics/{id}/email-logs` で送信成否・エラー詳細を確認できる。

## デモデータ（`prisma/seed.ts`）

- クリニック: "MIERU デモ歯科クリニック" (slug: demo-dental)
- ユーザー: mail@function-t.com / MUNP1687 (system_admin), clinic@demo.com / clinic123 (clinic_admin)
- テンプレート: 初診(8問), 再診(6問)
- 6ヶ月分アンケート約1,500件（決定的乱数、S字カーブでスコア改善）
- 改善アクション6件（4完了+2実施中）、経営レポート5ヶ月分
