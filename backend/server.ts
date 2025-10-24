import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { createServer } from 'http';
import morgan from 'morgan';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Import Zod schemas
import {
  userEntitySchema,
  createUserInputSchema,
  updateUserInputSchema,
  searchUserInputSchema,
  postEntitySchema,
  createPostInputSchema,
  updatePostInputSchema,
  searchPostInputSchema,
  commentEntitySchema,
  createCommentInputSchema,
  updateCommentInputSchema,
  searchCommentInputSchema,
  likeEntitySchema,
  createLikeInputSchema,
  searchLikeInputSchema
} from './schema.ts';

dotenv.config();

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Error response utility
interface ErrorResponse {
  success: false;
  message: string;
  error_code?: string;
  details?: any;
  timestamp: string;
}

function createErrorResponse(
  message: string,
  error?: any,
  errorCode?: string
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errorCode) {
    response.error_code = errorCode;
  }

  if (error) {
    response.details = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return response;
}

// Environment variables
const { 
  DATABASE_URL, 
  PGHOST, 
  PGDATABASE, 
  PGUSER, 
  PGPASSWORD, 
  PGPORT = 5432, 
  JWT_SECRET = 'eco11-secret-key',
  PORT = 3000
} = process.env;

// PostgreSQL connection
const pool = new Pool(
  DATABASE_URL
    ? { 
        connectionString: DATABASE_URL, 
        ssl: { require: true } 
      }
    : {
        host: PGHOST,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        port: Number(PGPORT),
        ssl: { require: true },
      }
);

// Express app setup
const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: "5mb" }));
app.use(morgan('combined'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'storage');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

/*
  JWT Authentication middleware for protected routes
  Verifies token and attaches user data to request
*/
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json(createErrorResponse('Access token required', null, 'AUTH_TOKEN_REQUIRED'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [decoded.user_id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json(createErrorResponse('Invalid token', null, 'AUTH_TOKEN_INVALID'));
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json(createErrorResponse('Invalid or expired token', error, 'AUTH_TOKEN_INVALID'));
  }
};

/*
  Socket.IO authentication middleware
  Verifies JWT token for websocket connections
*/
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [decoded.user_id]);
    
    if (result.rows.length === 0) {
      return next(new Error('Authentication error'));
    }

    socket.user = result.rows[0];
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

/*
  External API Mock: AI-powered recommendation engine
  @@need:external-api : AI recommendation service that analyzes user activity patterns, carbon footprint data, and behavioral preferences to generate personalized sustainability suggestions with impact metrics and difficulty levels
*/
async function generatePersonalizedRecommendations({ user_id, category, activity_data }) {
  // Mock AI-generated recommendations based on user data
  const mockRecommendations = [
    {
      id: uuidv4(),
      title: "Switch to LED bulbs",
      content: "Replace incandescent bulbs with LED alternatives to save energy",
      impact: 15.5,
      difficulty: "beginner",
      category: "energy",
      estimated_co2_savings: 25.3,
      timeframe: "1 week"
    },
    {
      id: uuidv4(),
      title: "Use public transportation 3x per week",
      content: "Reduce car dependency by taking buses or trains for regular commutes",
      impact: 45.2,
      difficulty: "intermediate", 
      category: "transportation",
      estimated_co2_savings: 120.8,
      timeframe: "1 month"
    },
    {
      id: uuidv4(),
      title: "Start composting organic waste",
      content: "Set up a home composting system to reduce landfill waste",
      impact: 22.1,
      difficulty: "advanced",
      category: "waste",
      estimated_co2_savings: 65.4,
      timeframe: "2 weeks"
    }
  ];

  return {
    user_id,
    recommendations: category 
      ? mockRecommendations.filter(r => r.category === category)
      : mockRecommendations,
    generated_at: new Date().toISOString(),
    next_refresh: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
}

/*
  External API Mock: Carbon offset payment processing
  @@need:external-api : Payment gateway integration (Stripe/PayPal) for processing carbon offset credit purchases with secure payment handling, transaction logging, and certificate generation
*/
async function processCarbonOffsetPayment({ user_id, amount, payment_method }) {
  // Mock payment processing response
  return {
    transaction_id: `co_${uuidv4()}`,
    user_id,
    amount_tons: amount,
    cost_usd: amount * 15.50, // $15.50 per ton CO2
    status: "completed",
    certificate_url: `https://picsum.photos/seed/cert_${user_id}/800/600`,
    processed_at: new Date().toISOString(),
    provider: "GoldStandard Mock Provider",
    project_details: {
      name: "Renewable Energy Development Project",
      location: "Costa Rica",
      project_id: "GS-VER-1234"
    }
  };
}

/*
  External API Mock: Carbon footprint impact calculator
  @@need:external-api : Environmental impact calculation API that converts user activities (transportation, energy use, diet choices) into accurate CO2 equivalent measurements using standardized emission factors
*/
async function calculateCarbonFootprint({ activity_type, quantity, unit, location }) {
  // Mock carbon footprint calculations with realistic emission factors
  const emissionFactors = {
    transportation: {
      car_km: 0.2,      // kg CO2 per km
      bus_km: 0.05,     // kg CO2 per km
      train_km: 0.03,   // kg CO2 per km
      flight_km: 0.15   // kg CO2 per km
    },
    energy: {
      electricity_kwh: 0.4, // kg CO2 per kWh
      gas_m3: 2.0,          // kg CO2 per m3
      heating_oil_l: 2.5    // kg CO2 per liter
    },
    diet: {
      beef_kg: 60,      // kg CO2 per kg
      chicken_kg: 6,    // kg CO2 per kg
      vegetables_kg: 2, // kg CO2 per kg
      dairy_l: 3.2      // kg CO2 per liter
    }
  };

  const factor = emissionFactors[activity_type]?.[unit] || 1;
  const co2_impact = quantity * factor;

  return {
    activity_type,
    quantity,
    unit,
    co2_equivalent_kg: co2_impact,
    calculation_method: "IPCC Guidelines",
    location_factor: location === 'US' ? 1.0 : 0.8,
    calculated_at: new Date().toISOString()
  };
}

// Authentication Routes

/*
  User registration endpoint
  Creates new user account with email/username validation
*/
app.post('/api/auth/signup', async (req, res) => {
  try {
    const validatedData = createUserInputSchema.parse(req.body);
    const { username, email, password_hash } = validatedData;

    // Check for existing user
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2', 
      [email, username]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json(createErrorResponse(
        'User with this email or username already exists',
        null,
        'USER_ALREADY_EXISTS'
      ));
    }

    // Create new user (no password hashing for development)
    const newUserId = uuidv4();
    const result = await pool.query(
      'INSERT INTO users (id, username, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING *',
      [newUserId, username, email, password_hash]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: userEntitySchema.parse(user),
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json(createErrorResponse('Registration failed', error, 'REGISTRATION_ERROR'));
  }
});

/*
  User authentication endpoint
  Validates credentials and returns JWT token
*/
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password_hash } = req.body;

    if (!email || !password_hash) {
      return res.status(400).json(createErrorResponse(
        'Email and password are required',
        null,
        'MISSING_CREDENTIALS'
      ));
    }

    // Find user (direct password comparison for development)
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0 || result.rows[0].password_hash !== password_hash) {
      return res.status(401).json(createErrorResponse(
        'Invalid email or password',
        null,
        'INVALID_CREDENTIALS'
      ));
    }

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: userEntitySchema.parse(user),
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(createErrorResponse('Login failed', error, 'LOGIN_ERROR'));
  }
});

