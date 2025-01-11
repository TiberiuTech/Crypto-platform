import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servim fișierele statice din directorul public
app.use(express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
        }
    }
}));

// Ruta pentru pagina principală
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Ruta pentru paginile din folderul pages
app.get('/pages/:page', (req, res) => {
    const page = req.params.page;
    res.sendFile(join(__dirname, 'public', 'pages', page));
});

// Ruta pentru orice altă cerere - returnează index.html
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Pornirea serverului
app.listen(port, () => {
    console.log(`Serverul rulează la adresa http://localhost:${port}`);
}); 