/**
 * Database Seed Script for Taco Restaurant
 * Creates staff users, mock client, and sample menu data
 */

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function seed() {
  const client = await pool.connect();

  try {
    console.log('Starting database seed...\n');

    // Hash passwords
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const kitchenPasswordHash = await bcrypt.hash('kitchen123', 10);
    const clientPasswordHash = await bcrypt.hash('client123', 10);

    // Start transaction
    await client.query('BEGIN');

    // 1. Insert users (Admin, Kitchen, Client)
    console.log('Creating users...');

    // Admin
    await client.query(`
      INSERT INTO users (email, password_hash, name, role, email_verified, auth_provider)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email)
      DO UPDATE SET
        role = EXCLUDED.role,
        email_verified = EXCLUDED.email_verified,
        password_hash = EXCLUDED.password_hash
    `, ['admin@tacos.local', adminPasswordHash, 'Admin User', 'ADMIN', true, 'email']);

    // Kitchen
    await client.query(`
      INSERT INTO users (email, password_hash, name, role, email_verified, auth_provider)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email)
      DO UPDATE SET
        role = EXCLUDED.role,
        email_verified = EXCLUDED.email_verified,
        password_hash = EXCLUDED.password_hash
    `, ['kitchen@tacos.local', kitchenPasswordHash, 'Kitchen Staff', 'KITCHEN', true, 'email']);

    // Client
    await client.query(`
      INSERT INTO users (email, password_hash, name, role, email_verified, auth_provider)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email)
      DO UPDATE SET
        role = EXCLUDED.role,
        email_verified = EXCLUDED.email_verified,
        password_hash = EXCLUDED.password_hash
    `, ['client@tacos.local', clientPasswordHash, 'Mock Client', 'CUSTOMER', true, 'email']);

    // Base User (Regular Customer)
    await client.query(`
      INSERT INTO users (email, password_hash, name, role, email_verified, auth_provider)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email)
      DO UPDATE SET
        role = EXCLUDED.role,
        email_verified = EXCLUDED.email_verified,
        password_hash = EXCLUDED.password_hash
    `, ['user@tacos.local', clientPasswordHash, 'Base User', 'CUSTOMER', true, 'email']);

    console.log('✓ Users created');

    // 2. Insert menu categories
    console.log('\nCreating menu categories...');
    const categories = [
      { name: 'TACOS', sort_order: 1 },
      { name: 'SIDES', sort_order: 2 },
      { name: 'DRINKS', sort_order: 3 },
      { name: 'SPECIALS', sort_order: 4 }
    ];

    for (const category of categories) {
      await client.query(`
        INSERT INTO menu_categories (name, sort_order)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [category.name, category.sort_order]);
    }
    console.log('✓ Menu categories created');

    // 3. Get category IDs
    const categoryIds = {};
    for (const category of categories) {
      const result = await client.query(
        'SELECT id FROM menu_categories WHERE name = $1',
        [category.name]
      );
      categoryIds[category.name] = result.rows[0].id;
    }

    // 4. Insert menu items from JSON
    console.log('\nCreating menu items from JSON...');

    const menuItemsPath = path.join(__dirname, 'menu-items.json');
    if (fs.existsSync(menuItemsPath)) {
      const menuItemsData = fs.readFileSync(menuItemsPath, 'utf8');
      const menuItems = JSON.parse(menuItemsData);

      for (const item of menuItems) {
        // Ensure category exists
        if (!categoryIds[item.category]) {
          console.warn(`⚠️  Category '${item.category}' not found for item '${item.name}'. Skipping.`);
          continue;
        }

        await client.query(`
          INSERT INTO menu_items (name, description, price, category_id, is_available, is_special, image_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT DO NOTHING
        `, [
          item.name,
          item.description,
          item.price,
          categoryIds[item.category],
          true,
          item.is_special,
          item.image_url
        ]);
      }
      console.log(`✓ ${menuItems.length} menu items processed`);
    } else {
      console.warn('⚠️  menu-items.json not found! Skipping menu item creation.');
    }

    // Commit transaction
    await client.query('COMMIT');

    console.log('\n✅ Database seed completed successfully!\n');
    console.log('Accounts:');
    console.log('  Admin:   admin@tacos.local / admin123');
    console.log('  Kitchen: kitchen@tacos.local / kitchen123');
    console.log('  Client:  client@tacos.local / client123');
    console.log('  User:    user@tacos.local / client123\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    // Only close pool if running as standalone script
    if (require.main === module) {
      await pool.end();
    }
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seed };
