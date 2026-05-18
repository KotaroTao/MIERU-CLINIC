-- メール送信履歴テーブル
-- sendMail() の呼び出しごとに成功・失敗を記録し、/admin から閲覧する
CREATE TABLE "email_logs" (
  "id"                  UUID         NOT NULL DEFAULT gen_random_uuid(),
  "clinic_id"           UUID,
  "user_id"             UUID,
  "type"                TEXT         NOT NULL,
  "to"                  TEXT         NOT NULL,
  "subject"             TEXT         NOT NULL,
  "html"                TEXT         NOT NULL,
  "status"              TEXT         NOT NULL,
  "error_message"       TEXT,
  "provider_message_id" TEXT,
  "sent_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_logs_clinic_id_sent_at_idx" ON "email_logs" ("clinic_id", "sent_at");
CREATE INDEX "email_logs_user_id_idx" ON "email_logs" ("user_id");
CREATE INDEX "email_logs_sent_at_idx" ON "email_logs" ("sent_at");
CREATE INDEX "email_logs_status_sent_at_idx" ON "email_logs" ("status", "sent_at");

ALTER TABLE "email_logs"
  ADD CONSTRAINT "email_logs_clinic_id_fkey"
  FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "email_logs"
  ADD CONSTRAINT "email_logs_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
