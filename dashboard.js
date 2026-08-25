const express = require('express');
const app = express();
const PORT = 3000;

const symbol = 'AAPL';

app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Alpaca Trading Bot Dashboard</title>
                <meta http-equiv="refresh" content="5">
                <style>
                    body { font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; }
                    .card { background: #1e293b; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); max-width: 500px; margin-bottom: 20px; }
                    h1 { color: #38bdf8; }
                    .status { font-weight: bold; color: #4ade80; }
                </style>
            </head>
            <body>
                <h1>Algorithmic Trading Dashboard</h1>
                <div class="card">
                    <h3>Bot Status: <span class="status">ONLINE & RUNNING</span></h3>
                    <p>Monitoring Target Asset: <b>${symbol}</b></p>
                    <p>This dashboard auto-refreshes every 5 seconds to track your paper trading engine.</p>
                </div>
            </body>
        </html>
    `);
});

app.listen(PORT, '0.0.0.0',() => {
    console.log(`Web dashboard running live! Open your browser and go to: http://localhost:${PORT}`);
});