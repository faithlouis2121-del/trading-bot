const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve your index.html file
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/crypto-prices', async (req, res) => {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
        const data = await response.json();
        res.json({ status: 'success', prices: data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch prices' });
    }
});

app.post('/api/command', (req, res) => {
    const { command } = req.body;
    let reply = `Executed command: ${command}`;
    
    const cmdLower = (command || '').trim().toLowerCase();
    if (cmdLower.includes('status')) {
        reply = 'SYSTEM STATUS: All engines nominal. Momentum-Arbitrage active. Latency: 14ms.';
    } else if (cmdLower.includes('balance')) {
        reply = 'PAPER ACCOUNT BALANCE: $100,000.00 USD (Simulated)';
    } else if (cmdLower.includes('help')) {
        reply = 'AVAILABLE COMMANDS: status, balance, reconnect, help';
    }

    res.json({ status: 'success', reply: reply });
});

app.listen(PORT, () => {
    console.log(`Web dashboard running live on port ${PORT}`);
});
