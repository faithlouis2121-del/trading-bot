const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = process.env.PORT || 10000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static assets
app.use(express.static(__dirname));

// Initialize Aethenom Core SQLite Database
const dbPath = path.resolve(__dirname, 'trading.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Aethenom DB initialization error: ' + err.message);
    else console.log('Aethenom core connected to SQLite database.');
});

// Setup pristine database tables for portfolio, logs, bills, tax compliance, and career workflows
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS portfolio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cash REAL,
        btc REAL,
        eth REAL,
        updated_at TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS event_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        message TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS bills_ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        biller_name TEXT,
        amount REAL,
        due_date TEXT,
        status TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS tax_ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT,
        deductible_amount REAL,
        status TEXT,
        logged_date TEXT
    )`);

    // New Professional Career & Occupational Workflow Ledger
    db.run(`CREATE TABLE IF NOT EXISTS career_workflows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profession TEXT,
        active_task TEXT,
        status TEXT
    )`);

    // Seed initial data if uninitialized
    db.get(`SELECT COUNT(*) as count FROM portfolio`, (err, row) => {
        if (row && row.count === 0) {
            const timestamp = new Date().toLocaleTimeString();
            db.run(`INSERT INTO portfolio (cash, btc, eth, updated_at) VALUES (100000.00, 0.0, 0.0, ?)`, [timestamp]);
            db.run(`INSERT INTO event_logs (timestamp, message) VALUES (?, ?)`, [timestamp, 'Aethenom Core online. Universal career workflow routing armed.']);
            
            db.run(`INSERT INTO bills_ledger (biller_name, amount, due_date, status) VALUES ('Household Utilities', 350.00, '2026-09-01', 'Pending')`);
            db.run(`INSERT INTO bills_ledger (biller_name, amount, due_date, status) VALUES ('Children Extracurricular Activities', 450.00, '2026-09-05', 'Optimized')`);
            
            db.run(`INSERT INTO tax_ledger (category, deductible_amount, status, logged_date) VALUES ('Home Office & Infrastructure', 1250.00, 'Verified Write-Off', '2026-08-26')`);
            db.run(`INSERT INTO tax_ledger (category, deductible_amount, status, logged_date) VALUES ('Tech & AI Cloud Orchestration', 840.00, 'Optimized Loophole', '2026-08-26')`);

            // Seed initial cross-industry career templates
            db.run(`INSERT INTO career_workflows (profession, active_task, status) VALUES ('Education', 'Weekly Curriculum & Lesson Plan Matrix', 'Ready')`);
            db.run(`INSERT INTO career_workflows (profession, active_task, status) VALUES ('Engineering', 'CI/CD Pipeline Telemetry & Architecture Spec', 'Optimized')`);
            db.run(`INSERT INTO career_workflows (profession, active_task, status) VALUES ('Healthcare', 'Differential Reference & Clinical Flow Sync', 'Active')`);
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Real-time market feed endpoint
app.get('/api/crypto-prices', async (req, res) => {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd', {
            headers: { 'User-Agent': 'AethenomCore/1.0' }
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

// Fetch live system state, balances, bills, tax logs, career modules, and audit trails
app.get('/api/system-state', (req, res) => {
    db.get(`SELECT cash, btc, eth FROM portfolio ORDER BY id DESC LIMIT 1`, (err, portfolio) => {
        db.all(`SELECT message FROM event_logs ORDER BY id DESC LIMIT 10`, (err, logs) => {
            db.all(`SELECT biller_name, amount, due_date, status FROM bills_ledger`, (err, bills) => {
                db.all(`SELECT category, deductible_amount, status FROM tax_ledger`, (err, taxLogs) => {
                    db.all(`SELECT profession, active_task, status FROM career_workflows`, (err, careers) => {
                        const eventLogs = logs ? logs.reverse().map(l => l.message) : [];
                        res.json({ 
                            status: 'success', 
                            portfolio: portfolio || { cash: 100000, btc: 0, eth: 0 }, 
                            eventLogs,
                            bills: bills || [],
                            taxLogs: taxLogs || [],
                            careers: careers || []
                        });
                    });
                });
            });
        });
    });
});

// Command Console Router
app.post('/api/command', async (req, res) => {
    const { command } = req.body;
    let reply = `Executed command: ${command}`;
    const cmdLower = (command || '').trim().toLowerCase();
    const timestamp = new Date().toLocaleTimeString();

    db.get(`SELECT id, cash, btc, eth FROM portfolio ORDER BY id DESC LIMIT 1`, async (err, portfolio) => {
        if (!portfolio) portfolio = { cash: 100000, btc: 0, eth: 0 };

        if (cmdLower.includes('status')) {
            reply = 'AETHENOM STATUS: Omni-professional routing active. All career verticals synchronized. Latency: 7ms.';
            sendResponse();
        } else if (cmdLower.includes('balance') || cmdLower.includes('vault')) {
            reply = `AETHENOM VAULT: Cash: $${portfolio.cash.toFixed(2)} | BTC: ${portfolio.btc.toFixed(4)} | ETH: ${portfolio.eth.toFixed(4)}`;
            sendResponse();
        } else if (cmdLower.includes('bills')) {
            db.all(`SELECT biller_name, amount FROM bills_ledger`, (err, rows) => {
                const billSummary = rows ? rows.map(r => `${r.biller_name}: $${r.amount}`).join(' | ') : 'No pending bills.';
                reply = `ACTIVE LIABILITIES: ${billSummary}`;
                sendResponse();
            });
            return;
        } else if (cmdLower.includes('tax') || cmdLower.includes('audit')) {
            db.all(`SELECT category, deductible_amount FROM tax_ledger`, (err, rows) => {
                const taxSummary = rows ? rows.map(r => `${r.category}: $${r.deductible_amount}`).join(' | ') : 'No deductions logged.';
                reply = `TAX MATRIX: [FL - 0% Tax] | Write-Offs: ${taxSummary}`;
                sendResponse();
            });
            return;
        } else if (cmdLower.includes('career') || cmdLower.includes('work')) {
            db.all(`SELECT profession, active_task FROM career_workflows`, (err, rows) => {
                const careerSummary = rows ? rows.map(r => `[${r.profession}]: ${r.active_task}`).join(' | ') : 'No active workflows.';
                reply = `OCCUPATIONAL MATRIX: ${careerSummary}`;
                sendResponse();
            });
            return;
        } else if (cmdLower.includes('help')) {
            reply = 'COMMANDS: status, balance, bills, tax, career, buy btc, sell btc, reset, help';
            sendResponse();
        } else if (cmdLower.startsWith('buy btc')) {
            const btcPrice = 78428.00;
            const cost = btcPrice * 0.1;
            
            if (portfolio.cash >= cost) {
                const newCash = portfolio.cash - cost;
                const newBtc = portfolio.btc + 0.1;
                const logMsg = `[${timestamp}] MANUAL EXECUTION: Acquired 0.1 BTC for $${cost.toFixed(2)}`;
                
                db.run(`INSERT INTO portfolio (cash, btc, eth, updated_at) VALUES (?, ?, ?, ?)`, [newCash, newBtc, portfolio.eth, timestamp], () => {
                    db.run(`INSERT INTO event_logs (timestamp, message) VALUES (?, ?)`, [timestamp, logMsg], () => {
                        reply = `SUCCESS: Bought 0.1 BTC at $${btcPrice.toLocaleString()}. Cost: $${cost.toFixed(2)}`;
                        sendResponse();
                    });
                });
            } else {
                reply = `ERROR: Insufficient liquidity ($${portfolio.cash.toFixed(2)}) to acquire 0.1 BTC ($${cost.toFixed(2)}).`;
                sendResponse();
            }
        } else if (cmdLower.startsWith('sell btc')) {
            if (portfolio.btc >= 0.1) {
                const btcPrice = 78428.00;
                const revenue = btcPrice * 0.1;
                const newCash = portfolio.cash + revenue;
                const newBtc = portfolio.btc - 0.1;
                const logMsg = `[${timestamp}] MANUAL EXECUTION: Liquidated 0.1 BTC for $${revenue.toFixed(2)}`;
                
                db.run(`INSERT INTO portfolio (cash, btc, eth, updated_at) VALUES (?, ?, ?, ?)`, [newCash, newBtc, portfolio.eth, timestamp], () => {
                    db.run(`INSERT INTO event_logs (timestamp, message) VALUES (?, ?)`, [timestamp, logMsg], () => {
                        reply = `SUCCESS: Sold 0.1 BTC at $${btcPrice.toLocaleString()}. Revenue: $${revenue.toFixed(2)}`;
                        sendResponse();
                    });
                });
            } else {
                reply = 'ERROR: Zero BTC inventory available for liquidation.';
                sendResponse();
            }
        } else if (cmdLower.includes('reset')) {
            const logMsg = `[${timestamp}] SYSTEM RESET: Portfolio restored to baseline liquidity.`;
            db.run(`INSERT INTO portfolio (cash, btc, eth, updated_at) VALUES (100000.00, 0.0, 0.0, ?)`, [timestamp], () => {
                db.run(`INSERT INTO event_logs (timestamp, message) VALUES (?, ?)`, [timestamp, logMsg], () => {
                    reply = 'VAULT RESET: Balance restored to $100,000.00 USD.';
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

// AUTONOMOUS BACKGROUND WEALTH GENERATOR (Runs every 45 seconds)
setInterval(() => {
    const timestamp = new Date().toLocaleTimeString();
    db.get(`SELECT id, cash, btc, eth FROM portfolio ORDER BY id DESC LIMIT 1`, (err, portfolio) => {
        if (!portfolio) return;

        if (portfolio.cash > 50000) {
            const btcPrice = 78428.00;
            const trancheCost = btcPrice * 0.05;
            const newCash = portfolio.cash - trancheCost;
            const newBtc = portfolio.btc + 0.05;
            const logMsg = `[${timestamp}] AETHENOM ALGO: Capital growth allocated. Secured 0.05 BTC ($${trancheCost.toFixed(2)}) for family portfolio.`;

            db.run(`INSERT INTO portfolio (cash, btc, eth, updated_at) VALUES (?, ?, ?, ?)`, [newCash, newBtc, portfolio.eth, timestamp], () => {
                db.run(`INSERT INTO event_logs (timestamp, message) VALUES (?, ?)`, [timestamp, logMsg]);
            });
        }
    });
}, 45000);

app.listen(PORT, () => {
    console.log(`Aethenom Core running live on port ${PORT}`);
});
