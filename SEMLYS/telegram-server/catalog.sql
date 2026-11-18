CREATE TABLE IF NOT EXISTS catalog_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE
);

INSERT OR IGNORE INTO catalog_categories (id, name) VALUES
  (1, 'Под-системы'), (2, 'Жидкости'), (3, 'Картриджи'), (4, 'Аксессуары');

CREATE TABLE IF NOT EXISTS catalog_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category INTEGER NOT NULL REFERENCES catalog_categories(id),
  brand TEXT NOT NULL,
  description TEXT NOT NULL,
  photo TEXT NOT NULL
);
