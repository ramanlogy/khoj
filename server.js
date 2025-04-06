// server.js - Revised for Simplified Form

const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and URL-encoded data
// No need for multer if the simplified form has no file uploads yet
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' directory
// This makes index.html, promote.html, css, js accessible
app.use(express.static(path.join(__dirname, 'public')));

// Data storage setup (same as before)
const dataFilePath = path.join(__dirname, 'data', 'listings.json');
if (!fs.existsSync(path.dirname(dataFilePath))) {
  fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
}
if (!fs.existsSync(dataFilePath)) {
  fs.writeFileSync(dataFilePath, JSON.stringify([], null, 2));
}

// Helper functions (same as before)
function readListings() { /* ... keep existing readListings ... */
     try { const data = fs.readFileSync(dataFilePath, 'utf8'); return JSON.parse(data); } catch (error) { console.error('Error reading listings:', error); return []; }
 }
function writeListings(listings) { /* ... keep existing writeListings ... */
     try { fs.writeFileSync(dataFilePath, JSON.stringify(listings, null, 2)); return true; } catch (error) { console.error('Error writing listings:', error); return false; }
 }

// --- Handle SIMPLIFIED Form Submission ---
// Remove 'uploadFields' middleware if no files are expected from the simple form
app.post('/api/quick-submit', (req, res) => { // Changed endpoint for clarity
  console.log('Received Quick Submit Request Body:', req.body); // Log received data

  try {
    // Extract form data expected from the *simplified* form
    const {
      businessName,
      businessCategory, // Changed from 'deal-category' in HTML? Ensure match.
      dealTitle,
      dealDescription,
      dealExpiryDate,
      contactEmail,
      termsAgree // Check if checkbox value is sent ('on' or similar)
    } = req.body;

    // --- Basic Validation ---
    if (!businessName || !dealTitle || !businessCategory || !dealExpiryDate || !contactEmail || !termsAgree) {
      console.warn('Validation Failed: Missing required fields.', req.body);
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.'
      });
    }
     if (termsAgree !== 'on') { // HTML checkboxes often send 'on' when checked
         console.warn('Validation Failed: Terms not agreed.');
         return res.status(400).json({ success: false, message: 'You must agree to the terms.' });
     }


    // Create new listing object (simplified structure)
    const newListing = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      status: 'pending_simple', // New status for quick submissions
      business: {
        name: businessName,
        category: businessCategory,
        // Add other business fields as null initially if needed later
        address: null,
        phone: null,
        email: null, // Can store contactEmail here too if desired
        website: null,
        logoPath: null
      },
      deal: {
        title: dealTitle,
        description: dealDescription,
        discountPercentage: null, // Not collected in simple form
        expiryDate: dealExpiryDate,
        imagePath: null // No image in simple form
        // Add other deal fields as null initially
      },
      contact: {
        // name: null, // Not collected in simple form
        email: contactEmail // Use the required contact email
      },
      submissionType: 'quick' // Mark as a quick submission
    };

    console.log('Creating new listing:', newListing);

    const listings = readListings();
    listings.push(newListing);

    if (writeListings(listings)) {
      console.log('Listing saved successfully:', newListing.id);
      // --- Success Response ---
      // Option 1: Send JSON back (good for JS handling)
      // res.status(201).json({
      //   success: true,
      //   message: 'Deal submitted successfully! We will review it shortly.',
      //   listingId: newListing.id
      // });

      // Option 2: Redirect to a 'Thank You' page
       res.redirect('/submission-success.html'); // Create this page

    } else {
      console.error('Failed to write listings file.');
      res.status(500).json({
        success: false,
        message: 'Error saving your deal. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Error processing quick submission:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing your submission. Please try again.'
    });
  }
});

// --- Keep the endpoint for the FULL form if you still have it ---
// app.post('/api/submit-listing', uploadFields, (req, res) => { ... });

// --- Keep other routes like GET /api/listings, GET / etc. ---
app.get('/api/listings', (req, res) => { /* ... keep existing logic ... */
     const listings = readListings(); const approvedListings = listings.filter(listing => listing.status === 'approved'); res.json({ success: true, count: approvedListings.length, listings: approvedListings });
 });

// Serve a success page (Create this file in /public)
app.get('/submission-success.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'submission-success.html'));
});

// Serve the main HTML file if requested directly
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Serve the promote page
app.get('/promote', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'promote.html')); // Serve the correct form page
});


// --- Keep Error Handling Middleware if using Multer ---
// app.use((error, req, res, next) => { ... }); // Keep if using the full form endpoint

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});