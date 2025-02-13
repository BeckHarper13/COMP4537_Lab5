const http = require('http');
const url = require('url');
const mysql = require('mysql2');
const dotenv = require('dotenv');

const port = process.env.PORT || 8080

dotenv.config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: process.env.DB_SSL === 'REQUIRED' ? { rejectUnauthorized: false } : null
});

connection.connect(err => {
    if (err) throw err;
    console.log('Connected to the database');
});

const createTableQuery = `

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    dob VARCHAR(255)
) ENGINE=InnoDB;
`;

connection.query(createTableQuery, (err) => {
    if (err) throw err;
    console.log('Table created or already exists');
});

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    // Set CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (path === '/insert' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
    
        req.on('end', () => {
            try {
                const { people } = JSON.parse(body);
    
                if (!Array.isArray(people) || people.length === 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid data format. Expected an array of people.' }));
                    return;
                }
    
                // Prepare bulk insert query
                const values = people.map(person => [person.name, person.dob]);
                const insertQuery = `INSERT INTO users (name, dob) VALUES ?`;
    
                connection.query(insertQuery, [values], (err, results) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to insert data', details: err.message }));
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Data inserted successfully', insertedRows: results.affectedRows }));
                    }
                });
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON format' }));
            }
        });    
    } else if (path === '/query' && (method === 'POST' || method === 'GET')) {
        let query = '';

        if (method === 'GET') {
            query = parsedUrl.query.query; // Get query from URL parameter
        } else {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    query = JSON.parse(body).query;
                } catch (error) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid JSON' }));
                    return;
                }
                executeQuery(query, res);
            });
            return;
        }

        executeQuery(query, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

function executeQuery(query, res) {
    if (!query || (!query.startsWith('SELECT') && !query.startsWith('INSERT'))) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Only SELECT and INSERT queries are allowed' }));
        return;
    }

    connection.query(query, (err, results) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Query execution failed' }));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(results));
        }
    });
}

server.listen(port, () => {
    console.log('Server running on http://localhost:3000');
});
