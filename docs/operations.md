# MIERU Clinic - 運用・デプロイ

## デプロイ

- **CI/CD**: main push → GitHub Actions → Docker build → Cloud Run自動デプロイ
- **設定ファイル**: `Dockerfile`, `.github/workflows/deploy.yml`, `deploy/docker-entrypoint.sh`
- **Cloud SQL**: PostgreSQL 15, `mieru-clinic-db`（日次バックアップ+PITR）
- **環境変数**: DATABASE_URL, AUTH_SECRET, AUTH_URL, NEXT_PUBLIC_APP_URL（Cloud Run環境変数として直接設定、Secrets Managerではない）

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

## デモデータ（`prisma/seed.ts`）

- クリニック: "MIERU デモ歯科クリニック" (slug: demo-dental)
- ユーザー: mail@function-t.com / MUNP1687 (system_admin), clinic@demo.com / clinic123 (clinic_admin)
- テンプレート: 初診(8問), 再診(6問)
- 6ヶ月分アンケート約1,500件（決定的乱数、S字カーブでスコア改善）
- 改善アクション6件（4完了+2実施中）、経営レポート5ヶ月分
