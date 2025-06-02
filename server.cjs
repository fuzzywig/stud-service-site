const express = require('express');
const path    = require('path');
const app     = express();

// Serve the built-assets in dist/
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