// User Management Routes

/*
  Search users with filtering and pagination
  Supports query search, sorting, and limiting results
*/
app.get('/api/users', async (req, res) => {
  try {
    const params = searchUserInputSchema.parse(req.query);
    let query = 'SELECT id, username, email, created_at FROM users WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (params.query) {
      query += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      values.push(`%${params.query}%`);
      paramIndex++;
    }

    if (params.user_id) {
      query += ` AND id = $${paramIndex}`;
      values.push(params.user_id);
      paramIndex++;
    }

    query += ` ORDER BY ${params.sort_by} ${params.sort_order}`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(params.limit, params.offset);

    const result = await pool.query(query, values);
    res.json(result.rows.map(user => userEntitySchema.parse(user)));
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json(createErrorResponse('Failed to search users', error, 'SEARCH_ERROR'));
  }
});

/*
  Get individual user profile by ID
  Returns public user information
*/
app.get('/api/users/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
    }

    res.json(userEntitySchema.parse(result.rows[0]));
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json(createErrorResponse('Failed to get user', error, 'GET_USER_ERROR'));
  }
});

/*
  Update user profile (authenticated)
  Allows updating username, email, password
*/
app.patch('/api/users/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Check authorization - users can only update their own profile
    if (req.user.id !== user_id) {
      return res.status(403).json(createErrorResponse('Unauthorized', null, 'UNAUTHORIZED'));
    }

    const updates = updateUserInputSchema.parse({ id: user_id, ...req.body });
    
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    if (updates.username) {
      setClause.push(`username = $${paramIndex}`);
      values.push(updates.username);
      paramIndex++;
    }

    if (updates.email) {
      setClause.push(`email = $${paramIndex}`);
      values.push(updates.email);
      paramIndex++;
    }

    if (updates.password_hash) {
      setClause.push(`password_hash = $${paramIndex}`);
      values.push(updates.password_hash);
      paramIndex++;
    }

    if (setClause.length === 0) {
      return res.status(400).json(createErrorResponse('No valid fields to update', null, 'NO_UPDATES'));
    }

    values.push(user_id);
    const query = `UPDATE users SET ${setClause.join(', ')} WHERE id = $${paramIndex} RETURNING id, username, email, created_at`;
    
    const result = await pool.query(query, values);
    res.json(userEntitySchema.parse(result.rows[0]));
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json(createErrorResponse('Failed to update user', error, 'UPDATE_USER_ERROR'));
  }
});

/*
  Delete user account (authenticated)
  Permanently removes user and associated data
*/
app.delete('/api/users/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Check authorization
    if (req.user.id !== user_id) {
      return res.status(403).json(createErrorResponse('Unauthorized', null, 'UNAUTHORIZED'));
    }

    // Delete user (cascades to related tables)
    await pool.query('DELETE FROM users WHERE id = $1', [user_id]);
    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json(createErrorResponse('Failed to delete user', error, 'DELETE_USER_ERROR'));
  }
});

// Posts Management Routes

