import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_FILE_PATH = path.resolve(process.cwd(), 'agrilink.db');

let dbInstance: SqlJsDatabase | null = null;

/**
 * Save in-memory SQLite database state to disk (agrilink.db)
 */
export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE_PATH, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

export type QueryParam = string | number | boolean | null | undefined;

function sanitizeParams(params: QueryParam[]): (string | number | null | Uint8Array)[] {
  return params.map(p => {
    if (typeof p === 'boolean') return p ? 1 : 0;
    if (p === undefined) return null;
    return p;
  });
}

/**
 * Execute parameterized query returning multiple rows as plain objects
 */
export function queryAll<T = any>(sql: string, params: QueryParam[] = []): T[] {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  try {
    stmt.bind(sanitizeParams(params));
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T);
    }
    return results;
  } finally {
    stmt.free();
  }
}

/**
 * Execute parameterized query returning single row or null
 */
export function queryOne<T = any>(sql: string, params: QueryParam[] = []): T | null {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute INSERT, UPDATE, or DELETE with params and automatically persist to disk
 */
export function execute(sql: string, params: QueryParam[] = []): void {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run(sql, sanitizeParams(params));
  saveDb();
}

/**
 * Initialize SQLite Database & Schema
 */
export async function getDb(): Promise<SqlJsDatabase> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE_PATH);
      dbInstance = new SQL.Database(fileBuffer);
      console.log(`[SQLite] Loaded existing database from ${DB_FILE_PATH}`);
    } catch (err) {
      console.warn(`[SQLite] Could not read existing DB file. Creating fresh:`, err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
    console.log(`[SQLite] Initialized new database at ${DB_FILE_PATH}`);
  }

  // Enable foreign keys
  dbInstance.run('PRAGMA foreign_keys = ON;');

  // Create tables & indexes
  initSchema(dbInstance);
  saveDb();

  return dbInstance;
}

