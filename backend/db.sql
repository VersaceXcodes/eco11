-- Create Tables
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    post_id TEXT REFERENCES posts(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE likes (
    user_id TEXT REFERENCES users(id),
    post_id TEXT REFERENCES posts(id),
    PRIMARY KEY (user_id, post_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data
INSERT INTO users (id, username, email, password_hash, created_at)
VALUES
    ('user1', 'john_doe', 'john@example.com', 'password123', '2023-01-01 12:00:00'),
    ('user2', 'jane_smith', 'jane@example.com', 'admin123', '2023-01-02 13:00:00'),
    ('user3', 'bob_brown', 'bob@example.com', 'user123', '2023-01-03 14:00:00'),
    ('user4', 'alice_wonder', 'alice@example.com', 'password456', '2023-01-04 15:00:00'),
    ('user5', 'charlie_brown', 'charlie@example.com', 'pass1234', '2023-01-05 16:00:00');

INSERT INTO posts (id, user_id, title, content, image_url, created_at)
VALUES
    ('post1', 'user1', 'First Post', 'This is the first post content.', 'https://picsum.photos/seed/post1/200/300', '2023-01-01 12:30:00'),
    ('post2', 'user2', 'Second Post', 'Content for the second post.', 'https://picsum.photos/seed/post2/200/300', '2023-01-02 13:30:00'),
    ('post3', 'user3', 'Third Post', 'Third post content here.', 'https://picsum.photos/seed/post3/200/300', '2023-01-03 14:30:00'),
    ('post4', 'user4', 'Fourth Post', 'Another example post.', 'https://picsum.photos/seed/post4/200/300', '2023-01-04 15:30:00'),
    ('post5', 'user5', 'Fifth Post', 'Final sample post.', 'https://picsum.photos/seed/post5/200/300', '2023-01-05 16:30:00');

INSERT INTO comments (id, user_id, post_id, content, created_at)
VALUES
    ('comment1', 'user1', 'post1', 'Great post!', '2023-01-01 13:00:00'),
    ('comment2', 'user2', 'post1', 'Nice work!', '2023-01-01 14:00:00'),
    ('comment3', 'user3', 'post2', 'Good job!', '2023-01-02 15:00:00'),
    ('comment4', 'user4', 'post3', 'Excellent content!', '2023-01-03 16:00:00'),
    ('comment5', 'user5', 'post4', 'Very informative!', '2023-01-04 17:00:00'),
    ('comment6', 'user1', 'post5', 'Well done!', '2023-01-05 18:00:00');

INSERT INTO likes (user_id, post_id, created_at)
VALUES
    ('user1', 'post2', '2023-01-02 14:00:00'),
    ('user2', 'post3', '2023-01-03 15:00:00'),
    ('user3', 'post1', '2023-01-04 16:00:00'),
    ('user4', 'post5', '2023-01-05 17:00:00'),
    ('user5', 'post2', '2023-01-06 18:00:00');