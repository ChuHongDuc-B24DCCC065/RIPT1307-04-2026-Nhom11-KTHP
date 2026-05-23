
create database diendanhoidapsinhvien;

use diendanhoidapsinhvien;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MySQL workberch -- 
USE defaultdb;

CREATE TABLE notifications (
    id INT NOT NULL AUTO_INCREMENT,
    user_id_nhan INT NOT NULL,
    content TEXT NOT NULL,
    link VARCHAR(255) DEFAULT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY user_id_nhan (user_id_nhan),

    CONSTRAINT notifications_ibfk_1
        FOREIGN KEY (user_id_nhan)
        REFERENCES users (id)
        ON DELETE CASCADE
);