/*
  Search and filter posts with pagination
  Supports content search, user filtering, image filtering
*/
app.get('/api/posts', async (req, res) => {
  try {
    const params = searchPostInputSchema.parse(req.query);
    let query = `
      SELECT p.id, p.user_id, p.title, p.content, p.image_url, p.created_at,
             u.username
      FROM posts p 
      JOIN users u ON p.user_id = u.id 
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (params.query) {
      query += ` AND (p.title ILIKE $${paramIndex} OR p.content ILIKE $${paramIndex})`;
      values.push(`%${params.query}%`);
      paramIndex++;
    }

    if (params.user_id) {
      query += ` AND p.user_id = $${paramIndex}`;
      values.push(params.user_id);
      paramIndex++;
    }

    if (params.include_image !== undefined) {
      if (params.include_image) {
        query += ` AND p.image_url IS NOT NULL`;
      } else {
        query += ` AND p.image_url IS NULL`;
      }
    }

    query += ` ORDER BY p.${params.sort_by} ${params.sort_order}`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(params.limit, params.offset);

    const result = await pool.query(query, values);
    
    // Transform to include title in content since DB doesn't have title field
    const posts = result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      title: row.title || 'Untitled',
      content: row.content,
      image_url: row.image_url,
      created_at: row.created_at
    }));

    res.json(posts.map(post => postEntitySchema.parse(post)));
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json(createErrorResponse('Failed to search posts', error, 'SEARCH_POSTS_ERROR'));
  }
});

/*
  Create new social post (authenticated)
  Supports text content and optional image upload
*/
app.post('/api/posts', authenticateToken, async (req, res) => {
  try {
    const postData = createPostInputSchema.parse(req.body);
    
    // Verify user authorization
    if (postData.user_id !== req.user.id) {
      return res.status(403).json(createErrorResponse('Unauthorized', null, 'UNAUTHORIZED'));
    }

    const postId = uuidv4();
    
    // Store title and content together since DB doesn't have separate title field
    const contentWithTitle = `${postData.title}\n\n${postData.content}`;
    
    const result = await pool.query(
      'INSERT INTO posts (id, user_id, title, content, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [postId, postData.user_id, postData.title, postData.content, postData.image_url]
    );

    const newPost = result.rows[0];
    
    // Emit realtime event
    io.emit('post.created', postEntitySchema.parse(newPost));
    
    res.status(201).json(postEntitySchema.parse(newPost));
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json(createErrorResponse('Failed to create post', error, 'CREATE_POST_ERROR'));
  }
});

/*
  Get individual post by ID
  Returns post details with author information
*/
app.get('/api/posts/:post_id', async (req, res) => {
  try {
    const { post_id } = req.params;
    const result = await pool.query(
      `SELECT p.*, u.username 
       FROM posts p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.id = $1`,
      [post_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Post not found', null, 'POST_NOT_FOUND'));
    }

    res.json(postEntitySchema.parse(result.rows[0]));
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json(createErrorResponse('Failed to get post', error, 'GET_POST_ERROR'));
  }
});

/*
  Update existing post (authenticated)
  Author can modify title, content, and image
*/
app.patch('/api/posts/:post_id', authenticateToken, async (req, res) => {
  try {
    const { post_id } = req.params;
    
    // Check if post exists and user owns it
    const existingPost = await pool.query('SELECT * FROM posts WHERE id = $1', [post_id]);
    if (existingPost.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Post not found', null, 'POST_NOT_FOUND'));
    }
    
    if (existingPost.rows[0].user_id !== req.user.id) {
      return res.status(403).json(createErrorResponse('Unauthorized', null, 'UNAUTHORIZED'));
    }

    const updates = updatePostInputSchema.parse({ id: post_id, ...req.body });
    
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    if (updates.title) {
      setClause.push(`title = $${paramIndex}`);
      values.push(updates.title);
      paramIndex++;
    }

    if (updates.content) {
      setClause.push(`content = $${paramIndex}`);
      values.push(updates.content);
      paramIndex++;
    }

    if (updates.image_url !== undefined) {
      setClause.push(`image_url = $${paramIndex}`);
      values.push(updates.image_url);
      paramIndex++;
    }

    if (setClause.length === 0) {
      return res.status(400).json(createErrorResponse('No valid fields to update', null, 'NO_UPDATES'));
    }

    values.push(post_id);
    const query = `UPDATE posts SET ${setClause.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await pool.query(query, values);
    const updatedPost = result.rows[0];
    
    // Emit realtime event
    io.emit('post.updated', postEntitySchema.parse(updatedPost));
    
    res.json(postEntitySchema.parse(updatedPost));
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json(createErrorResponse('Failed to update post', error, 'UPDATE_POST_ERROR'));
  }
});

/*
  Delete post (authenticated)
  Removes post and associated comments/likes
*/
app.delete('/api/posts/:post_id', authenticateToken, async (req, res) => {
  try {
    const { post_id } = req.params;
    
    // Check if post exists and user owns it
    const existingPost = await pool.query('SELECT * FROM posts WHERE id = $1', [post_id]);
    if (existingPost.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Post not found', null, 'POST_NOT_FOUND'));
    }
    
    if (existingPost.rows[0].user_id !== req.user.id) {
      return res.status(403).json(createErrorResponse('Unauthorized', null, 'UNAUTHORIZED'));
    }

    // Delete post (cascades to comments and likes)
    await pool.query('DELETE FROM posts WHERE id = $1', [post_id]);
    
    // Emit realtime event
    io.emit('post.deleted', { id: post_id, user_id: req.user.id });
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json(createErrorResponse('Failed to delete post', error, 'DELETE_POST_ERROR'));
  }
});

// Comments Management Routes

/*
  Get comments for a specific post
  Returns all comments with author information
*/
app.get('/api/posts/:post_id/comments', async (req, res) => {
  try {
    const { post_id } = req.params;
    
    const result = await pool.query(
      `SELECT c.*, u.username 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.post_id = $1 
       ORDER BY c.created_at ASC`,
      [post_id]
    );

    res.json(result.rows.map(comment => commentEntitySchema.parse(comment)));
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json(createErrorResponse('Failed to get comments', error, 'GET_COMMENTS_ERROR'));
  }
});

/*
  Create new comment on post (authenticated)
  Adds comment and emits realtime notification
*/
app.post('/api/posts/:post_id/comments', authenticateToken, async (req, res) => {
  try {
    const { post_id } = req.params;
    const commentData = createCommentInputSchema.parse({
      ...req.body,
      post_id
    });
    
    // Verify user authorization
    if (commentData.user_id !== req.user.id) {
      return res.status(403).json(createErrorResponse('Unauthorized', null, 'UNAUTHORIZED'));
    }

    // Verify post exists
    const postCheck = await pool.query('SELECT id FROM posts WHERE id = $1', [post_id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Post not found', null, 'POST_NOT_FOUND'));
    }

    const commentId = uuidv4();
    const result = await pool.query(
      'INSERT INTO comments (id, user_id, post_id, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [commentId, commentData.user_id, commentData.post_id, commentData.content]
    );

    const newComment = result.rows[0];
    
    // Emit realtime events
    io.emit('comment.created', commentEntitySchema.parse(newComment));
    
    res.status(201).json(commentEntitySchema.parse(newComment));
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json(createErrorResponse('Failed to create comment', error, 'CREATE_COMMENT_ERROR'));
  }
});

/*
  Get individual comment by ID
  Returns comment with author information
*/
app.get('/api/comments/:comment_id', async (req, res) => {
  try {
    const { comment_id } = req.params;
    const result = await pool.query(
      `SELECT c.*, u.username 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.id = $1`,
      [comment_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Comment not found', null, 'COMMENT_NOT_FOUND'));
    }

    res.json(commentEntitySchema.parse(result.rows[0]));
  } catch (error) {
    console.error('Get comment error:', error);
    res.status(500).json(createErrorResponse('Failed to get comment', error, 'GET_COMMENT_ERROR'));
  }
});

/*
  Update comment content (authenticated)
  Author can modify comment text
*/
app.patch('/api/comments/:comment_id', authenticateToken, async (req, res) => {
  try {
    const { comment_id } = req.params;
    
    // Check if comment exists and user owns it
    const existingComment = await pool.query('SELECT * FROM comments WHERE id = $1', [comment_id]);
    if (existingComment.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Comment not found', null, 'COMMENT_NOT_FOUND'));
    }
    
    if (existingComment.rows[0].user_id !== req.user.id) {
      return res.status(403).json(createErrorResponse('Unauthorized', null, 'UNAUTHORIZED'));
    }

    const updates = updateCommentInputSchema.parse({ id: comment_id, ...req.body });
    
    if (!updates.content) {
      return res.status(400).json(createErrorResponse('Content is required', null, 'CONTENT_REQUIRED'));
    }

    const result = await pool.query(
      'UPDATE comments SET content = $1 WHERE id = $2 RETURNING *',
      [updates.content, comment_id]
    );
    
    const updatedComment = result.rows[0];
    
    // Emit realtime event
    io.emit('comment.updated', commentEntitySchema.parse(updatedComment));
    
    res.json(commentEntitySchema.parse(updatedComment));
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json(createErrorResponse('Failed to update comment', error, 'UPDATE_COMMENT_ERROR'));
  }
});

/*
  Delete comment (authenticated)
  Removes comment from post
*/
app.delete('/api/comments/:comment_id', authenticateToken, async (req, res) => {
  try {
    const { comment_id } = req.params;
    
    // Check if comment exists and user owns it
    const existingComment = await pool.query('SELECT * FROM comments WHERE id = $1', [comment_id]);
    if (existingComment.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Comment not found', null, 'COMMENT_NOT_FOUND'));
    }
    
    if (existingComment.rows[0].user_id !== req.user.id) {
      return res.status(403).json(createErrorResponse('Unauthorized', null, 'UNAUTHORIZED'));
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [comment_id]);
    
    // Emit realtime event
    io.emit('comment.deleted', { id: comment_id, user_id: req.user.id });
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json(createErrorResponse('Failed to delete comment', error, 'DELETE_COMMENT_ERROR'));
  }
});

// Likes Management Routes

/*
  Like a post (authenticated)
  Creates like relationship and emits realtime event
*/
app.post('/api/posts/:post_id/likes', authenticateToken, async (req, res) => {
  try {
    const { post_id } = req.params;
    const user_id = req.user.id;

    // Check if post exists
    const postCheck = await pool.query('SELECT id FROM posts WHERE id = $1', [post_id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Post not found', null, 'POST_NOT_FOUND'));
    }

    // Check if already liked
    const existingLike = await pool.query(
      'SELECT * FROM likes WHERE user_id = $1 AND post_id = $2',
      [user_id, post_id]
    );

    if (existingLike.rows.length > 0) {
      return res.status(400).json(createErrorResponse('Post already liked', null, 'ALREADY_LIKED'));
    }

    // Create like
    const result = await pool.query(
      'INSERT INTO likes (user_id, post_id) VALUES ($1, $2) RETURNING *',
      [user_id, post_id]
    );

    const newLike = result.rows[0];
    
    // Emit realtime event
    io.emit('like.created', likeEntitySchema.parse(newLike));
    
    res.status(201).json(likeEntitySchema.parse(newLike));
  } catch (error) {
    console.error('Create like error:', error);
    res.status(500).json(createErrorResponse('Failed to like post', error, 'CREATE_LIKE_ERROR'));
  }
});

/*
  Unlike a post (authenticated)
  Removes like relationship and emits realtime event
*/
app.delete('/api/posts/:post_id/likes', authenticateToken, async (req, res) => {
  try {
    const { post_id } = req.params;
    const user_id = req.user.id;

    // Check if like exists
    const existingLike = await pool.query(
      'SELECT * FROM likes WHERE user_id = $1 AND post_id = $2',
      [user_id, post_id]
    );

    if (existingLike.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Like not found', null, 'LIKE_NOT_FOUND'));
    }

    await pool.query(
      'DELETE FROM likes WHERE user_id = $1 AND post_id = $2',
      [user_id, post_id]
    );
    
    // Emit realtime event
    io.emit('like.deleted', { user_id, post_id });
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete like error:', error);
    res.status(500).json(createErrorResponse('Failed to unlike post', error, 'DELETE_LIKE_ERROR'));
  }
});

/*
  Get user's posts
  Returns all posts created by specified user
*/
app.get('/api/users/:user_id/posts', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const result = await pool.query(
      `SELECT p.*, u.username 
       FROM posts p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.user_id = $1 
       ORDER BY p.created_at DESC`,
      [user_id]
    );

    res.json(result.rows.map(post => postEntitySchema.parse(post)));
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json(createErrorResponse('Failed to get user posts', error, 'GET_USER_POSTS_ERROR'));
  }
});

/*
  Get user's likes
  Returns all posts liked by specified user
*/
app.get('/api/users/:user_id/likes', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const result = await pool.query(
      `SELECT l.*, p.title, p.content 
       FROM likes l 
       JOIN posts p ON l.post_id = p.id 
       WHERE l.user_id = $1 
       ORDER BY l.created_at DESC`,
      [user_id]
    );

    res.json(result.rows.map(like => likeEntitySchema.parse(like)));
  } catch (error) {
    console.error('Get user likes error:', error);
    res.status(500).json(createErrorResponse('Failed to get user likes', error, 'GET_USER_LIKES_ERROR'));
  }
});

