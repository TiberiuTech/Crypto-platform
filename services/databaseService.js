import mysql from 'mysql2/promise';
import { dbConfig } from '../config/database.js';

class DatabaseService {
    constructor() {
        this.pool = mysql.createPool(dbConfig);
    }

    async query(sql, params) {
        try {
            const [results] = await this.pool.execute(sql, params);
            return results;
        } catch (error) {
            console.error('Database Error:', error);
            throw error;
        }
    }

    async syncCryptoPrices() {
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();

            // Obținem toate activele din baza de date
            const assets = await this.query('SELECT * FROM assets');
            
            // Simulăm obținerea prețurilor (vom înlocui cu date reale de la CryptoCompare)
            const timestamp = new Date();
            for (const asset of assets) {
                const mockPrice = Math.random() * 1000;
                const mockChange = (Math.random() * 10) - 5;
                
                // Inserare în asset_prices
                await this.query(`
                    INSERT INTO asset_prices (asset_id, price, price_change_24h, timestamp)
                    VALUES (?, ?, ?, ?)
                `, [asset.id, mockPrice, mockChange, timestamp]);

                // Inserare în price_history
                await this.query(`
                    INSERT INTO price_history (asset_id, price, timestamp)
                    VALUES (?, ?, ?)
                `, [asset.id, mockPrice, timestamp]);
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async getLatestPrices() {
        return await this.query(`
            SELECT a.symbol, a.name, ap.price, ap.price_change_24h, ap.timestamp
            FROM assets a
            LEFT JOIN (
                SELECT ap1.*
                FROM asset_prices ap1
                INNER JOIN (
                    SELECT asset_id, MAX(timestamp) as max_timestamp
                    FROM asset_prices
                    GROUP BY asset_id
                ) ap2 ON ap1.asset_id = ap2.asset_id AND ap1.timestamp = ap2.max_timestamp
            ) ap ON a.id = ap.asset_id
        `);
    }
}

export default new DatabaseService(); 