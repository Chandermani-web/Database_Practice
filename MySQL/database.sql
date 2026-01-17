USE mysql_practice;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  role ENUM('admin','super_admin','user') NOT NULL,
  refreshtoken VARCHAR(500)
);
SELECT * FROM users;