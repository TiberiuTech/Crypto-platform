import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcrypt';
import * as db from './services/databaseService.js';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

// Încărcăm variabilele de mediu
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Inițializăm clientul OAuth2
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

// Rută pentru autentificare cu Google
app.post('/api/auth/google', async (req, res) => {
    console.log('Received Google auth request:', req.body);
    try {
        const { credential, isSignup } = req.body;
        
        if (!credential) {
            console.error('No credential provided');
            return res.status(400).json({
                success: false,
                error: 'No credential provided'
            });
        }

        // Verificăm token-ul cu Google
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        console.log('Google auth payload:', payload);
        
        const { email, name, picture } = payload;

        // Verificăm dacă utilizatorul există
        let user = await db.getUserByEmail(email);
        console.log('Existing user check result:', user);
        
        if (user) {
            console.log('User exists, isSignup:', isSignup);
            // Utilizatorul există deja
            if (isSignup) {
                console.log('Attempt to signup with existing account');
                return res.json({
                    success: false,
                    error: 'Acest cont există deja. Vă rugăm să vă autentificați.',
                    shouldRedirect: '/pages/login.html'
                });
            }
            
            // Verificăm dacă contul este într-adevăr un cont Google
            if (!user.isGoogleAuth) {
                console.log('Attempt to login with Google for non-Google account');
                return res.json({
                    success: false,
                    error: 'Acest cont nu a fost creat cu Google. Vă rugăm să folosiți metoda normală de autentificare.',
                    shouldRedirect: '/pages/login.html'
                });
            }
        } else {
            console.log('User does not exist, isSignup:', isSignup);
            // Utilizatorul nu există
            if (!isSignup) {
                console.log('Attempt to login with non-existent account');
                return res.json({
                    success: false,
                    error: 'Acest cont nu există. Vă rugăm să vă înregistrați.',
                    shouldRedirect: '/pages/signup.html'
                });
            }
            
            try {
                // Creăm un utilizator nou doar dacă suntem în procesul de înregistrare
                const userId = await db.createUser(name, email, null, {
                    isGoogleAuth: true,
                    picture: picture
                });
                user = await db.getUserById(userId);
                console.log('New user created:', user);
            } catch (error) {
                console.error('Error creating user:', error);
                return res.json({
                    success: false,
                    error: error.message,
                    shouldRedirect: '/pages/login.html'
                });
            }
        }

        console.log('Authentication successful, returning user:', user);
        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                picture: user.picture
            }
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed: ' + error.message
        });
    }
});

// Catch-all route pentru a servi index.html
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Modificăm partea de pornire a serverului pentru a gestiona erorile
const startServer = async () => {
    try {
        await app.listen(port);
        console.log(`Serverul rulează la http://localhost:${port}`);
    } catch (error) {
        console.error('Eroare la pornirea serverului:', error);
        process.exit(1);
    }
};

startServer(); 