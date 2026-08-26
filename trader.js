const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// Serve static HTML/CSS files from the root directory
app.use(express.static('.'));

// Live Crypto Feed Endpoint (Phase 1 Data Stream)
app.get('/api/crypto-prices', async (req, res) => {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
        
        if (!response.ok) {
            throw new Error(`Market data feed error: ${response.statusText}`);
        }

        const marketData = await response.json();
        
        res.json({
            status: 'success',
            timestamp: new Date().toISOString(),
            prices: marketData
        });
    } catch (error) {
        console.error('Error fetching live crypto tickers:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Unable to fetch live market feeds at this moment.'
        });
    }
});

// Fallback route to serve index.html for any other navigation
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server and listen on the required port
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Web dashboard running live on port ${PORT}`);
});