// Educational Content Routes

/*
  Search educational content (articles, videos, quizzes)
  Mock implementation with sample content
*/
app.get('/api/education', async (req, res) => {
  try {
    const { content_type } = req.query;
    
    // Mock educational content since no specific table exists
    const mockContent = [
      {
        id: uuidv4(),
        user_id: 'system',
        title: '10 Ways to Reduce Your Carbon Footprint',
        content: 'Learn practical steps to minimize your environmental impact through daily choices...',
        image_url: 'https://picsum.photos/seed/education1/400/300',
        created_at: new Date().toISOString(),
        content_type: 'article',
        read_time: '8 min'
      },
      {
        id: uuidv4(),
        user_id: 'system', 
        title: 'Sustainable Living Documentary',
        content: 'Watch this inspiring documentary about families transitioning to zero-waste lifestyles...',
        image_url: 'https://picsum.photos/seed/education2/400/300',
        created_at: new Date().toISOString(),
        content_type: 'video',
        duration: '45 min'
      },
      {
        id: uuidv4(),
        user_id: 'system',
        title: 'What\'s Your Eco-Type Quiz',
        content: 'Discover your environmental personality and get personalized sustainability tips...',
        image_url: 'https://picsum.photos/seed/education3/400/300',
        created_at: new Date().toISOString(),
        content_type: 'quiz',
        questions: 10
      }
    ];

    let filteredContent = mockContent;
    if (content_type) {
      filteredContent = mockContent.filter(item => item.content_type === content_type);
    }

    res.json(filteredContent);
  } catch (error) {
    console.error('Get education content error:', error);
    res.status(500).json(createErrorResponse('Failed to get educational content', error, 'GET_EDUCATION_ERROR'));
  }
});

