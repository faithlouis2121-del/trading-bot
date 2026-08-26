const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// Serve your index.html file
app.use(express.static(__dirname));

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
    res.json({ status: 'success', reply: `Executed command: ${command}` });
});

app.listen(PORT, () => {
    console.log(`Web dashboard running live on port ${PORT}`);
});
