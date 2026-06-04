
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


USE defaultdb;

CREATE TABLE reports (
    id INT NOT NULL AUTO_INCREMENT,
    user_id_report INT NOT NULL,
    question_id INT NOT NULL,
    ly_do TEXT NOT NULL,
    trang_thai ENUM('pending', 'resolved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY user_id_report (user_id_report),
    KEY question_id (question_id),

    CONSTRAINT reports_ibfk_1
        FOREIGN KEY (user_id_report)
        REFERENCES users (id)
        ON DELETE CASCADE,

    CONSTRAINT reports_ibfk_2
        FOREIGN KEY (question_id)
        REFERENCES questions (id)
        ON DELETE CASCADE
);

USE defaultdb;
-- 1. Thêm cột reputation (điểm uy tín) vào bảng users hiện có
ALTER TABLE users 
ADD COLUMN reputation INT DEFAULT 100;

-- 2. Tạo bảng question_votes để lưu trữ lịch sử vote câu hỏi
CREATE TABLE IF NOT EXISTS question_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    vote_type INT NOT NULL, -- 1 cho upvote, -1 cho downvote
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_question (user_id, question_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- 3. Tạo bảng answer_votes để lưu trữ lịch sử vote câu trả lời
CREATE TABLE IF NOT EXISTS answer_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    answer_id INT NOT NULL,
    vote_type INT NOT NULL, -- 1 cho upvote, -1 cho downvote
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_answer (user_id, answer_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE
);