// Marketplace Routes

/*
  Search marketplace products with filtering
  Mock implementation for eco-friendly product directory
*/
app.get('/api/marketplace', async (req, res) => {
  try {
    const { category, price_min, price_max, impact_min, impact_max } = req.query;
    
    // Mock marketplace products
    let mockProducts = [
      {
        id: uuidv4(),
        user_id: 'marketplace',
        title: 'Bamboo Reusable Straws Set',
        content: 'Eco-friendly bamboo straws with cleaning brush. Perfect replacement for plastic straws.',
        image_url: 'https://picsum.photos/seed/product1/300/300',
        created_at: new Date().toISOString(),
        category: 'home',
        price: 12.99,
        impact_score: 8.5,
        co2_savings_per_year: 2.3
      },
      {
        id: uuidv4(),
        user_id: 'marketplace',
        title: 'Solar Phone Charger',
        content: 'Portable solar panel charger for smartphones and small devices. Zero emissions charging.',
        image_url: 'https://picsum.photos/seed/product2/300/300',
        created_at: new Date().toISOString(),
        category: 'electronics',
        price: 49.99,
        impact_score: 9.2,
        co2_savings_per_year: 15.7
      },
      {
        id: uuidv4(),
        user_id: 'marketplace',
        title: 'Organic Cotton Tote Bag',
        content: 'Durable organic cotton shopping bag. Supports sustainable farming practices.',
        image_url: 'https://picsum.photos/seed/product3/300/300',
        created_at: new Date().toISOString(),
        category: 'fashion',
        price: 18.50,
        impact_score: 7.8,
        co2_savings_per_year: 5.2
      }
    ];

    // Apply filters
    if (category) {
      mockProducts = mockProducts.filter(p => p.category === category);
    }
    if (price_min) {
      mockProducts = mockProducts.filter(p => p.price >= parseFloat(price_min));
    }
    if (price_max) {
      mockProducts = mockProducts.filter(p => p.price <= parseFloat(price_max));
    }
    if (impact_min) {
      mockProducts = mockProducts.filter(p => p.impact_score >= parseFloat(impact_min));
    }
    if (impact_max) {
      mockProducts = mockProducts.filter(p => p.impact_score <= parseFloat(impact_max));
    }

    res.json(mockProducts);
  } catch (error) {
    console.error('Get marketplace error:', error);
    res.status(500).json(createErrorResponse('Failed to get marketplace products', error, 'GET_MARKETPLACE_ERROR'));
  }
});

