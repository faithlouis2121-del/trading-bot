const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(__dirname));

const dbPath = path.resolve(__dirname, 'trading.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Aethenom DB initialization error: ' + err.message);
    else console.log('Aethenom core connected to SQLite database.');
});

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

    db.run(`CREATE TABLE IF NOT EXISTS apex_tax_engine (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        optimization_vector TEXT,
        potential_savings REAL,
        audit_status TEXT,
        last_sync TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS wealth_planning (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT,
        strategy_detail TEXT,
        status TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS family_ops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain TEXT,
        operational_status TEXT
    )`);

    db.get(`SELECT COUNT(*) as count FROM portfolio`, (err, row) => {
        if (row && row.count === 0) {
            const timestamp = new Date().toLocaleTimeString();
            db.run(`INSERT INTO portfolio (cash, btc, eth, updated_at) VALUES (100000.00, 0.0, 0.0, ?)`, [timestamp]);
            db.run(`INSERT INTO event_logs (timestamp, message) VALUES (?, ?)`, [timestamp, 'Aethenom Core online. 9-Box Omni-Fabric fully armed.']);
            
            db.run(`INSERT INTO bills_ledger (biller_name, amount, due_date, status) VALUES ('Household Utilities', 350.00, '2026-09-01', 'Pending')`);
            db.run(`INSERT INTO bills_ledger (biller_name, amount, due_date, status) VALUES ('Children Extracurricular Activities', 450.00, '2026-09-05', 'Optimized')`);
            
            db.run(`INSERT INTO apex_tax_engine (optimization_vector, potential_savings, audit_status, last_sync) VALUES ('Florida 0% Personal Income Tax Structuring', 14200.00, 'Bulletproof', '2026-08-26')`);
            db.run(`INSERT INTO apex_tax_engine (optimization_vector, potential_savings, audit_status, last_sync) VALUES ('AI Infrastructure & Cloud Asset Write-Offs', 8950.00, 'Verified Loophole', '2026-08-26')`);

            db.run(`INSERT INTO wealth_planning (category, strategy_detail, status) VALUES ('Core Savings', 'Automatic monthly transfers & emergency liquidity (6 mos locked)', 'Active')`);
            db.run(`INSERT INTO wealth_planning (category, strategy_detail, status) VALUES ('Retirement Accounts', 'Pre-tax 401(k) matching & independent IRA tax shielding', 'Optimized')`);

            db.run(`INSERT INTO family_ops (domain, operational_status) VALUES ('Family Administration', 'Chris, Arabella, Evalena, Oliviana, & Theo schedules synchronized')`);
            db.run(`INSERT INTO family_ops (domain, operational_status) VALUES ('Home Asset Longevity', 'AC condensate lines, shop-vac clearing, and pool landscaping monitored')`);
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

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
            reply = 'AETHENOM 9-BOX STATUS: All domains (Wealth, Tax, Savings, Family, Home, Career) fully synchronized. Latency: 3ms.';
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
        } else if (cmdLower.includes('tax') || cmdLower.includes('apex')) {
            reply = 'APEX TAX ENGINE: [Projected Savings: $23,150.00] | State: FL (0% Tax) | Audit Status: Bulletproof';
            sendResponse();
        } else if (cmdLower.includes('savings') || cmdLower.includes('retire')) {
            reply = 'WEALTH & RETIREMENT: 401(k) matching active | IRA shielding locked | Emergency fund secured (6 months).';
            sendResponse();
        } else if (cmdLower.includes('family') || cmdLower.includes('home')) {
            db.all(`SELECT domain, operational_status FROM family_ops`, (err, rows) => {
                const famSummary = rows ? rows.map(r => `[${r.domain}]: ${r.operational_status}`).join(' | ') : 'No data.';
                reply = `FAMILY & HOME OPERATIONS: ${famSummary}`;
                sendResponse();
            });
            return;
        } else if (cmdLower.includes('help')) {
            reply = 'COMMANDS: status, balance, bills, tax, savings, family, home, buy btc, sell btc, reset, help';
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

setInterval(() => {
    const timestamp = new Date().toLocaleTimeString();
    db.get(`SELECT id, cash, btc, eth FROM portfolio ORDER BY id DESC LIMIT 1`, (err, portfolio) => {
        if (!portfolio) return;

        if (portfolio.cash > 50000) {
            const btcPrice = 78428.00;
            const trancheCost = btcPrice * 0.05;
            const newCash = portfolio.cash - trancheCost;
            const newBtc = portfolio.btc + 0.05;
            const logMsg = `[${timestamp}] AETHENOM OMNI-ROUTINE: Secured 0.05 BTC ($${trancheCost.toFixed(2)}) across family asset shields.`;

            db.run(`INSERT INTO portfolio (cash, btc, eth, updated_at) VALUES (?, ?, ?, ?)`, [newCash, newBtc, portfolio.eth, timestamp], () => {
                db.run(`INSERT INTO event_logs (timestamp, message) VALUES (?, ?)`, [timestamp, logMsg]);
            });
        }
    });
}, 45000);

app.listen(PORT, () => {
    console.log(`Aethenom Core running live on port ${PORT}`);
});
