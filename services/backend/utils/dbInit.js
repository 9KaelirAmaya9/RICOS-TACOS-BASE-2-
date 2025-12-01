const { migrate } = require('../database/migrate');
const { seed } = require('../database/seed');
const { pool } = require('../config/database');
const logger = require('./logger');

/**
 * Initialize database
 * Runs migrations and bootstraps admin user
 */
const initDb = async () => {
    try {
        logger.info('Initializing database...');

        // Run migrations
        await migrate();

        // Run seed
        await seed();

        // Bootstrap admin (Legacy check, seed handles this now but keeping for safety)
        await bootstrapAdmin();

        logger.info('Database initialization completed successfully');
    } catch (error) {
        logger.error('Database initialization failed:', error);
        // We don't exit here, let the server decide if it wants to crash or continue
        throw error;
    }
};

/**
 * Bootstrap admin user
 * Ensures there is at least one admin if users exist
 */
const bootstrapAdmin = async () => {
    const client = await pool.connect();
    try {
        // Check if any admin exists
        const adminCheck = await client.query(
            "SELECT 1 FROM users WHERE role = 'ADMIN' LIMIT 1"
        );

        if (adminCheck.rows.length > 0) {
            logger.info('Admin user already exists');
            return;
        }

        // No admin found. Check if we should promote a specific user via ENV
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
            logger.info(`Promoting user ${adminEmail} to admin...`);

            // Find user
            const userRes = await client.query(
                'SELECT id FROM users WHERE email = $1',
                [adminEmail]
            );

            if (userRes.rows.length > 0) {
                const userId = userRes.rows[0].id;
                await client.query(
                    "UPDATE users SET role = 'ADMIN' WHERE id = $1",
                    [userId]
                );
                logger.info(`User ${adminEmail} promoted to admin`);
                return;
            } else {
                logger.warn(`User ${adminEmail} not found, cannot promote to admin`);
            }
        }

        // Fallback: Promote the first user found (ID 1)
        logger.info('Checking for any users to promote to admin...');
        const firstUser = await client.query(
            'SELECT id, email FROM users ORDER BY id ASC LIMIT 1'
        );

        if (firstUser.rows.length > 0) {
            const user = firstUser.rows[0];
            logger.info(`Promoting first user (${user.email}) to admin...`);
            await client.query(
                "UPDATE users SET role = 'ADMIN' WHERE id = $1",
                [user.id]
            );
            logger.info(`User ${user.email} promoted to admin`);
        } else {
            logger.info('No users found. Admin will be bootstrapped when first user registers (if logic implemented) or manually.');
        }

    } catch (error) {
        logger.error('Error bootstrapping admin:', error);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = { initDb };