// Challenges Routes

/*
  List available sustainability challenges
  Mock implementation for community challenges
*/
app.get('/api/challenges', async (req, res) => {
  try {
    // Mock challenges data
    const mockChallenges = [
      {
        id: uuidv4(),
        user_id: 'system',
        title: 'Plastic-Free July',
        content: 'Join thousands of participants in reducing single-use plastic consumption for an entire month.',
        image_url: 'https://picsum.photos/seed/challenge1/400/300',
        created_at: new Date().toISOString(),
        challenge_type: 'monthly',
        participants: 15432,
        start_date: '2024-07-01',
        end_date: '2024-07-31',
        target_metric: 'plastic_items_avoided',
        reward_points: 500
      },
      {
        id: uuidv4(), 
        user_id: 'system',
        title: 'Meatless Monday Week',
        content: 'Commit to plant-based meals every Monday for four weeks and reduce your dietary carbon footprint.',
        image_url: 'https://picsum.photos/seed/challenge2/400/300',
        created_at: new Date().toISOString(),
        challenge_type: 'weekly',
        participants: 8765,
        start_date: '2024-06-01',
        end_date: '2024-06-28',
        target_metric: 'plant_based_meals',
        reward_points: 200
      },
      {
        id: uuidv4(),
        user_id: 'system',
        title: 'Daily Bike Commute',
        content: 'Replace car trips with bicycle rides for your daily commute. Track your CO2 savings!',
        image_url: 'https://picsum.photos/seed/challenge3/400/300',
        created_at: new Date().toISOString(),
        challenge_type: 'daily',
        participants: 3241,
        start_date: '2024-06-15',
        end_date: '2024-07-15',
        target_metric: 'bike_commute_days',
        reward_points: 300
      }
    ];

    res.json(mockChallenges);
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json(createErrorResponse('Failed to get challenges', error, 'GET_CHALLENGES_ERROR'));
  }
});

/*
  Join a sustainability challenge (authenticated)
  Creates user participation record
*/
app.post('/api/challenges', authenticateToken, async (req, res) => {
  try {
    const { challenge_id } = req.body;
    
    if (!challenge_id) {
      return res.status(400).json(createErrorResponse('Challenge ID is required', null, 'CHALLENGE_ID_REQUIRED'));
    }

    // Mock challenge participation (would need challenges and participants tables)
    const mockParticipation = {
      id: uuidv4(),
      user_id: req.user.id,
      challenge_id,
      joined_at: new Date().toISOString(),
      progress: 0,
      status: 'active'
    };

    res.json({
      message: 'Successfully joined challenge',
      participation: mockParticipation
    });
  } catch (error) {
    console.error('Join challenge error:', error);
    res.status(500).json(createErrorResponse('Failed to join challenge', error, 'JOIN_CHALLENGE_ERROR'));
  }
});

// Business Profile Routes

/*
  Get business profile (authenticated)
  Returns business-specific user data
*/
app.get('/api/business/profile', authenticateToken, async (req, res) => {
  try {
    // Mock business profile data (would need business_profiles table)
    const mockBusinessProfile = {
      ...req.user,
      business_name: 'Green Tech Solutions',
      industry: 'Technology',
      employee_count: 50,
      sustainability_certifications: ['B-Corp', 'Carbon Neutral'],
      carbon_footprint_reduction: 25.5,
      green_initiatives: [
        'Solar panel installation',
        'Remote work policy', 
        'Paperless office'
      ]
    };

    res.json(mockBusinessProfile);
  } catch (error) {
    console.error('Get business profile error:', error);
    res.status(500).json(createErrorResponse('Failed to get business profile', error, 'GET_BUSINESS_PROFILE_ERROR'));
  }
});

