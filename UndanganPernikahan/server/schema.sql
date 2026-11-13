-- Skema Oracle Database untuk Undangan Pernikahan.
-- Server membuat tabel ini otomatis saat pertama jalan (DB_AUTO_INIT=true).
-- File ini disediakan kalau Anda lebih suka menjalankannya manual lewat SQL Developer / SQL*Plus.
-- Perlu Oracle 12.1.0.2 atau lebih baru (untuk CHECK ... IS JSON dan FETCH FIRST).
-- Setiap perintah diakhiri titik koma. Aman dijalankan ulang (error "sudah ada" diabaikan oleh server).

CREATE TABLE wd_guests (
  id         VARCHAR2(64)  NOT NULL,
  code       VARCHAR2(64),
  payload    CLOB          NOT NULL,
  created_at TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT wd_guests_pk   PRIMARY KEY (id),
  CONSTRAINT wd_guests_json CHECK (payload IS JSON)
);

CREATE UNIQUE INDEX wd_guests_code_uq ON wd_guests (code);

CREATE TABLE wd_wishes (
  id         VARCHAR2(64)  NOT NULL,
  payload    CLOB          NOT NULL,
  created_at TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT wd_wishes_pk   PRIMARY KEY (id),
  CONSTRAINT wd_wishes_json CHECK (payload IS JSON)
);

CREATE TABLE wd_moments (
  id         VARCHAR2(64)  NOT NULL,
  payload    CLOB          NOT NULL,
  created_at TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT wd_moments_pk   PRIMARY KEY (id),
  CONSTRAINT wd_moments_json CHECK (payload IS JSON)
);

CREATE TABLE wd_visits (
  id         VARCHAR2(64)  NOT NULL,
  payload    CLOB          NOT NULL,
  created_at TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT wd_visits_pk   PRIMARY KEY (id),
  CONSTRAINT wd_visits_json CHECK (payload IS JSON)
);

CREATE TABLE wd_site_content (
  id         VARCHAR2(64)  NOT NULL,
  payload    CLOB          NOT NULL,
  created_at TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT wd_site_content_pk   PRIMARY KEY (id),
  CONSTRAINT wd_site_content_json CHECK (payload IS JSON)
);

-- File lagu undangan (diunggah admin lewat Invitation CMS > Music)
CREATE TABLE wd_media (
  id           VARCHAR2(128) NOT NULL,
  content_type VARCHAR2(100),
  content      BLOB          NOT NULL,
  updated_at   TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT wd_media_pk PRIMARY KEY (id)
);
