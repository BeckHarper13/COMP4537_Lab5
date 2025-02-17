const http = require('http'); // create http server
const url = require('url'); //parsing url strings
const mysql = require('mysql2'); // interacting with mySQL database
const dotenv = require('dotenv'); // loading environment variables from env

// load environment variables from env file
dotenv.config();

// sets ports
const port = process.env.PORT || 8080;

// Create a MySQL connection pool for managing database connections
// Partially written by ChatGPT
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: process.env.DB_SSL === 'REQUIRED' ? { rejectUnauthorized: false } : null,
    waitForConnections: true, // Whether to queue connections if no connections are available
    connectionLimit: 10, // Maximum number of concurrent connections
    queueLimit: 0 // Maximum number of connection requests to queue (0 means no limit)
});

// SQL query to create the 'users' table if it doesn't already exist
const createTableQuery = `
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    dob VARCHAR(255)
) ENGINE=InnoDB;
`;

// Execute the query to create the table
pool.query(createTableQuery, (err) => {
    if (err) throw err; // Throw an error if the query fails
    console.log('Table created or already exists');
});

// Create an HTTP server
const server = http.createServer((req, res) => {
    // Parse the request URL and extract the path and query parameters
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    // Set CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests (OPTIONS method)
    if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Handle POST requests to the '/insert' endpoint
    if (path === '/insert' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
    
        // When the request body is fully received
        req.on('end', () => {
            try {
                const { people } = JSON.parse(body);
    
                // Validate that the 'people' field is an array and not empty
                if (!Array.isArray(people) || people.length === 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid data format. Expected an array of people.' }));
                    return;
                }
    
                // Prepare bulk insert query
                const values = people.map(person => [person.name, person.dob]);
                const insertQuery = `INSERT INTO users (name, dob) VALUES ?`;
    
                pool.query(insertQuery, [values], (err, results) => {
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
    // Handle GET or POST requests to the '/query' endpoint
    } else if (path === '/query' && (method === 'POST' || method === 'GET')) {
        let query = '';

        // If the method is GET, extract the query from the URL parameters
        if (method === 'GET') {
            query = parsedUrl.query.query; // Get query from URL parameter
        // If the method is POST, extract the query from the request body
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

// Function to execute a database query
function executeQuery(query, res) {
    if (!query || (!query.startsWith('SELECT') && !query.startsWith('INSERT'))) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Only SELECT and INSERT queries are allowed' }));
        return;
    }

    // Execute the query using the connection pool
    pool.query(query, (err, results) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Query execution failed', details: err.message }));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(results));
        }
    });
}

// Start the server and listen on the specified port
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
