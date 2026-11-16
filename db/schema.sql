-- Skema database Gorengan Mas Gibran (MySQL 8)
-- Tiga peran: admin, seller, buyer.

CREATE TABLE IF NOT EXISTS users (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name              VARCHAR(80)  NOT NULL,
  email             VARCHAR(160) NOT NULL,
  password_hash     VARCHAR(255) NOT NULL,
  role              ENUM('admin','seller','buyer') NOT NULL DEFAULT 'buyer',
  phone             VARCHAR(20)  NULL,
  store_name        VARCHAR(120) NULL,
  store_description VARCHAR(255) NULL,
  is_active         TINYINT(1)   NOT NULL DEFAULT 1,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_images (
  id         CHAR(36)     NOT NULL,
  mime       VARCHAR(30)  NOT NULL,
  bytes      MEDIUMBLOB   NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  seller_id   INT UNSIGNED NOT NULL,
  nama        VARCHAR(60)  NOT NULL,
  kategori    VARCHAR(30)  NOT NULL,
  harga       INT UNSIGNED NOT NULL DEFAULT 0,
  stok        INT UNSIGNED NOT NULL DEFAULT 0,
  deskripsi   VARCHAR(200) NOT NULL DEFAULT '',
  image_url   TEXT         NULL,
  unggulan    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_products_seller (seller_id),
  KEY idx_products_kategori (kategori),
  KEY idx_products_nama (nama),
  CONSTRAINT fk_products_seller FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
