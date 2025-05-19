const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4001; // Changed port to 4001 to avoid conflicts

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Serve contract artifacts
app.use('/build', express.static(path.join(__dirname, 'build')));

// Handle all routes by serving the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Decentralized Lottery app listening at http://localhost:${PORT}`);
  console.log(`Press Ctrl+C to stop the server`);
});
