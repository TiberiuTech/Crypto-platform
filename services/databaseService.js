import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

// Simulăm o bază de date în memorie pentru dezvoltare
const users = new Map();
let nextUserId = 1;

export async function getUserByEmail(email) {
    if (!email) return null;
    
    const normalizedEmail = email.toLowerCase();
    console.log('Checking for user with email:', normalizedEmail);
    console.log('Current users in database:', Array.from(users.values()));
    
    const user = Array.from(users.values()).find(u => u.email.toLowerCase() === normalizedEmail);
    console.log('Found user:', user);
    return user || null;
}

export async function getUserById(id) {
    return users.get(id) || null;
}

export async function createUser(name, email, password = null, options = {}) {
    if (!email) throw new Error('Email-ul este obligatoriu');
    
    const normalizedEmail = email.toLowerCase();
    console.log('Creating new user:', { name, email: normalizedEmail, isGoogleAuth: options.isGoogleAuth });
    
    // Verificăm mai întâi dacă există deja un utilizator cu acest email
    const existingUser = await getUserByEmail(normalizedEmail);
    if (existingUser) {
        console.log('User already exists:', existingUser);
        
        // Verificăm dacă încercăm să creăm un cont Google pentru un email existent
        if (options.isGoogleAuth && !existingUser.isGoogleAuth) {
            throw new Error('Acest email este deja înregistrat cu o metodă tradițională');
        }
        // Verificăm dacă încercăm să creăm un cont tradițional pentru un email Google
        if (!options.isGoogleAuth && existingUser.isGoogleAuth) {
            throw new Error('Acest email este deja înregistrat cu Google');
        }
        
        throw new Error('Acest email este deja înregistrat');
    }

    const userId = nextUserId++;
    const user = {
        id: userId,
        name,
        email: normalizedEmail,
        password,
        isGoogleAuth: !!options.isGoogleAuth,
        picture: options.picture || null,
        created_at: new Date().toISOString()
    };
    
    users.set(userId, user);
    console.log('Created new user:', user);
    return userId;
}

export async function checkEmailExists(email) {
    if (!email) return false;
    
    const normalizedEmail = email.toLowerCase();
    const exists = await getUserByEmail(normalizedEmail) !== null;
    console.log('Checking if email exists:', normalizedEmail, 'Result:', exists);
    return exists;
}

export async function updateUserProfile(userId, name, email) {
    const user = users.get(userId);
    if (!user) {
        throw new Error('User not found');
    }
    
    if (email && email !== user.email) {
        // Verificăm dacă noul email există deja
        const existingUser = await getUserByEmail(email.toLowerCase());
        if (existingUser && existingUser.id !== userId) {
            throw new Error('Acest email este deja folosit de alt cont');
        }
    }
    
    user.name = name;
    if (email) {
        user.email = email.toLowerCase();
    }
    return true;
}

export async function loginUser(email, password) {
    if (!email) throw new Error('Email-ul este obligatoriu');
    
    const normalizedEmail = email.toLowerCase();
    const user = await getUserByEmail(normalizedEmail);
    
    if (!user) {
        throw new Error('Utilizatorul nu a fost găsit');
    }
    
    // Verificăm dacă este un cont Google
    if (user.isGoogleAuth) {
        throw new Error('Acest cont a fost creat cu Google. Vă rugăm să folosiți butonul de Google Sign-In');
    }
    
    // Verificăm parola pentru conturi tradiționale
    if (!user.password || user.password !== password) {
        throw new Error('Parolă incorectă');
    }
    
    return user;
} 