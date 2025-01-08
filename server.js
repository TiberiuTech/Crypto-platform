const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Normalizăm URL-ul cererii
    let filePath = req.url;
    
    // Gestionăm ruta principală
    if (filePath === '/') {
        filePath = '/index.html';
    }

    // Construim calea completă către fișier
    filePath = path.join(__dirname, filePath);

    // Obținem extensia fișierului
    const extname = path.extname(filePath);
    let contentType = MIME_TYPES[extname] || 'application/octet-stream';

    // Citim fișierul
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Încercăm să servim index.html din directorul pages pentru rutele /pages/*
                if (filePath.includes('/pages/')) {
                    const htmlPath = path.join(__dirname, 'public', 'pages', 'prices.html');
                    fs.readFile(htmlPath, (err, content) => {
                        if (err) {
                            res.writeHead(404);
                            res.end('Page not found');
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.end(content, 'utf-8');
                        }
                    });
                    return;
                }
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            // Succes
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Serverul rulează la adresa http://localhost:${PORT}`);
}); 