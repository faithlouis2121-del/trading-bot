const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Main Dashboard View Route
app.get('/', (req, res) => {
    // Placeholder variables for your paper trading engine
    const symbol = 'AAPL';
    const targetBuyPrice = 175.50;

    res.send(`
        <html>
            <head>
                <title>Alpaca Trading Bot Dashboard</title>
                <meta http-equiv="refresh" content="5">
                <style>
                    body { font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; }
                    .card { background: #1e293b; padding: 20px; border-radius: 8px; max-width: 500px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
                    h1 { color: #38bdf8; font-size: 24px; }
                    .status { font-weight: bold; color: #4ade80; }
                </style>
            </head>
            <body>
                <h1>Algorithmic Trading Dashboard</h1>
                <div class="card">
                    <h3>Bot Status: <span class="status">ONLINE & RUNNING</span></h3>
                    <p>Monitoring Target Asset: <b>${symbol}</b></p>
                    <p>Target Buy Price: <b>$${targetBuyPrice}</b></p>
                    <p>This dashboard auto-refreshes every 5 seconds to track your paper trading engine.</p>
                </div>
            </body>
        </html>
    `);
});

// Live Crypto Feed Endpoint (Phase 1 Data Stream)
app.get('/api/crypto-prices', async (req, res) => {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd');
        
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

// Start the server and listen on the required port
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Web dashboard running live on port ${PORT}`);
});