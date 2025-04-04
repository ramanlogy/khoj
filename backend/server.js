const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000; // Use environment variable or default

// --- Middleware ---

// Enable CORS - Configure appropriately for production
// For development, allowing all origins is usually fine.
// For production, restrict it:
// const corsOptions = {
//   origin: 'https://khojum.com', // Your frontend domain
//   optionsSuccessStatus: 200
// }
// app.use(cors(corsOptions));
app.use(cors()); // Allow all for now

// Serve static files from the frontend directory
// This makes index.html, css/*, js/*, assets/* available
app.use(express.static(path.join(__dirname, '../frontend')));

// --- API Routes ---
app.get('/api/events', (req, res) => {
    const eventsFilePath = path.join(__dirname, 'events.json');
    console.log(`[${new Date().toISOString()}] GET /api/events - Reading file: ${eventsFilePath}`); // Logging

    fs.readFile(eventsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`[${new Date().toISOString()}] Error reading events file:`, err);
            return res.status(500).json({ error: 'Failed to load event data from server.' });
        }
        try {
            const events = JSON.parse(data);
            console.log(`[${new Date().toISOString()}] GET /api/events - Successfully read and parsed ${events.length} events.`); // Logging
            res.json(events);
        } catch (parseError) {
            console.error(`[${new Date().toISOString()}] Error parsing events JSON:`, parseError);
            return res.status(500).json({ error: 'Failed to parse event data on server.' });
        }
    });
});

// --- Serve Frontend ---
// Handle SPA routing: send index.html for any non-API, non-file request
app.get('*', (req, res) => {
    const requestedPath = req.path;
    // Simple check: if path doesn't look like a file extension and isn't an API route
    if (!path.extname(requestedPath) && !requestedPath.startsWith('/api/')) {
        console.log(`[${new Date().toISOString()}] Serving index.html for path: ${requestedPath}`); // Logging
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    } else {
        // Let express.static handle it, or it will 404 eventually
        console.log(`[${new Date().toISOString()}] Letting static middleware handle or 404 for: ${requestedPath}`); // Logging
         // Explicitly send 404 if static middleware didn't find it
         // Note: express.static handles sending files it finds. If it doesn't find anything,
         // the request reaches here. We only send index.html for non-file-like paths.
         res.status(404).sendFile(path.join(__dirname, '../frontend/404.html')); // Optional: create a 404.html page
        // Or just send a simple 404:
        // res.status(404).send('Not Found');
    }
});

// --- Start Server ---
app.listen(port, () => {
    console.log(`Khojum server listening at http://localhost:${port}`);
    console.log(`Serving static files from: ${path.join(__dirname, '../frontend')}`);
});