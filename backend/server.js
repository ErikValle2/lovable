const express = require('express');
const cors = require('cors');
const pool = require('./db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const { VertexAI } = require('@google-cloud/vertexai'); // Import Vertex AI SDK
require('dotenv').config();

const app = express();

// 1. INCREASE PAYLOAD LIMIT (Essential for Base64 images)
app.use(express.json({ limit: '50mb' }));
app.use(cors());

const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

// --- AUTH ROUTES ---
app.post('/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *',
      [email, hashedPassword]
    );
    res.json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) return res.status(401).json("Invalid Credential");

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) return res.status(401).json("Invalid Credential");

    const token = jwt.sign({ id: user.rows[0].id }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token, user: user.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// --- TODO ROUTES ---
app.get('/api/todos', async (req, res) => {
  try {
    const allTodos = await pool.query('SELECT * FROM todos');
    res.json(allTodos.rows);
  } catch (err) {
    console.error(err.message);
  }
});

app.post('/api/todos', async (req, res) => {
  try {
    const { title } = req.body;
    const newTodo = await pool.query(
      'INSERT INTO todos (title) VALUES($1) RETURNING *',
      [title]
    );
    res.json(newTodo.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// --- FILE UPLOAD SETUP ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') 
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });
app.use('/uploads', express.static('uploads'));

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
});

// --- VERTEX AI SETUP ---
// Ensure these match your actual Google Cloud project details
const vertex_ai = new VertexAI({
  project: process.env.GOOGLE_PROJECT_ID || 'monna-466413', 
  location: process.env.GOOGLE_LOCATION || 'us-central1'
});

// Initialize the specific model you requested
const model = vertex_ai.preview.getGenerativeModel({
  model: 'gemini-2.5-flash-image',
  // Optional: Safety settings to prevent blocking generated content
  safetySettings: [{
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_ONLY_HIGH'
  }]
});

// --- API ROUTE ---
app.post('/api/generate-tryon', async (req, res) => {
  try {
    const { imageBase64, prompt, category } = req.body;

    console.log(`Generating Try-On with Gemini 2.5 for category: ${category}`);

    // 1. Clean the Base64 String
    // Frontend sends "data:image/jpeg;base64,..." but Vertex expects just the raw string
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // 2. Construct Multimodal Request
    // We send both the text prompt and the image part
    const request = {
      contents: [{
        role: 'user',
        parts: [
          { 
            text: `Act as a virtual try-on assistant. Category: ${category}. ${prompt} 
                   Return the result as a generated image.` 
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data
            }
          }
        ]
      }]
    };

    // 3. Call Vertex AI
    const result = await model.generateContent(request);
    const response = await result.response;
    
    // 4. Handle Response (Image vs Text)
    // If the model generates an image, it returns it as inlineData
    // If it returns text (refusal or description), we handle that too.
    
    // Check if we got an image back (Standard for Image Generation models)
    // Note: If 'gemini-2.5-flash-image' is text-only, this will need to be adapted.
    // We assume here it behaves like Imagen or Pro-Vision generation models.
    const generatedCandidates = response.candidates[0].content.parts;
    
    // Look for an image part in the response
    const imagePart = generatedCandidates.find(part => part.inlineData);

    if (imagePart) {
        // Convert raw buffer/base64 back to a Data URL for the frontend
        const returnedBase64 = imagePart.inlineData.data;
        const mimeType = imagePart.inlineData.mimeType || 'image/png';
        const finalUrl = `data:${mimeType};base64,${returnedBase64}`;
        
        res.json({ generatedImageUrl: finalUrl, status: 'success' });
    } else {
        // Fallback: If model returned text (e.g., "I cannot do that"), log it
        const textPart = generatedCandidates.find(part => part.text);
        console.warn("Model returned text instead of image:", textPart?.text);
        
        res.json({ 
            // Send a placeholder or the text if appropriate
            generatedImageUrl: "https://via.placeholder.com/600x800?text=Model+Returned+Text+Only", 
            message: textPart?.text 
        });
    }

  } catch (error) {
    console.error("Vertex AI Error:", error);
    res.status(500).json({ error: "Failed to process with Vertex AI" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});