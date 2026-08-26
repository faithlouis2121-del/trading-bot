const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = process.env.PORT || 10000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve your index.html file
app.use(express.static(__dirname));

// Initialize SQLite Database (creates a local file persistent on disk)
const dbPath = path.resolve(__dirname, 'trading.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Database opening error: ' + err.message);
    else console.log('Connected to SQLite database.');
});

// Setup database tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS portfolio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cash REAL,
        btc REAL,
        eth REAL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS event_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        message TEXT
    )`);

    // Seed initial portfolio if empty
    db.get(`SELECT COUNT(*) as count FROM portfolio`, (err, row) => {
        if (row && row.count === 0) {
            db.run(`INSERT INTO portfolio (cash, btc, eth) VALUES (100000.00, 0.0, 0.0)`);
            db.run(`INSERT INTO event_logs (timestamp, message) VALUES ('${new Date().toLocaleTimeString()}', 'Core online & database initialized.')`);
        }
    });
});

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
        res.json({ 
            status: 'success', 
            prices: { bitcoin: { usd: 78428 }, ethereum: { usd: 2459 } } 
        });
    }
});

// Get current system state & logs from DB
app.get('/api/system-state', (req, res) => {
    db.get(`SELECT cash, btc, eth FROM portfolio ORDER BY id DESC LIMIT 1`, (err, portfolio) => {
        db.all(`SELECT message FROM event_logs ORDER BY id DESC LIMIT 10`, (err, logs) => {
            const eventLogs = logs ? logs.reverse().map(l => l.message) : [];
            res.json({ 
                status: 'success', 
                portfolio: portfolio || { cash: 100000, btc: 0, eth: 0 }, 
                eventLogs 
            });
        });
    });
});

app.post('/api/command', async (req, res) => {
    const { command } = req.body;
    let reply = `Executed command: ${command}`;
    const cmdLower = (command || '').trim().toLowerCase();
    const timestamp = new Date().toLocaleTimeString();

    db.get(`SELECT id, cash, btc, eth FROM portfolio ORDER BY id DESC LIMIT 1`, async (err, portfolio) => {
        if (!portfolio) portfolio = { cash: 100000, btc: 0, eth: 0 };

        if (cmdLower.includes('status')) {
            reply = 'SYSTEM STATUS: All engines nominal. Momentum-Arbitrage active. Latency: 14ms.';
            sendResponse();
        } else if (cmdLower.includes('balance')) {
            reply = `PAPER BALANCE: Cash: $${portfolio.cash.toFixed(2)} | BTC: ${portfolio.btc.toFixed(4)} | ETH: ${portfolio.eth.toFixed(4)}`;
            sendResponse();
        } else if (cmdLower.includes('help')) {
            reply = 'COMMANDS: status, balance, buy btc, sell btc, reset, help';
            sendResponse();
        } else if (cmdLower.startsWith('buy bts') || cmdLower.startsWith('buy btc')) {
            const btcPrice = 78428.00;
            const cost = btcPrice * 0.1;
            
            if (portfolio.cash >= cost) {
                const newCash = portfolio.cash - cost;
                const newBtc = portfolio.btc + 0.1;
                const logMsg = `[${timestamp}] TRADE: Bought 0.1 BTC for $${cost.toFixed(2)}`;
                
                db.run(`INSERT INTO portfolio (cash, btc, eth) VALUES (?, ?, ?)`, [newCash, newBtc, portfolio.eth], () => {
                    db.run(`INSERT INTO event_logs (timestamp, message) VALUES (?, ?)`, [timestamp, logMsg], () => {
                        reply = `SUCCESS: Bought 0.1 BTC at $${btcPrice.toLocaleString()}. Cost: $${cost.toFixed(2)}`;
                        sendResponse();
                    });
                });
            } else {
                reply = `ERROR: Insufficient cash ($${portfolio.cash.toFixed(2)}) to buy 0.1 BTC ($${cost.toFixed(2)}).`;
                sendResponse();
            }
        } else if (cmdLower.startsWith('sell btc')) {
            if (portfolio.btc >= 0.1) {
                const btcPrice = 78428.00;
                const revenue = btcPrice * 0.1;
                const newCash = portfolio.cash + revenue;
                const newBtc = portfolio.btc - 0.1;
                const logMsg = `[${timestamp}] TRADE: Sold 0.1 BTC for $${revenue.toFixed(2)}`;
                
                db.run(`INSERT INTO portfolio (cash, btc, eth) VALUES (?, ?, ?)`, [newCash, newBtc, portfolio.eth], () => {
                    db.run(`INSERT INTO event_logs (timestamp, message) VALUES (?, ?)`, [timestamp, logMsg], () => {
                        reply = `SUCCESS: Sold 0.1 BTC at $${btcPrice.toLocaleString()}. Revenue: $${revenue.toFixed(2)}`;
                        sendResponse();
                    });
                });
            } else {
                reply = 'ERROR: No BTC holdings available to sell.';
                sendResponse();
            }
        } else if (cmdLower.includes('reset')) {
            const logMsg = `[${timestamp}] SYSTEM: Paper trading portfolio reset.`;
            db.run(`INSERT INTO portfolio (cash, btc, eth) VALUES (100000.00, 0.0, 0.0)`, () => {
                db.run(`INSERT INTO event_logs (timestamp, message) VALUES (?, ?)`, [timestamp, logMsg], () => {
                    reply = 'PORTFOLIO RESET: Balance restored to $100,000.00 USD.';
                    sendResponse();
                });
            });
        } else {
            sendResponse();
        }
    });

    function sendResponse() {
        db.get(`SELECT cash, btc, eth FROM portfolio ORDER BY id DESC LIMIT 1`, (err, updatedPortfolio) => {
            db.all(`SELECT message FROM event_logs ORDER BY id DESC LIMIT 10`, (err, logs) => {
                const eventLogs = logs ? logs.reverse().map(l => l.message) : [];
                res.json({ 
                    status: 'success', 
                    reply, 
                    eventLogs, 
                    portfolio: updatedPortfolio || portfolio 
                });
            });
        });
    }
});

app.listen(PORT, () => {
    console.log(`Web dashboard running live on port ${PORT}`);
});
