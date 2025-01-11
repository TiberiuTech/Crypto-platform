import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Elefant20!',
    database: 'crypto_platform',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export async function createUser(name, email, password) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, NOW())',
            [name, email, hashedPassword]
        );
        return result.insertId;
    } catch (error) {
        console.error('Error creating user:', error);
        throw new Error('Eroare la crearea contului');
    }
}

export async function loginUser(email, password) {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
        if (rows.length === 0) {
            throw new Error('Email sau parolă incorectă');
        }

        const user = rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isValid) {
            throw new Error('Email sau parolă incorectă');
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at
        };
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
}

export async function getUserById(userId) {
    try {
        const [rows] = await pool.execute(
            'SELECT id, name, email, created_at FROM users WHERE id = ?',
            [userId]
        );
        return rows[0] || null;
    } catch (error) {
        console.error('Error getting user:', error);
        throw new Error('Eroare la obținerea datelor utilizatorului');
    }
}

export async function updateUserProfile(userId, name, email) {
    try {
        await pool.execute(
            'UPDATE users SET name = ?, email = ? WHERE id = ?',
            [name, email, userId]
        );
        return true;
    } catch (error) {
        console.error('Error updating user:', error);
        throw new Error('Eroare la actualizarea profilului');
    }
}

// Funcție pentru verificarea dacă emailul există deja
export async function checkEmailExists(email) {
    try {
        const [rows] = await pool.execute(
            'SELECT COUNT(*) as count FROM users WHERE email = ?',
            [email]
        );
        return rows[0].count > 0;
    } catch (error) {
        console.error('Error checking email:', error);
        throw new Error('Eroare la verificarea emailului');
    }
} 