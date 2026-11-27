-- Lược đồ giai đoạn "nền" (spec mục 5.2). Chạy lại nhiều lần không sao (IF NOT EXISTS).

-- Mỗi lần quét một nguồn. listed = số URL nguồn báo đang mở, là mẫu số của độ phủ.
CREATE TABLE IF NOT EXISTS scan_run (
  id           bigserial PRIMARY KEY,
  source       text        NOT NULL,
  started_at   timestamptz NOT NULL DEFAULT now(),
  finished_at  timestamptz,
  status       text        NOT NULL DEFAULT 'running', -- running | ok | blocked | error
  listed       int,
  new_jobs     int         NOT NULL DEFAULT 0,
  fetched      int         NOT NULL DEFAULT 0,
  failed       int         NOT NULL DEFAULT 0,
  closed       int         NOT NULL DEFAULT 0,
  note         text
);

-- Tin gốc theo nguồn, đã xóa thông tin cá nhân. Khóa: (nguồn, mã tin trên nguồn).
-- first_seen / last_seen / closed_at cho biết tin mở bao lâu (độ khó tuyển).
CREATE TABLE IF NOT EXISTS raw_job (
  source             text        NOT NULL,
  source_id          text        NOT NULL,
  url                text        NOT NULL,
  first_seen         timestamptz NOT NULL DEFAULT now(),
  last_seen          timestamptz NOT NULL DEFAULT now(),
  closed_at          timestamptz,
  fetched_at         timestamptz,
  fetch_attempts     int         NOT NULL DEFAULT 0,
  fetch_error        text,
  parser_version     int,
  in_scope           boolean,    -- có ít nhất một địa điểm ở Hà Nội / Đà Nẵng / TP.HCM
  title              text,
  company            text,
  regions            text[],
  cities             text[],
  date_posted        date,
  valid_through      date,
  skills             text[],
  employment_type    text,
  experience_months  int,
  work_mode          text,
  salary_text        text,
  salary_hidden      boolean,
  payload            jsonb,
  PRIMARY KEY (source, source_id)
);

CREATE INDEX IF NOT EXISTS raw_job_open_idx    ON raw_job (source) WHERE closed_at IS NULL;
CREATE INDEX IF NOT EXISTS raw_job_pending_idx ON raw_job (source, first_seen) WHERE fetched_at IS NULL AND closed_at IS NULL;
CREATE INDEX IF NOT EXISTS raw_job_posted_idx  ON raw_job (date_posted);

-- Thêm 2026-11-22 (nguồn Vieclam24h): lương dạng số khi nguồn ghi rõ, và danh mục nghề trên nguồn.
ALTER TABLE raw_job ADD COLUMN IF NOT EXISTS salary_min      numeric;
ALTER TABLE raw_job ADD COLUMN IF NOT EXISTS salary_max      numeric;
ALTER TABLE raw_job ADD COLUMN IF NOT EXISTS salary_currency text;
ALTER TABLE raw_job ADD COLUMN IF NOT EXISTS salary_unit     text;
ALTER TABLE raw_job ADD COLUMN IF NOT EXISTS category        text;
