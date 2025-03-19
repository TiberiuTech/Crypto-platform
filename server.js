import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcrypt';
import * as db from './services/databaseService.js';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import path from 'path';
import { getOrionixInfo, getOrionixPriceHistory, updateOrionixPrice, ORIONIX_CONTRACT_ADDRESS } from './services/orionixService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

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

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const emailExists = await db.checkEmailExists(email);
        if (emailExists) {
            return res.status(400).json({ error: 'This email is already registered' });
        }

    
        const userId = await db.createUser(name, email, password);
        const user = await db.getUserById(userId);

        res.status(201).json({
            message: 'Account created successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: error.message || 'Account creation failed' });
    }
});


app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.loginUser(email, password);

        res.json({
            message: 'Authentication successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ error: error.message || 'Authentication failed' });
    }
});


app.put('/api/auth/profile', async (req, res) => {
    try {
        const { userId, name, email } = req.body;
        await db.updateUserProfile(userId, name, email);
        const updatedUser = await db.getUserById(userId);
        
        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: error.message || 'Profile update error' });
    }
});


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

        
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        console.log('Google auth payload:', payload);
        
        const { email, name, picture } = payload;

      
        let user = await db.getUserByEmail(email);
        console.log('Existing user check result:', user);
        
        if (user) {
            console.log('User exists, isSignup:', isSignup);
            
            if (isSignup) {
                console.log('Attempt to signup with existing account');
                return res.json({
                    success: false,
                    error: 'This account already exists. Please login.',
                    shouldRedirect: '/pages/login.html'
                });
            }
            
           
            if (!user.isGoogleAuth) {
                console.log('Attempt to login with Google for non-Google account');
                return res.json({
                    success: false,
                    error: 'This account was not created with Google. Please use the normal authentication method.',
                    shouldRedirect: '/pages/login.html'
                });
            }
        } else {
            console.log('User does not exist, isSignup:', isSignup);
           
            if (!isSignup) {
                console.log('Attempt to login with non-existent account');
                return res.json({
                    success: false,
                    error: 'This account does not exist. Please sign up.',
                    shouldRedirect: '/pages/signup.html'
                });
            }
            
            try {
               
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


app.get('/trade', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'trade.html'));
});

app.get('/new-trade', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'new-trade.html'));
});


app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

// API pentru Orionix
app.get('/api/crypto/orionix/info', async (req, res) => {
  try {
    const info = await getOrionixInfo();
    res.json(info);
  } catch (error) {
    console.error('Eroare la obținerea informațiilor Orionix:', error);
    res.status(500).json({ error: 'Nu s-au putut obține informațiile pentru Orionix' });
  }
});

app.get('/api/crypto/orionix/price-history', (req, res) => {
  try {
    const { period } = req.query;
    const history = getOrionixPriceHistory(period);
    res.json(history);
  } catch (error) {
    console.error('Eroare la obținerea istoricului de preț Orionix:', error);
    res.status(500).json({ error: 'Nu s-a putut obține istoricul de preț pentru Orionix' });
  }
});

app.post('/api/crypto/orionix/update-price', (req, res) => {
  try {
    // Această rută este protejată și ar trebui accesată doar de administratori
    // TODO: Adăugați autentificare și autorizare aici
    
    const updatedData = updateOrionixPrice();
    res.json(updatedData);
  } catch (error) {
    console.error('Eroare la actualizarea prețului Orionix:', error);
    res.status(500).json({ error: 'Nu s-a putut actualiza prețul pentru Orionix' });
  }
});

const startServer = async () => {
    try {
        await app.listen(port);
        console.log(`Serverul rulează la http://localhost:${port}`);
    } catch (error) {
        console.error('Server error:', error);
        process.exit(1);
    }
};

startServer(); 