/*
  Update business profile (authenticated)
  Modifies business-specific information
*/
app.patch('/api/business/profile', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    
    // Mock business profile update
    const updatedProfile = {
      ...req.user,
      ...updates,
      updated_at: new Date().toISOString()
    };

    res.json({
      message: 'Business profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Update business profile error:', error);
    res.status(500).json(createErrorResponse('Failed to update business profile', error, 'UPDATE_BUSINESS_PROFILE_ERROR'));
  }
});

// Family Setup Routes

/*
  Create family group (authenticated)
  Sets up family sustainability tracking
*/
app.post('/api/family/setup', authenticateToken, async (req, res) => {
  try {
    // Mock family group creation (would need family_groups table)
    const mockFamilyGroup = {
      id: uuidv4(),
      name: `${req.user.username}'s Family`,
      admin_id: req.user.id,
      members: [req.user.id],
      created_at: new Date().toISOString(),
      family_goals: {
        plastic_reduction: 50,
        energy_savings: 20,
        transportation_emissions: 30
      }
    };

    res.status(201).json({
      message: 'Family group created successfully',
      family_group: mockFamilyGroup
    });
  } catch (error) {
    console.error('Create family group error:', error);
    res.status(500).json(createErrorResponse('Failed to create family group', error, 'CREATE_FAMILY_GROUP_ERROR'));
  }
});

// Carbon Tracking Routes

/*
  Get carbon footprint data (authenticated)
  Returns aggregated environmental impact metrics
*/
app.get('/api/tracker', authenticateToken, async (req, res) => {
  try {
    const { category, date_range } = req.query;
    
    // Mock carbon footprint data (would need carbon_tracking table)
    const mockFootprintData = {
      user_id: req.user.id,
      total_co2_kg: 1250.75,
      period: date_range || '30d',
      breakdown: {
        transportation: 450.25,
        energy: 320.50,
        diet: 280.00,
        shopping: 150.00,
        waste: 35.00,
        water: 15.00
      },
      goals: {
        transportation: { target: 400, current: 450.25, status: 'above_target' },
        energy: { target: 350, current: 320.50, status: 'on_target' },
        diet: { target: 300, current: 280.00, status: 'below_target' }
      },
      trends: {
        weekly_change: -5.2,
        monthly_change: -12.8,
        yearly_projection: 14500
      }
    };

    // Filter by category if specified
    if (category && mockFootprintData.breakdown[category]) {
      res.json({
        category,
        co2_kg: mockFootprintData.breakdown[category],
        goal: mockFootprintData.goals[category],
        period: date_range || '30d'
      });
    } else {
      res.json(mockFootprintData);
    }
  } catch (error) {
    console.error('Get tracker data error:', error);
    res.status(500).json(createErrorResponse('Failed to get tracker data', error, 'GET_TRACKER_ERROR'));
  }
});

// Recommendations Routes

/*
  Get personalized sustainability recommendations (authenticated)
  Uses AI engine to suggest actions based on user data
*/
app.get('/api/recommendations', authenticateToken, async (req, res) => {
  try {
    const { category } = req.query;
    
    // Generate AI-powered recommendations
    const recommendations = await generatePersonalizedRecommendations({
      user_id: req.user.id,
      category,
      activity_data: {} // Would fetch real user activity data
    });

    res.json(recommendations);
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json(createErrorResponse('Failed to get recommendations', error, 'GET_RECOMMENDATIONS_ERROR'));
  }
});

// Carbon Offset Routes

/*
  Purchase carbon offset credits (authenticated)
  Processes payment and generates certificate
*/
app.post('/api/carbon-offset', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json(createErrorResponse('Valid amount is required', null, 'INVALID_AMOUNT'));
    }

    // Process carbon offset payment
    const paymentResult = await processCarbonOffsetPayment({
      user_id: req.user.id,
      amount,
      payment_method: 'mock_payment'
    });

    res.json({
      message: 'Carbon offset purchase completed',
      transaction: paymentResult
    });
  } catch (error) {
    console.error('Carbon offset purchase error:', error);
    res.status(500).json(createErrorResponse('Failed to process carbon offset purchase', error, 'CARBON_OFFSET_ERROR'));
  }
});

// Notifications Routes

/*
  Get user notifications (authenticated)
  Returns user's notification feed
*/
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    // Mock notifications (would need notifications table)
    const mockNotifications = [
      {
        id: uuidv4(),
        user_id: req.user.id,
        type: 'challenge_progress',
        message: 'Great job! You\'re 75% through the Plastic-Free July challenge.',
        read: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: uuidv4(),
        user_id: req.user.id,
        type: 'post_liked',
        message: 'Your post "My Zero Waste Journey" received 10 new likes!',
        read: false,
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        id: uuidv4(),
        user_id: req.user.id,
        type: 'recommendation',
        message: 'New personalized eco-tip: Switch to LED bulbs to save 25kg CO2/month',
        read: true,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    res.json(mockNotifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json(createErrorResponse('Failed to get notifications', error, 'GET_NOTIFICATIONS_ERROR'));
  }
});

/*
  Mark notification as read (authenticated)
  Updates notification read status
*/
app.post('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { notification_id } = req.body;
    
    if (!notification_id) {
      return res.status(400).json(createErrorResponse('Notification ID is required', null, 'NOTIFICATION_ID_REQUIRED'));
    }

    // Mock notification update
    res.json({
      message: 'Notification marked as read',
      notification_id,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json(createErrorResponse('Failed to mark notification as read', error, 'MARK_NOTIFICATION_ERROR'));
  }
});

