import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcrypt';
import * as db from './services/databaseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
        }
    }
}));

// Rută pentru înregistrare
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Verificăm dacă emailul există deja
        const emailExists = await db.checkEmailExists(email);
        if (emailExists) {
            return res.status(400).json({ error: 'Acest email este deja înregistrat' });
        }

        // Creăm utilizatorul nou
        const userId = await db.createUser(name, email, password);
        const user = await db.getUserById(userId);

        res.status(201).json({
            message: 'Cont creat cu succes',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: error.message || 'Eroare la crearea contului' });
    }
});

// Rută pentru autentificare
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.loginUser(email, password);

        res.json({
            message: 'Autentificare reușită',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ error: error.message || 'Autentificare eșuată' });
    }
});

// Rută pentru actualizarea profilului
app.put('/api/auth/profile', async (req, res) => {
    try {
        const { userId, name, email } = req.body;
        await db.updateUserProfile(userId, name, email);
        const updatedUser = await db.getUserById(userId);
        
        res.json({
            message: 'Profil actualizat cu succes',
            user: updatedUser
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: error.message || 'Eroare la actualizarea profilului' });
    }
});

// Catch-all route pentru a servi index.html
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Modificăm partea de pornire a serverului pentru a gestiona erorile
const startServer = async (retryPort = port) => {
    try {
        await app.listen(retryPort);
        console.log(`Serverul rulează la http://localhost:${retryPort}`);
    } catch (error) {
        if (error.code === 'EADDRINUSE') {
            console.log(`Portul ${retryPort} este ocupat, încercăm portul ${retryPort + 1}...`);
            startServer(retryPort + 1);
        } else {
            console.error('Eroare la pornirea serverului:', error);
        }
    }
};

startServer(); 