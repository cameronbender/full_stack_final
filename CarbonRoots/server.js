const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'postgresql://user:password@host:port/database') {
    console.error('Error: DATABASE_URL is not set or is still the default placeholder.');
    console.error('Please update your .env file with your actual PostgreSQL connection string.');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }, // Handle SSL for production/remote DBs
});

// Test DB Connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Connected to database at:', res.rows[0].now);
    }
});

// Multer Setup for File Uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- API Routes ---

// 1. Auth Routes
app.post('/api/signup', async (req, res) => {
    const { full_name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO pdf.users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, full_name, email',
            [full_name, email, hashedPassword]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // Unique violation
            res.status(409).json({ error: 'Email already exists' });
        } else {
            res.status(500).json({ error: 'Server error' });
        }
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM pdf.users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({ message: 'Login successful', user: { id: user.id, name: user.full_name, email: user.email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 2. Contact Routes
app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;
    try {
        // Save to DB
        const result = await pool.query(
            'INSERT INTO pdf.contact_messages (full_name, email, subject, message) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, email, subject, message]
        );

        // Save to CSV
        const csvLine = `"${new Date().toISOString()}","${name}","${email}","${subject}","${message.replace(/"/g, '""')}"\n`;
        const csvPath = path.join(__dirname, 'contact_messages.csv');

        try {
            if (!fs.existsSync(csvPath)) {
                fs.writeFileSync(csvPath, 'Timestamp,Name,Email,Subject,Message\n');
            }
            fs.appendFileSync(csvPath, csvLine);
            console.log('Message saved to CSV');
        } catch (csvErr) {
            console.error('Error writing to CSV:', csvErr);
            // Does not fail the request if CSV logging fails, but logs it
        }

        res.status(201).json({ message: 'Message sent successfully', data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 3. Proposal Routes
app.get('/api/proposals', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, f.filename 
            FROM pdf.proposals p 
            LEFT JOIN pdf.files f ON p.pdf_id = f.id
            ORDER BY p.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/proposals', upload.single('pdf'), async (req, res) => {
    const { title, author_name, institution, supervisor } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Insert PDF
        const pdfResult = await client.query(
            'INSERT INTO pdf.files (filename, content) VALUES ($1, $2) RETURNING id',
            [file.originalname, file.buffer]
        );
        const pdfId = pdfResult.rows[0].id;

        // 2. Insert Proposal
        const proposalResult = await client.query(
            'INSERT INTO pdf.proposals (title, author_name, institution, supervisor, pdf_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, author_name, institution, supervisor, pdfId]
        );

        await client.query('COMMIT');
        res.status(201).json(proposalResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

// 4. PDF Retrieval Route
app.get('/api/pdf/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT filename, content FROM pdf.files WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }
        const file = result.rows[0];

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
        res.send(file.content);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
