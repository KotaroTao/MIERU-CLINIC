-- GINインデックス: patientAttributes JSONB列の検索高速化
-- 患者属性フィルタ（visitType, insuranceType, purpose, ageGroup, gender）で頻繁にスキャンされるため
CREATE INDEX CONCURRENTLY IF NOT EXISTS "survey_responses_patient_attributes_gin"
  ON "survey_responses" USING gin ("patient_attributes" jsonb_path_ops);
