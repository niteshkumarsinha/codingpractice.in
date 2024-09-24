// backend/server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const AWS = require('aws-sdk');
const multer = require('multer');
const lambda = new AWS.Lambda();
const rateLimit = require('express-rate-limit');

const { verifyToken } = require('./middlewares/auth');  // JWT token verification for admin

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});


app.get('/video/:problemId', verifyToken, async (req, res) => {
  const { problemId } = req.params;

  const problem = await pool.query('SELECT * FROM problems WHERE problem_id = $1', [problemId]);
  const videoKey = problem.rows[0].video_url;

  const params = {
    Bucket: 'your-s3-bucket',
    Key: videoKey,
    Expires: 60, // URL expires in 60 seconds
  };

  const signedUrl = s3.getSignedUrl('getObject', params);
  res.json({ signedUrl });
});


// PostgreSQL connection
const pool = new Pool({
  user: 'your-db-user',
  host: 'your-db-host',
  database: 'your-db-name',
  password: 'your-db-password',
  port: 5432,
});

// AWS S3 setup
const s3 = new AWS.S3({
  accessKeyId: 'your-aws-access-key',
  secretAccessKey: 'your-aws-secret-key',
  region: 'your-region',
});

// Multer setup for handling file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Fetch coding problems
app.get('/problems', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM problems');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query error' });
  }
});

// Submit code
app.post('/submit', async (req, res) => {
  const { userId, problemId, code } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO submissions (user_id, problem_id, code, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, problemId, code, 'pending']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database insertion error' });
  }
});

// Upload video to S3 and associate with a problem
app.post('/upload-video/:problemId', upload.single('video'), async (req, res) => {
  const { problemId } = req.params;
  const video = req.file;

  const params = {
    Bucket: 'your-s3-bucket-name',
    Key: video.originalname,
    Body: video.buffer,
    ContentType: video.mimetype,
    ACL: 'public-read',  // or private if using signed URLs
  };

  try {
    const uploadResult = await s3.upload(params).promise();
    const videoUrl = uploadResult.Location;

    // Update problem with video URL
    const updateResult = await pool.query(
      'UPDATE problems SET video_url = $1 WHERE problem_id = $2 RETURNING *',
      [videoUrl, problemId]
    );

    res.json(updateResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error uploading video' });
  }
});


// Security
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

// AWS Cognito Setup
const cognitoIssuer = 'https://cognito-idp.<region>.amazonaws.com/<user-pool-id>';

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.decode(token, { complete: true });
    const publicKey = await getPublicKey(decoded.header.kid);
    jwt.verify(token, publicKey, { issuer: cognitoIssuer });
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// Fetch Cognito's public key for verifying JWT
const getPublicKey = async (kid) => {
  const response = await fetch(`${cognitoIssuer}/.well-known/jwks.json`);
  const { keys } = await response.json();
  const signingKey = keys.find((key) => key.kid === kid);
  return jwt.jwkToPem(signingKey);
};

// Apply the middleware to protect the routes
app.post('/submit', verifyToken, async (req, res) => {
  // Your submission code logic here
});



// API endpoint for submitting code
app.post('/submit', verifyToken, async (req, res) => {
  const { userId, problemId, code } = req.body;

  const params = {
    FunctionName: 'your-lambda-function-name',
    Payload: JSON.stringify({ userId, problemId, code }),
  };

  try {
    const lambdaResponse = await lambda.invoke(params).promise();
    const result = JSON.parse(lambdaResponse.Payload);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Code execution failed' });
  }
});



// // Configure Multer to handle file uploads
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// // Set up AWS S3
// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });

// Admin-only route to upload video to S3
app.post('/upload-video', verifyToken, upload.single('video'), (req, res) => {
  const file = req.file;
  const { problemId } = req.body;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  const s3Params = {
    Bucket: 'your-s3-bucket-name',
    Key: `videos/${problemId}/${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',  // or use private if using signed URLs
  };

  s3.upload(s3Params, (err, data) => {
    if (err) {
      console.error("Error uploading video: ", err);
      return res.status(500).json({ message: "Video upload failed." });
    }

    return res.status(200).json({ message: "Video uploaded successfully.", videoUrl: data.Location });
  });
});



// // Middleware for token verification
// function verifyToken(req, res, next) {
//   const token = req.headers.authorization;
//   // ... Your existing token verification logic for admin access
//   next();
// }




// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