// File Upload Route

/*
  Handle file uploads for user content
  Stores files locally and returns access URL
*/
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(createErrorResponse('No file provided', null, 'NO_FILE'));
    }

    const fileUrl = `/storage/${req.file.filename}`;
    
    res.json({
      message: 'File uploaded successfully',
      file_url: fileUrl,
      file_name: req.file.filename,
      original_name: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json(createErrorResponse('Failed to upload file', error, 'UPLOAD_ERROR'));
  }
});

// Serve uploaded files
app.use('/storage', express.static(path.join(__dirname, 'storage')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Socket.IO Event Handlers

/*
  Handle websocket connections and realtime events
  Supports authentication and real-time community interactions
*/
io.on('connection', (socket) => {
  console.log(`User ${socket.user.username} connected via websocket`);

  // Join user to their personal room
  socket.join(`user_${socket.user.id}`);

  /*
    Handle activity logging event
    Records user environmental activities and emits to relevant listeners
  */
  socket.on('log_activity', async (data) => {
    try {
      const { category, quantity, unit, description } = data;
      
      // Calculate carbon impact
      const impact = await calculateCarbonFootprint({
        activity_type: category,
        quantity,
        unit,
        location: 'US'
      });

      const activityEvent = {
        user_id: socket.user.id,
        category,
        impact: impact.co2_equivalent_kg,
        timestamp: new Date().toISOString(),
        description
      };

      // Emit to all connected users (public feed)
      io.emit('activity.logged', activityEvent);
      
      // Update user's recommendations based on new activity
      const updatedRecommendations = await generatePersonalizedRecommendations({
        user_id: socket.user.id,
        category,
        activity_data: { recent_activity: activityEvent }
      });

      // Send updated recommendations to user
      socket.emit('recommendation.updated', updatedRecommendations);

    } catch (error) {
      console.error('Activity logging error:', error);
      socket.emit('error', { message: 'Failed to log activity' });
    }
  });

  /*
    Handle goal update event
    Updates user sustainability goals and emits progress
  */
  socket.on('update_goal', async (data) => {
    try {
      const { category, target, timeframe } = data;
      
      const goalEvent = {
        user_id: socket.user.id,
        category,
        target,
        timeframe,
        updated_at: new Date().toISOString()
      };

      // Emit goal update to user's connected devices
      io.to(`user_${socket.user.id}`).emit('goal.updated', goalEvent);
      
    } catch (error) {
      console.error('Goal update error:', error);
      socket.emit('error', { message: 'Failed to update goal' });
    }
  });

  /*
    Handle challenge progress update
    Tracks and broadcasts user progress in sustainability challenges
  */
  socket.on('update_challenge_progress', async (data) => {
    try {
      const { challenge_id, activity_data } = data;
      
      // Mock challenge progress calculation
      const progressEvent = {
        challenge_id,
        user_id: socket.user.id,
        progress: Math.min(100, Math.random() * 100), // Mock progress
        achievements: [
          {
            activity_id: uuidv4(),
            timestamp: new Date().toISOString()
          }
        ],
        updated_at: new Date().toISOString()
      };

      // Emit progress to challenge participants
      io.emit('challenge.progress', progressEvent);
      
    } catch (error) {
      console.error('Challenge progress error:', error);
      socket.emit('error', { message: 'Failed to update challenge progress' });
    }
  });

  /*
    Handle webinar chat messages
    Enables real-time communication during educational webinars
  */
  socket.on('webinar_message', async (data) => {
    try {
      const { webinar_id, message_text } = data;
      
      const messageEvent = {
        webinar_id,
        message_text,
        sender_id: socket.user.id,
        sender_username: socket.user.username,
        timestamp: new Date().toISOString()
      };

      // Emit message to webinar participants
      io.to(`webinar_${webinar_id}`).emit('new_webinar_message', messageEvent);
      
    } catch (error) {
      console.error('Webinar message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  /*
    Handle joining webinar room
    Allows users to participate in live educational sessions
  */
  socket.on('join_webinar', (data) => {
    const { webinar_id } = data;
    socket.join(`webinar_${webinar_id}`);
    
    socket.emit('webinar_joined', {
      webinar_id,
      message: 'Successfully joined webinar'
    });
  });

  /*
    Handle leaving webinar room
    Removes user from webinar communication
  */
  socket.on('leave_webinar', (data) => {
    const { webinar_id } = data;
    socket.leave(`webinar_${webinar_id}`);
    
    socket.emit('webinar_left', {
      webinar_id,
      message: 'Left webinar'
    });
  });

  /*
    Handle user disconnection
    Cleanup and logging for disconnected users
  */
  socket.on('disconnect', () => {
    console.log(`User ${socket.user.username} disconnected`);
  });
});

// Catch-all route for SPA routing (exclude API routes)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

export { app, pool };

// Start the server
const portNumber = Number(PORT);
server.listen(portNumber, '0.0.0.0', () => {
  console.log(`eco11 server running on port ${portNumber} and listening on 0.0.0.0`);
  console.log(`REST API available at http://localhost:${portNumber}/api`);
  console.log(`WebSocket available at http://localhost:${portNumber}`);
});