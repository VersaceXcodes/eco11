import { app, pool } from './server.ts';
import request from 'supertest';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

// Test configuration
const TEST_USER = {
  id: 'test-user-1',
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'testpassword'
};

const TEST_POST = {
  id: 'test-post-1',
  user_id: TEST_USER.id,
  title: 'Test Post',
  content: 'This is a test post',
  image_url: null
};

// Setup and teardown
beforeAll(async () => {
  // Initialize test database
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(100) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Seed test data
  await pool.query(`
    INSERT INTO users (id, username, email, password_hash, created_at)
    VALUES ('${TEST_USER.id}', '${TEST_USER.username}', '${TEST_USER.email}', '${TEST_USER.password_hash}', NOW())
    ON CONFLICT DO NOTHING;
  `);
});

afterEach(async () => {
  // Clear test data after each test
  await pool.query('DELETE FROM posts WHERE id = $1', [TEST_POST.id]);
  await pool.query('DELETE FROM comments WHERE post_id = $1', [TEST_POST.id]);
  await pool.query('DELETE FROM likes WHERE post_id = $1', [TEST_POST.id]);
});

afterAll(async () => {
  // Close database connection
  await pool.end();
});

// Unit Tests
describe('Validation Schemas', () => {
  test('should validate user creation', async () => {
    const validUser = {
      username: 'validuser',
      email: 'valid@example.com',
      password_hash: 'password123'
    };
    
    expect(() => userEntitySchema.parse(validUser)).not.toThrow();
  });

  test('should reject invalid email', async () => {
    const invalidUser = {
      username: 'invalid',
      email: 'invalid-email',
      password_hash: 'password123'
    };
    
    expect(() => userEntitySchema.parse(invalidUser)).toThrow();
  });
});

// Integration Tests
describe('Auth Endpoints', () => {
  test('should signup new user', async () => {
    const response = await request(app)
     .post('/auth/signup')
     .send({
        username: 'newuser',
        email: 'new@example.com',
        password_hash: 'newpassword'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  test('should login existing user', async () => {
    const response = await request(app)
     .post('/auth/login')
     .send({
        email: TEST_USER.email,
        password_hash: TEST_USER.password_hash
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});

describe('Post Endpoints', () => {
  let authToken;

  beforeEach(async () => {
    // Get auth token for protected routes
    const loginResponse = await request(app)
     .post('/auth/login')
     .send({
        email: TEST_USER.email,
        password_hash: TEST_USER.password_hash
      });
    authToken = loginResponse.body.token;
  });

  test('should create new post', async () => {
    const response = await request(app)
     .post('/posts')
     .set("Authorization", `Bearer ${authToken}`)
     .send({
        user_id: TEST_USER.id,
        title: 'New Test Post',
        content: 'This is a new test post'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  test('should get all posts', async () => {
    const response = await request(app)
     .get('/posts')
     .set("Authorization", `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('should fail with invalid input', async () => {
    const response = await request(app)
     .post('/posts')
     .set("Authorization", `Bearer ${authToken}`)
     .send({ user_id: TEST_USER.id, content: 'No title' });
    
    expect(response.status).toBe(400);
  });
});

// WebSocket Tests
describe('Realtime Features', () => {
  let wsServer;
  let client;

  beforeEach(() => {
    // Create mock WebSocket server
    wsServer = new WebSocketServer({ port: 8081 });
    
    // Mock event handling
    wsServer.on('connection', (socket) => {
      socket.on('message', (message) => {
        socket.send(JSON.stringify({
          event: 'mock_event',
          data: 'test_response'
        }));
      });
    });
  });

  test('should receive realtime post updates', async () => {
    client = new WebSocket('ws://localhost:8081');
    
    await new Promise((resolve) => {
      client.on('open', () => {
        client.on('message', (message) => {
          const data = JSON.parse(message);
          expect(data.event).toBeDefined();
          resolve();
        });
        client.send(JSON.stringify({ event: 'subscribe', channel: 'post.created' }));
      });
    });
  });
});

// Database Tests
describe('Database Operations', () => {
  test('should create and retrieve user', async () => {
    const result = await pool.query(
      'INSERT INTO users (id, username, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING *',
      [uuidv4(), 'dbtest', 'dbtest@example.com', 'testpass']
    );
    
    expect(result.rows[0]).toHaveProperty('id');
    
    const fetchResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [result.rows[0].id]
    );
    
    expect(fetchResult.rows.length).toBe(1);
  });

  test('should enforce unique constraints', async () => {
    try {
      await pool.query(
        'INSERT INTO users (id, username, email, password_hash) VALUES ($1, $2, $3, $4)',
        [TEST_USER.id, TEST_USER.username, TEST_USER.email, TEST_USER.password_hash]
      );
      fail('Should have thrown duplicate key error');
    } catch (error) {
      expect(error.message).toContain('duplicate key value');
    }
  });
});