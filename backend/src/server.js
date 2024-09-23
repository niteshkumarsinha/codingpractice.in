// backend/server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const AWS = require('aws-sdk');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(bodyParser.json());

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

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
