import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

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
    if (!email) throw new Error('Email is required');
    
    const normalizedEmail = email.toLowerCase();
    console.log('Creating new user:', { name, email: normalizedEmail, isGoogleAuth: options.isGoogleAuth });
    
  
    const existingUser = await getUserByEmail(normalizedEmail);
    if (existingUser) {
        console.log('User already exists:', existingUser);
        
    
        if (options.isGoogleAuth && !existingUser.isGoogleAuth) {
            throw new Error('This email is already registered with a traditional method');
        }
        
        if (!options.isGoogleAuth && existingUser.isGoogleAuth) {
            throw new Error('This email is already registered with Google');
        }
        
        throw new Error('This email is already registered');
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
        
        const existingUser = await getUserByEmail(email.toLowerCase());
        if (existingUser && existingUser.id !== userId) {
            throw new Error('This email is already used by another account');
        }
    }
    
    user.name = name;
    if (email) {
        user.email = email.toLowerCase();
    }
    return true;
}

export async function loginUser(email, password) {
    if (!email) throw new Error('Email is required');
    
    const normalizedEmail = email.toLowerCase();
    const user = await getUserByEmail(normalizedEmail);
    
    if (!user) {
        throw new Error('User not found');
    }
    

    if (user.isGoogleAuth) {
        throw new Error('This account was created with Google. Please use the Google Sign-In button');
    }
    
    if (!user.password || user.password !== password) {
        throw new Error('Incorrect password');
    }
    
    return user;
} 