function initSchema(db: SqlJsDatabase) {
  db.run(`
    -- USERS TABLE
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK(role IN ('farmer', 'buyer')),
      name TEXT NOT NULL,
      organization_name TEXT,
      mobile TEXT,
      email TEXT,
      password_hash TEXT NOT NULL,
      state TEXT,
      district TEXT,
      preferred_language TEXT DEFAULT 'en',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- FARMER PROFILES
    CREATE TABLE IF NOT EXISTS farmer_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      farm_location TEXT,
      village TEXT,
      state TEXT,
      district TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- BUYER PROFILES
    CREATE TABLE IF NOT EXISTS buyer_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      organization_name TEXT,
      business_type TEXT,
      location TEXT,
      state TEXT,
      district TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- PRODUCE LISTINGS (Farmer selling crops)
    CREATE TABLE IF NOT EXISTS produce_listings (
      id TEXT PRIMARY KEY,
      farmer_id TEXT NOT NULL,
      crop_name TEXT NOT NULL,
      variety TEXT,
      quantity REAL NOT NULL,
      quantity_unit TEXT DEFAULT 'kg',
      expected_price REAL NOT NULL,
      price_unit TEXT DEFAULT 'Rs/quintal',
      quality_grade TEXT DEFAULT 'Grade A',
      description TEXT,
      harvest_date TEXT,
      available_from TEXT,
      available_until TEXT,
      state TEXT,
      district TEXT,
      market_location TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'sold', 'expired', 'cancelled')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- BUYER DEMANDS (Buyer purchasing requirements)
    CREATE TABLE IF NOT EXISTS buyer_demands (
      id TEXT PRIMARY KEY,
      buyer_id TEXT NOT NULL,
      crop_name TEXT NOT NULL,
      variety TEXT,
      required_quantity REAL NOT NULL,
      quantity_unit TEXT DEFAULT 'kg',
      target_price REAL NOT NULL,
      price_unit TEXT DEFAULT 'Rs/quintal',
      quality_requirement TEXT,
      delivery_location TEXT,
      state TEXT,
      district TEXT,
      required_by TEXT,
      description TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'fulfilled', 'cancelled', 'expired')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- OFFERS (Connecting Buyer & Farmer Listing with Negotiation & Counters)
    CREATE TABLE IF NOT EXISTS offers (
      id TEXT PRIMARY KEY,
      listing_id TEXT NOT NULL,
      buyer_id TEXT NOT NULL,
      farmer_id TEXT,
      parent_offer_id TEXT,
      original_offer_id TEXT,
      sender_role TEXT DEFAULT 'buyer',
      offered_price REAL NOT NULL,
      quantity REAL NOT NULL,
      quantity_unit TEXT DEFAULT 'kg',
      message TEXT,
      status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Accepted', 'Rejected', 'Countered', 'pending', 'accepted', 'rejected', 'withdrawn', 'countered')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (listing_id) REFERENCES produce_listings(id) ON DELETE CASCADE,
      FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_offer_id) REFERENCES offers(id) ON DELETE SET NULL
    );

    -- TRANSACTIONS (Farmer-Buyer Post-Acceptance 5-Stage Flow)
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      farmer_id TEXT NOT NULL,
      buyer_id TEXT NOT NULL,
      listing_id TEXT,
      offer_id TEXT,
      crop_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      quantity_unit TEXT DEFAULT 'kg',
      agreed_price REAL NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'Accepted' CHECK(status IN ('Accepted', 'Payment Pending', 'Payment Completed', 'Delivery/Pickup', 'Completed', 'Cancelled')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (listing_id) REFERENCES produce_listings(id) ON DELETE SET NULL,
      FOREIGN KEY (farmer_id) REFERENCES users(id),
      FOREIGN KEY (buyer_id) REFERENCES users(id),
      FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL
    );

    -- NOTIFICATIONS (Persistent Alerts for Offers, Counters, & Transactions)
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      recipient_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      related_entity_id TEXT,
      related_entity_type TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- ORDERS (Aggregated / Fulfillment Orders)
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      listing_id TEXT,
      farmer_id TEXT NOT NULL,
      buyer_id TEXT NOT NULL,
      offer_id TEXT,
      crop_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      quantity_unit TEXT DEFAULT 'kg',
      agreed_price REAL NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'processing', 'ready_for_delivery', 'delivered', 'completed', 'cancelled')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (listing_id) REFERENCES produce_listings(id) ON DELETE SET NULL,
      FOREIGN KEY (farmer_id) REFERENCES users(id),
      FOREIGN KEY (buyer_id) REFERENCES users(id),
      FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL
    );

    -- LOGISTICS
    CREATE TABLE IF NOT EXISTS logistics (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL UNIQUE,
      pickup_location TEXT,
      delivery_location TEXT,
      transporter_name TEXT,
      vehicle_number TEXT,
      estimated_delivery_date TEXT,
      actual_delivery_date TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'pickup_scheduled', 'in_transit', 'delivered')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    -- CART ITEMS (Buyer Persistent Cart)
    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      buyer_id TEXT NOT NULL,
      listing_id TEXT,
      crop_name TEXT NOT NULL,
      variety TEXT,
      farmer_id TEXT,
      farmer_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      quantity_unit TEXT DEFAULT 'kg',
      unit_price REAL NOT NULL,
      price_unit TEXT DEFAULT 'Rs/quintal',
      quality_grade TEXT,
      location TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (listing_id) REFERENCES produce_listings(id) ON DELETE SET NULL,
      FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Migrate offers table if it has restrictive legacy check constraints
  try {
    const tableSqlRes = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='offers';");
    const sqlText = (tableSqlRes[0]?.values[0]?.[0] as string) || '';
    if (sqlText && (!sqlText.toLowerCase().includes('countered') || !sqlText.includes('farmer_id'))) {
      db.run(`
        CREATE TABLE offers_migrated (
          id TEXT PRIMARY KEY,
          listing_id TEXT NOT NULL,
          buyer_id TEXT NOT NULL,
          farmer_id TEXT,
          parent_offer_id TEXT,
          original_offer_id TEXT,
          sender_role TEXT DEFAULT 'buyer',
          offered_price REAL NOT NULL,
          quantity REAL NOT NULL,
          quantity_unit TEXT DEFAULT 'kg',
          message TEXT,
          status TEXT DEFAULT 'pending',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );
        INSERT INTO offers_migrated (id, listing_id, buyer_id, offered_price, quantity, quantity_unit, message, status, created_at, updated_at)
        SELECT id, listing_id, buyer_id, offered_price, quantity, quantity_unit, message, status, created_at, updated_at FROM offers;
        DROP TABLE offers;
        ALTER TABLE offers_migrated RENAME TO offers;
      `);
    }
  } catch {}

  // Safe runtime column migrations for existing SQLite databases
  const migrationStatements = [
    `ALTER TABLE offers ADD COLUMN farmer_id TEXT`,
    `ALTER TABLE offers ADD COLUMN parent_offer_id TEXT`,
    `ALTER TABLE offers ADD COLUMN original_offer_id TEXT`,
    `ALTER TABLE offers ADD COLUMN sender_role TEXT DEFAULT 'buyer'`
  ];
  for (const stmt of migrationStatements) {
    try {
      db.run(stmt);
    } catch {
      // Column may already exist
    }
  }

  // Populate farmer_id for existing offers from produce_listings if missing
  try {
    db.run(`
      UPDATE offers
      SET farmer_id = (
        SELECT farmer_id FROM produce_listings WHERE produce_listings.id = offers.listing_id
      )
      WHERE farmer_id IS NULL;
    `);
  } catch {}

  // INDEXES (safe execution)
  const indexStatements = [
    `CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile)`,
    `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
    `CREATE INDEX IF NOT EXISTS idx_produce_farmer ON produce_listings(farmer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_produce_status ON produce_listings(status)`,
    `CREATE INDEX IF NOT EXISTS idx_demands_buyer ON buyer_demands(buyer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_offers_listing ON offers(listing_id)`,
    `CREATE INDEX IF NOT EXISTS idx_offers_buyer ON offers(buyer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_offers_farmer ON offers(farmer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_offers_parent ON offers(parent_offer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_offers_original ON offers(original_offer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_farmer ON transactions(farmer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id)`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_farmer ON orders(farmer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_logistics_order ON logistics(order_id)`
  ];
  for (const idx of indexStatements) {
    try {
      db.run(idx);
    } catch {}
  }
}
