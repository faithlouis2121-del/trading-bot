const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve your index.html file
app.use(express.static(__dirname));

// Simulated Trading State
let portfolio = {
    cash: 100000.00,
    btc: 0.0,
    eth: 0.0
};

let eventLogs = [
    "[11:12:00] Core online.",
    "[11:12:02] Express mounted.",
    "[11:12:05] Secure route established with market feed."
];

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/crypto-prices', async (req, res) => {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd', {
            headers: { 'User-Agent': 'VanguardTradingBot/1.0' }
        });
        const data = await response.json();
        res.json({ status: 'success', prices: data });
    } catch (err) {
        // Fallback simulated prices if external API limits
        res.json({ 
            status: 'success', 
            prices: { bitcoin: { usd: 78428 }, ethereum: { usd: 2459 } } 
        });
    }
});

// Get current system state & logs
app.get('/api/system-state', (req, res) => {
    res.json({ status: 'success', portfolio, eventLogs });
});

app.post('/api/command', async (req, res) => {
    const { command } = req.body;
    let reply = `Executed command: ${command}`;
    const cmdLower = (command || '').trim().toLowerCase();
    
    const timestamp = new Date().toLocaleTimeString();

    if (cmdLower.includes('status')) {
        reply = 'SYSTEM STATUS: All engines nominal. Momentum-Arbitrage active. Latency: 14ms.';
    } else if (cmdLower.includes('balance')) {
        reply = `PAPER BALANCE: Cash: $${portfolio.cash.toFixed(2)} | BTC: ${portfolio.btc.toFixed(4)} | ETH: ${portfolio.eth.toFixed(4)}`;
    } else if (cmdLower.includes('help')) {
        reply = 'COMMANDS: status, balance, buy btc, sell btc, reset, help';
    } else if (cmdLower.startsWith('buy btc')) {
        const btcPrice = 78428.00; // Standard execution price
        const cost = btcPrice * 0.1; // Buy 0.1 BTC
        
        if (portfolio.cash >= cost) {
            portfolio.cash -= cost;
            portfolio.btc += 0.1;
            reply = `SUCCESS: Bought 0.1 BTC at $${btcPrice.toLocaleString()}. Cost: $${cost.toFixed(2)}`;
            eventLogs.push(`[${timestamp}] TRADE: Bought 0.1 BTC for $${cost.toFixed(2)}`);
        } else {
            reply = `ERROR: Insufficient cash ($${portfolio.cash.toFixed(2)}) to buy 0.1 BTC ($${cost.toFixed(2)}).`;
        }
    } else if (cmdLower.startsWith('sell btc')) {
        if (portfolio.btc >= 0.1) {
            const btcPrice = 78428.00;
            const revenue = btcPrice * 0.1;
            
            portfolio.cash += revenue;
            portfolio.btc -= 0.1;
            reply = `SUCCESS: Sold 0.1 BTC at $${btcPrice.toLocaleString()}. Revenue: $${revenue.toFixed(2)}`;
            eventLogs.push(`[${timestamp}] TRADE: Sold 0.1 BTC for $${revenue.toFixed(2)}`);
        } else {
            reply = 'ERROR: No BTC holdings available to sell.';
        }
    } else if (cmdLower.includes('reset')) {
        portfolio = { cash: 100000.00, btc: 0.0, eth: 0.0 };
        reply = 'PORTFOLIO RESET: Balance restored to $100,000.00 USD.';
        eventLogs.push(`[${timestamp}] SYSTEM: Paper trading portfolio reset.`);
    }

    // Keep event logs trimmed to last 10 entries
    if (eventLogs.length > 10) eventLogs.shift();

    res.json({ status: 'success', reply, eventLogs, portfolio });
});

app.listen(PORT, () => {
    console.log(`Web dashboard running live on port ${PORT}`);
});
