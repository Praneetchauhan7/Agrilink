import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { execute, queryAll, queryOne } from './database';

// ----------------------------------------------------
// USER & PROFILE TYPES
// ----------------------------------------------------
export interface UserRecord {
  id: string;
  role: 'farmer' | 'buyer';
  name: string;
  organization_name: string | null;
  mobile: string | null;
  email: string | null;
  password_hash?: string;
  state: string | null;
  district: string | null;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

export interface FarmerProfileRecord {
  id: string;
  user_id: string;
  farm_location: string | null;
  village: string | null;
  state: string | null;
  district: string | null;
  created_at: string;
  updated_at: string;
}

export interface BuyerProfileRecord {
  id: string;
  user_id: string;
  organization_name: string | null;
  business_type: string | null;
  location: string | null;
  state: string | null;
  district: string | null;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------
// PRODUCE LISTING TYPES
// ----------------------------------------------------
export interface ProduceListingRecord {
  id: string;
  farmer_id: string;
  farmer_name?: string;
  farmer_mobile?: string;
  crop_name: string;
  variety: string | null;
  quantity: number;
  quantity_unit: string;
  expected_price: number;
  price_unit: string;
  quality_grade: string;
  description: string | null;
  harvest_date: string | null;
  available_from: string | null;
  available_until: string | null;
  state: string | null;
  district: string | null;
  market_location: string | null;
  status: 'active' | 'sold' | 'expired' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------
// BUYER DEMAND TYPES
// ----------------------------------------------------
export interface BuyerDemandRecord {
  id: string;
  buyer_id: string;
  buyer_name?: string;
  organization_name?: string;
  crop_name: string;
  variety: string | null;
  required_quantity: number;
  quantity_unit: string;
  target_price: number;
  price_unit: string;
  quality_requirement: string | null;
  delivery_location: string | null;
  state: string | null;
  district: string | null;
  required_by: string | null;
  description: string | null;
  status: 'active' | 'fulfilled' | 'cancelled' | 'expired';
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------
// OFFER TYPES
// ----------------------------------------------------
export interface OfferRecord {
  id: string;
  listing_id: string;
  buyer_id: string;
  buyer_name?: string;
  buyer_organization?: string;
  farmer_id?: string;
  listing_farmer_id?: string;
  farmer_name?: string;
  farmer_location?: string;
  crop_name?: string;
  parent_offer_id?: string | null;
  original_offer_id?: string | null;
  sender_role?: 'buyer' | 'farmer';
  offered_price: number;
  quantity: number;
  quantity_unit: string;
  message: string | null;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Countered' | 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'countered';
  created_at: string;
  updated_at: string;
  history?: OfferRecord[];
}

// ----------------------------------------------------
// TRANSACTION & ORDER & LOGISTICS TYPES
// ----------------------------------------------------
export interface TransactionRecord {
  id: string;
  farmer_id: string;
  farmer_name?: string;
  buyer_id: string;
  buyer_name?: string;
  buyer_organization?: string;
  listing_id: string | null;
  offer_id: string | null;
  crop_name: string;
  quantity: number;
  quantity_unit: string;
  agreed_price: number;
  total_amount: number;
  status: 'Accepted' | 'Payment Pending' | 'Payment Completed' | 'Delivery/Pickup' | 'Completed' | 'Cancelled';
  created_at: string;
  updated_at: string;
}

export interface NotificationRecord {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  message: string;
  related_entity_id?: string | null;
  related_entity_type?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface OrderRecord {
  id: string;
  listing_id: string | null;
  farmer_id: string;
  farmer_name?: string;
  buyer_id: string;
  buyer_name?: string;
  offer_id: string | null;
  crop_name: string;
  quantity: number;
  quantity_unit: string;
  agreed_price: number;
  total_amount: number;
  status: 'confirmed' | 'processing' | 'ready_for_delivery' | 'delivered' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface LogisticsRecord {
  id: string;
  order_id: string;
  pickup_location: string | null;
  delivery_location: string | null;
  transporter_name: string | null;
  vehicle_number: string | null;
  estimated_delivery_date: string | null;
  actual_delivery_date: string | null;
  status: 'pending' | 'pickup_scheduled' | 'in_transit' | 'delivered';
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------
// CART ITEM TYPES
// ----------------------------------------------------
export interface CartItemRecord {
  id: string;
  buyer_id: string;
  listing_id: string | null;
  crop_name: string;
  variety: string | null;
  farmer_id: string | null;
  farmer_name: string;
  quantity: number;
  quantity_unit: string;
  unit_price: number;
  price_unit: string;
  quality_grade: string | null;
  location: string | null;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------
// USER REPOSITORY
// ----------------------------------------------------
export function hashPassword(plainText: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plainText, salt);
}

export function comparePassword(plainText: string, hash: string): boolean {
  return bcrypt.compareSync(plainText, hash);
}

export async function createUser(data: {
  role: 'farmer' | 'buyer';
  name: string;
  organization_name?: string;
  mobile?: string;
  email?: string;
  password: string;
  state?: string;
  district?: string;
  preferred_language?: string;
  farm_location?: string;
  village?: string;
  business_type?: string;
  location?: string;
}) {
  const userId = `usr_${crypto.randomUUID().slice(0, 12)}`;
  const passwordHash = hashPassword(data.password);

  await execute(
    `INSERT INTO users (id, role, name, organization_name, mobile, email, password_hash, state, district, preferred_language)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      data.role,
      data.name.trim(),
      data.organization_name?.trim() || null,
      data.mobile?.trim() || null,
      data.email?.trim() || null,
      passwordHash,
      data.state?.trim() || null,
      data.district?.trim() || null,
      data.preferred_language || 'en'
    ]
  );

  // Create role-specific profile
  if (data.role === 'farmer') {
    const profId = `prof_${crypto.randomUUID().slice(0, 12)}`;
    await execute(
      `INSERT INTO farmer_profiles (id, user_id, farm_location, village, state, district)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        profId,
        userId,
        data.farm_location?.trim() || data.location?.trim() || null,
        data.village?.trim() || null,
        data.state?.trim() || null,
        data.district?.trim() || null
      ]
    );
  } else if (data.role === 'buyer') {
    const profId = `prof_${crypto.randomUUID().slice(0, 12)}`;
    await execute(
      `INSERT INTO buyer_profiles (id, user_id, organization_name, business_type, location, state, district)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        profId,
        userId,
        data.organization_name?.trim() || data.name.trim(),
        data.business_type?.trim() || 'Wholesaler / Retailer',
        data.location?.trim() || null,
        data.state?.trim() || null,
        data.district?.trim() || null
      ]
    );
  }

  const user = await findUserById(userId);
  if (!user) throw new Error('User creation failed');
  return user;
}

export async function findUserByCredentials(identifier: string) {
  const cleanId = identifier.trim().toLowerCase();
  return await queryOne<UserRecord>(
    `SELECT * FROM users WHERE LOWER(email) = ? OR mobile = ? LIMIT 1`,
    [cleanId, identifier.trim()]
  );
}

export async function findUserById(id: string) {
  return await queryOne<UserRecord>(
    `SELECT id, role, name, organization_name, mobile, email, state, district, preferred_language, created_at, updated_at
     FROM users WHERE id = ? LIMIT 1`,
    [id]
  );
}

export async function updateUser(id: string, updates: Partial<UserRecord>) {
  const currentUser = await findUserById(id);
  if (!currentUser) return null;

  const name = updates.name !== undefined ? updates.name : currentUser.name;
  const organization_name = updates.organization_name !== undefined ? updates.organization_name : currentUser.organization_name;
  const mobile = updates.mobile !== undefined ? updates.mobile : currentUser.mobile;
  const email = updates.email !== undefined ? updates.email : currentUser.email;
  const state = updates.state !== undefined ? updates.state : currentUser.state;
  const district = updates.district !== undefined ? updates.district : currentUser.district;
  const preferred_language = updates.preferred_language !== undefined ? updates.preferred_language : currentUser.preferred_language;

  await execute(
    `UPDATE users 
     SET name = ?, organization_name = ?, mobile = ?, email = ?, state = ?, district = ?, preferred_language = ?, updated_at = now()
     WHERE id = ?`,
    [name, organization_name, mobile, email, state, district, preferred_language, id]
  );

  return await findUserById(id);
}

export async function getFarmerProfile(userId: string) {
  return await queryOne<FarmerProfileRecord>(
    `SELECT * FROM farmer_profiles WHERE user_id = ? LIMIT 1`,
    [userId]
  );
}

export async function getBuyerProfile(userId: string) {
  return await queryOne<BuyerProfileRecord>(
    `SELECT * FROM buyer_profiles WHERE user_id = ? LIMIT 1`,
    [userId]
  );
}

export async function updateFarmerProfile(
  userId: string,
  updates: Partial<FarmerProfileRecord>
) {
  const existing = await getFarmerProfile(userId);
  if (!existing) {
    const id = `fp-${Date.now()}`;
    await execute(
      `INSERT INTO farmer_profiles (id, user_id, farm_location, village, state, district)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        updates.farm_location || null,
        updates.village || null,
        updates.state || null,
        updates.district || null,
      ]
    );
    return await getFarmerProfile(userId);
  }

  const farm_location = updates.farm_location !== undefined ? updates.farm_location : existing.farm_location;
  const village = updates.village !== undefined ? updates.village : existing.village;
  const state = updates.state !== undefined ? updates.state : existing.state;
  const district = updates.district !== undefined ? updates.district : existing.district;

  await execute(
    `UPDATE farmer_profiles
     SET farm_location = ?, village = ?, state = ?, district = ?, updated_at = now()
     WHERE user_id = ?`,
    [farm_location, village, state, district, userId]
  );

  return await getFarmerProfile(userId);
}

export async function updateBuyerProfile(
  userId: string,
  updates: Partial<BuyerProfileRecord>
) {
  const existing = await getBuyerProfile(userId);
  if (!existing) {
    const id = `bp-${Date.now()}`;
    await execute(
      `INSERT INTO buyer_profiles (id, user_id, organization_name, business_type, location, state, district)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        updates.organization_name || null,
        updates.business_type || null,
        updates.location || null,
        updates.state || null,
        updates.district || null,
      ]
    );
    return await getBuyerProfile(userId);
  }

  const organization_name = updates.organization_name !== undefined ? updates.organization_name : existing.organization_name;
  const business_type = updates.business_type !== undefined ? updates.business_type : existing.business_type;
  const location = updates.location !== undefined ? updates.location : existing.location;
  const state = updates.state !== undefined ? updates.state : existing.state;
  const district = updates.district !== undefined ? updates.district : existing.district;

  await execute(
    `UPDATE buyer_profiles
     SET organization_name = ?, business_type = ?, location = ?, state = ?, district = ?, updated_at = now()
     WHERE user_id = ?`,
    [organization_name, business_type, location, state, district, userId]
  );

  return await getBuyerProfile(userId);
}

// ----------------------------------------------------
// PRODUCE LISTINGS REPOSITORY
// ----------------------------------------------------
export async function getProduceListings(filters: {
  farmerId?: string;
  status?: string;
  crop?: string;
  commodity?: string;
  location?: string;
  state?: string;
  district?: string;
  market?: string;
  quality?: string;
  search?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
} = {}) {
  let sql = `
    SELECT p.*, u.name as farmer_name, u.mobile as farmer_mobile, u.organization_name as fpo_name
    FROM produce_listings p
    JOIN users u ON p.farmer_id = u.id
    WHERE 1=1
  `;
  const params: (string | number | boolean | null)[] = [];

  if (filters.farmerId) {
    sql += ` AND p.farmer_id = ?`;
    params.push(filters.farmerId);
  }
  
  // Status filter (default to 'active' if status is not explicitly passed, or allow 'all')
  if (filters.status && filters.status !== 'all') {
    sql += ` AND LOWER(p.status) = ?`;
    params.push(filters.status.toLowerCase());
  } else if (!filters.status) {
    sql += ` AND LOWER(p.status) = 'active'`;
  }

  // Commodity / Crop filter
  const targetCrop = filters.commodity || filters.crop;
  if (targetCrop && targetCrop.trim() && targetCrop.toLowerCase() !== 'all') {
    sql += ` AND LOWER(p.crop_name) LIKE ?`;
    params.push(`%${targetCrop.trim().toLowerCase()}%`);
  }

  // State filter
  if (filters.state && filters.state.trim() && filters.state.toLowerCase() !== 'all') {
    sql += ` AND LOWER(p.state) = ?`;
    params.push(filters.state.trim().toLowerCase());
  }

  // District filter
  if (filters.district && filters.district.trim() && filters.district.toLowerCase() !== 'all') {
    sql += ` AND LOWER(p.district) = ?`;
    params.push(filters.district.trim().toLowerCase());
  }

  // Market location filter
  if (filters.market && filters.market.trim() && filters.market.toLowerCase() !== 'all') {
    sql += ` AND LOWER(p.market_location) LIKE ?`;
    params.push(`%${filters.market.trim().toLowerCase()}%`);
  }

  // Generic location filter (matches state, district, or market location)
  if (filters.location && filters.location.trim() && filters.location.toLowerCase() !== 'all') {
    const locPattern = `%${filters.location.trim().toLowerCase()}%`;
    sql += ` AND (LOWER(p.state) LIKE ? OR LOWER(p.district) LIKE ? OR LOWER(p.market_location) LIKE ?)`;
    params.push(locPattern, locPattern, locPattern);
  }

  // Quality Grade filter
  if (filters.quality && filters.quality.trim() && filters.quality.toLowerCase() !== 'all') {
    sql += ` AND LOWER(p.quality_grade) = ?`;
    params.push(filters.quality.trim().toLowerCase());
  }

  // Price range filters
  if (filters.minPrice !== undefined && !isNaN(Number(filters.minPrice))) {
    sql += ` AND p.expected_price >= ?`;
    params.push(Number(filters.minPrice));
  }
  if (filters.maxPrice !== undefined && !isNaN(Number(filters.maxPrice))) {
    sql += ` AND p.expected_price <= ?`;
    params.push(Number(filters.maxPrice));
  }

  // Free-text keyword search across crop, variety, locations, and farmer/FPO name
  const searchText = filters.search || filters.q;
  if (searchText && searchText.trim()) {
    const pattern = `%${searchText.trim().toLowerCase()}%`;
    sql += ` AND (
      LOWER(p.crop_name) LIKE ? 
      OR LOWER(COALESCE(p.variety, '')) LIKE ? 
      OR LOWER(COALESCE(p.state, '')) LIKE ? 
      OR LOWER(COALESCE(p.district, '')) LIKE ? 
      OR LOWER(COALESCE(p.market_location, '')) LIKE ? 
      OR LOWER(u.name) LIKE ?
      OR LOWER(COALESCE(u.organization_name, '')) LIKE ?
    )`;
    params.push(pattern, pattern, pattern, pattern, pattern, pattern, pattern);
  }

  sql += ` ORDER BY p.created_at DESC`;
  return await queryAll<ProduceListingRecord>(sql, params);
}

export async function getProduceListingById(id: string) {
  return await queryOne<ProduceListingRecord>(
    `SELECT p.*, u.name as farmer_name, u.mobile as farmer_mobile 
     FROM produce_listings p
     JOIN users u ON p.farmer_id = u.id
     WHERE p.id = ? LIMIT 1`,
    [id]
  );
}

export async function createProduceListing(data: {
  farmer_id: string;
  crop_name: string;
  variety?: string;
  quantity: number;
  quantity_unit?: string;
  expected_price: number;
  price_unit?: string;
  quality_grade?: string;
  description?: string;
  harvest_date?: string;
  available_from?: string;
  available_until?: string;
  state?: string;
  district?: string;
  market_location?: string;
}) {
  const id = `lst_${crypto.randomUUID().slice(0, 12)}`;

  await execute(
    `INSERT INTO produce_listings (
      id, farmer_id, crop_name, variety, quantity, quantity_unit, expected_price, price_unit,
      quality_grade, description, harvest_date, available_from, available_until,
      state, district, market_location, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    [
      id,
      data.farmer_id,
      data.crop_name.trim(),
      data.variety?.trim() || null,
      Number(data.quantity),
      data.quantity_unit || 'kg',
      Number(data.expected_price),
      data.price_unit || 'Rs/quintal',
      data.quality_grade || 'Grade A',
      data.description?.trim() || null,
      data.harvest_date || null,
      data.available_from || null,
      data.available_until || null,
      data.state?.trim() || null,
      data.district?.trim() || null,
      data.market_location?.trim() || null
    ]
  );

  const listing = await getProduceListingById(id);
  if (!listing) throw new Error('Failed to create listing');
  return listing;
}

export async function updateProduceListing(
  id: string,
  farmerId: string,
  updates: Partial<ProduceListingRecord>
) {
  const existing = await getProduceListingById(id);
  if (!existing) return null;
  if (existing.farmer_id !== farmerId) {
    throw new Error('Unauthorized: You can only update your own listings');
  }

  const crop_name = updates.crop_name !== undefined ? updates.crop_name : existing.crop_name;
  const variety = updates.variety !== undefined ? updates.variety : existing.variety;
  const quantity = updates.quantity !== undefined ? Number(updates.quantity) : existing.quantity;
  const quantity_unit = updates.quantity_unit !== undefined ? updates.quantity_unit : existing.quantity_unit;
  const expected_price = updates.expected_price !== undefined ? Number(updates.expected_price) : existing.expected_price;
  const price_unit = updates.price_unit !== undefined ? updates.price_unit : existing.price_unit;
  const quality_grade = updates.quality_grade !== undefined ? updates.quality_grade : existing.quality_grade;
  const description = updates.description !== undefined ? updates.description : existing.description;
  const harvest_date = updates.harvest_date !== undefined ? updates.harvest_date : existing.harvest_date;
  const available_from = updates.available_from !== undefined ? updates.available_from : existing.available_from;
  const available_until = updates.available_until !== undefined ? updates.available_until : existing.available_until;
  const state = updates.state !== undefined ? updates.state : existing.state;
  const district = updates.district !== undefined ? updates.district : existing.district;
  const market_location = updates.market_location !== undefined ? updates.market_location : existing.market_location;
  const status = updates.status !== undefined ? updates.status : existing.status;

  await execute(
    `UPDATE produce_listings
     SET crop_name = ?, variety = ?, quantity = ?, quantity_unit = ?, expected_price = ?, price_unit = ?,
         quality_grade = ?, description = ?, harvest_date = ?, available_from = ?, available_until = ?,
         state = ?, district = ?, market_location = ?, status = ?, updated_at = now()
     WHERE id = ? AND farmer_id = ?`,
    [
      crop_name, variety, quantity, quantity_unit, expected_price, price_unit,
      quality_grade, description, harvest_date, available_from, available_until,
      state, district, market_location, status, id, farmerId
    ]
  );

  return await getProduceListingById(id);
}

export async function deleteProduceListing(id: string, farmerId: string) {
  const existing = await getProduceListingById(id);
  if (!existing) return false;
  if (existing.farmer_id !== farmerId) {
    throw new Error('Unauthorized: You can only delete your own listings');
  }

  await execute(`DELETE FROM produce_listings WHERE id = ? AND farmer_id = ?`, [id, farmerId]);
  return true;
}

// ----------------------------------------------------
// BUYER DEMANDS REPOSITORY
// ----------------------------------------------------
export async function getBuyerDemands(filters: {
  buyerId?: string;
  status?: string;
  crop?: string;
  state?: string;
} = {}) {
  let sql = `
    SELECT d.*, u.name as buyer_name, u.organization_name
    FROM buyer_demands d
    JOIN users u ON d.buyer_id = u.id
    WHERE 1=1
  `;
  const params: (string | number | boolean | null)[] = [];

  if (filters.buyerId) {
    sql += ` AND d.buyer_id = ?`;
    params.push(filters.buyerId);
  }
  if (filters.status) {
    sql += ` AND d.status = ?`;
    params.push(filters.status);
  }
  if (filters.crop) {
    sql += ` AND LOWER(d.crop_name) LIKE ?`;
    params.push(`%${filters.crop.toLowerCase()}%`);
  }
  if (filters.state) {
    sql += ` AND LOWER(d.state) = ?`;
    params.push(filters.state.toLowerCase());
  }

  sql += ` ORDER BY d.created_at DESC`;
  return await queryAll<BuyerDemandRecord>(sql, params);
}

export async function getBuyerDemandById(id: string) {
  return await queryOne<BuyerDemandRecord>(
    `SELECT d.*, u.name as buyer_name, u.organization_name
     FROM buyer_demands d
     JOIN users u ON d.buyer_id = u.id
     WHERE d.id = ? LIMIT 1`,
    [id]
  );
}

export async function createBuyerDemand(data: {
  buyer_id: string;
  crop_name: string;
  variety?: string;
  required_quantity: number;
  quantity_unit?: string;
  target_price: number;
  price_unit?: string;
  quality_requirement?: string;
  delivery_location?: string;
  state?: string;
  district?: string;
  required_by?: string;
  description?: string;
}) {
  const id = `dem_${crypto.randomUUID().slice(0, 12)}`;

  await execute(
    `INSERT INTO buyer_demands (
      id, buyer_id, crop_name, variety, required_quantity, quantity_unit, target_price, price_unit,
      quality_requirement, delivery_location, state, district, required_by, description, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    [
      id,
      data.buyer_id,
      data.crop_name.trim(),
      data.variety?.trim() || null,
      Number(data.required_quantity),
      data.quantity_unit || 'kg',
      Number(data.target_price),
      data.price_unit || 'Rs/quintal',
      data.quality_requirement?.trim() || null,
      data.delivery_location?.trim() || null,
      data.state?.trim() || null,
      data.district?.trim() || null,
      data.required_by || null,
      data.description?.trim() || null
    ]
  );

  const demand = await getBuyerDemandById(id);
  if (!demand) throw new Error('Failed to create buyer demand');
  return demand;
}

export async function updateBuyerDemand(
  id: string,
  buyerId: string,
  updates: Partial<BuyerDemandRecord>
) {
  const existing = await getBuyerDemandById(id);
  if (!existing) return null;
  if (existing.buyer_id !== buyerId) {
    throw new Error('Unauthorized: You can only update your own requirements');
  }

  const crop_name = updates.crop_name !== undefined ? updates.crop_name : existing.crop_name;
  const variety = updates.variety !== undefined ? updates.variety : existing.variety;
  const required_quantity = updates.required_quantity !== undefined ? Number(updates.required_quantity) : existing.required_quantity;
  const quantity_unit = updates.quantity_unit !== undefined ? updates.quantity_unit : existing.quantity_unit;
  const target_price = updates.target_price !== undefined ? Number(updates.target_price) : existing.target_price;
  const price_unit = updates.price_unit !== undefined ? updates.price_unit : existing.price_unit;
  const quality_requirement = updates.quality_requirement !== undefined ? updates.quality_requirement : existing.quality_requirement;
  const delivery_location = updates.delivery_location !== undefined ? updates.delivery_location : existing.delivery_location;
  const state = updates.state !== undefined ? updates.state : existing.state;
  const district = updates.district !== undefined ? updates.district : existing.district;
  const required_by = updates.required_by !== undefined ? updates.required_by : existing.required_by;
  const description = updates.description !== undefined ? updates.description : existing.description;
  const status = updates.status !== undefined ? updates.status : existing.status;

  await execute(
    `UPDATE buyer_demands
     SET crop_name = ?, variety = ?, required_quantity = ?, quantity_unit = ?, target_price = ?, price_unit = ?,
         quality_requirement = ?, delivery_location = ?, state = ?, district = ?, required_by = ?,
         description = ?, status = ?, updated_at = now()
     WHERE id = ? AND buyer_id = ?`,
    [
      crop_name, variety, required_quantity, quantity_unit, target_price, price_unit,
      quality_requirement, delivery_location, state, district, required_by,
      description, status, id, buyerId
    ]
  );

  return await getBuyerDemandById(id);
}

export async function deleteBuyerDemand(id: string, buyerId: string) {
  const existing = await getBuyerDemandById(id);
  if (!existing) return false;
  if (existing.buyer_id !== buyerId) {
    throw new Error('Unauthorized: You can only delete your own requirements');
  }

  await execute(`DELETE FROM buyer_demands WHERE id = ? AND buyer_id = ?`, [id, buyerId]);
  return true;
}

// ----------------------------------------------------
// OFFERS & NEGOTIATION REPOSITORY
// ----------------------------------------------------
export async function getOffers(filters: {
  buyerId?: string;
  farmerId?: string;
  listingId?: string;
  status?: string;
  originalOfferId?: string;
} = {}) {
  let sql = `
    SELECT o.*, 
           p.crop_name, p.farmer_id as listing_farmer_id,
           COALESCE(p.market_location, p.district) as farmer_location,
           farmer_u.name as farmer_name,
           buyer_u.name as buyer_name, buyer_u.organization_name as buyer_organization
    FROM offers o
    JOIN produce_listings p ON o.listing_id = p.id
    JOIN users farmer_u ON COALESCE(o.farmer_id, p.farmer_id) = farmer_u.id
    JOIN users buyer_u ON o.buyer_id = buyer_u.id
    WHERE 1=1
  `;
  const params: (string | number | boolean | null)[] = [];

  if (filters.buyerId) {
    sql += ` AND o.buyer_id = ?`;
    params.push(filters.buyerId);
  }
  if (filters.farmerId) {
    sql += ` AND (o.farmer_id = ? OR p.farmer_id = ?)`;
    params.push(filters.farmerId, filters.farmerId);
  }
  if (filters.listingId) {
    sql += ` AND o.listing_id = ?`;
    params.push(filters.listingId);
  }
  if (filters.status) {
    sql += ` AND LOWER(o.status) = ?`;
    params.push(filters.status.toLowerCase());
  }
  if (filters.originalOfferId) {
    sql += ` AND (o.id = ? OR o.original_offer_id = ? OR o.parent_offer_id = ?)`;
    params.push(filters.originalOfferId, filters.originalOfferId, filters.originalOfferId);
  }

  sql += ` ORDER BY o.created_at DESC`;
  return await queryAll<OfferRecord>(sql, params);
}

export async function getOfferById(id: string) {
  return await queryOne<OfferRecord>(
    `SELECT o.*, 
            p.crop_name, p.farmer_id as listing_farmer_id,
            COALESCE(p.market_location, p.district) as farmer_location,
            farmer_u.name as farmer_name,
            buyer_u.name as buyer_name, buyer_u.organization_name as buyer_organization
     FROM offers o
     JOIN produce_listings p ON o.listing_id = p.id
     JOIN users farmer_u ON COALESCE(o.farmer_id, p.farmer_id) = farmer_u.id
     JOIN users buyer_u ON o.buyer_id = buyer_u.id
     WHERE o.id = ? LIMIT 1`,
    [id]
  );
}

export async function getOfferNegotiationHistory(offerId: string) {
  const current = await getOfferById(offerId);
  if (!current) return [];

  // Determine root offer id
  const rootId = current.original_offer_id || current.id;

  const sql = `
    SELECT o.*, 
           p.crop_name,
           farmer_u.name as farmer_name,
           buyer_u.name as buyer_name, buyer_u.organization_name as buyer_organization
    FROM offers o
    JOIN produce_listings p ON o.listing_id = p.id
    JOIN users farmer_u ON COALESCE(o.farmer_id, p.farmer_id) = farmer_u.id
    JOIN users buyer_u ON o.buyer_id = buyer_u.id
    WHERE o.id = ? OR o.original_offer_id = ? OR o.parent_offer_id = ?
    ORDER BY o.created_at ASC
  `;
  return await queryAll<OfferRecord>(sql, [rootId, rootId, rootId]);
}

export async function createOffer(data: {
  listing_id: string;
  buyer_id: string;
  offered_price: number;
  quantity: number;
  quantity_unit?: string;
  message?: string;
}) {
  const listing = await getProduceListingById(data.listing_id);
  if (!listing) throw new Error('Produce listing not found');
  if (listing.status !== 'active') throw new Error('Listing is no longer active');

  const id = `off_${crypto.randomUUID().slice(0, 12)}`;
  const farmerId = listing.farmer_id;

  await execute(
    `INSERT INTO offers (
      id, listing_id, buyer_id, farmer_id, offered_price, quantity, quantity_unit, message, status, sender_role
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'buyer')`,
    [
      id,
      data.listing_id,
      data.buyer_id,
      farmerId,
      Number(data.offered_price),
      Number(data.quantity),
      data.quantity_unit || 'kg',
      data.message?.trim() || null
    ]
  );

  const offer = await getOfferById(id);
  if (!offer) throw new Error('Failed to create offer in PostgreSQL');

  // Notify farmer of new incoming offer
  await createNotification({
    recipient_id: farmerId,
    type: 'offer_received',
    title: 'New Offer Received',
    message: `Buyer offered ₹${data.offered_price}/q for ${data.quantity} ${data.quantity_unit || 'kg'} of ${listing.crop_name}.`,
    related_entity_id: id,
    related_entity_type: 'offer'
  });

  return offer;
}

export async function createCounterOffer(data: {
  parent_offer_id: string;
  actor_id: string;
  actor_role: 'farmer' | 'buyer';
  offered_price: number;
  quantity: number;
  quantity_unit?: string;
  message?: string;
}) {
  const parent = await getOfferById(data.parent_offer_id);
  if (!parent) throw new Error('Original offer not found');
  
  const currentStatus = (parent.status || '').toLowerCase();
  if (currentStatus !== 'pending' && currentStatus !== 'countered') {
    throw new Error(`Cannot counter an offer with status "${parent.status}"`);
  }

  // Permission check
  const farmerId = parent.farmer_id || parent.listing_farmer_id;
  if (data.actor_role === 'farmer' && farmerId !== data.actor_id) {
    throw new Error('Unauthorized: Only the farmer for this listing can counter as farmer');
  }
  if (data.actor_role === 'buyer' && parent.buyer_id !== data.actor_id) {
    throw new Error('Unauthorized: Only the buyer who made the offer can counter as buyer');
  }

  const rootId = parent.original_offer_id || parent.id;
  const newOfferId = `off_${crypto.randomUUID().slice(0, 12)}`;

  // Mark parent offer as Countered
  await execute(
    `UPDATE offers SET status = 'Countered', updated_at = now() WHERE id = ?`,
    [parent.id]
  );

  // Insert child counter-offer
  await execute(
    `INSERT INTO offers (
      id, listing_id, buyer_id, farmer_id, parent_offer_id, original_offer_id, sender_role,
      offered_price, quantity, quantity_unit, message, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
    [
      newOfferId,
      parent.listing_id,
      parent.buyer_id,
      farmerId,
      parent.id,
      rootId,
      data.actor_role,
      Number(data.offered_price),
      Number(data.quantity),
      data.quantity_unit || parent.quantity_unit || 'kg',
      data.message?.trim() || null
    ]
  );

  const counterOffer = await getOfferById(newOfferId)!;
  const updatedParent = await getOfferById(parent.id)!;

  // Determine recipient for notification
  const recipientId = data.actor_role === 'farmer' ? parent.buyer_id : farmerId;
  const senderTitle = data.actor_role === 'farmer' ? 'Farmer' : 'Buyer';

  if (recipientId) {
    await createNotification({
      recipient_id: recipientId,
      type: 'counter_offer',
      title: `Counter-Offer from ${senderTitle}`,
      message: `${senderTitle} proposed ₹${data.offered_price}/q for ${data.quantity} ${parent.quantity_unit || 'kg'} of ${parent.crop_name}.`,
      related_entity_id: newOfferId,
      related_entity_type: 'offer'
    });
  }

  return { counterOffer, parentOffer: updatedParent };
}

export async function updateOfferStatus(
  id: string,
  newStatus: 'Accepted' | 'Rejected' | 'Countered' | 'accepted' | 'rejected' | 'withdrawn' | 'countered',
  actorId: string
) {
  const offer = await getOfferById(id);
  if (!offer) throw new Error('Offer not found');

  const farmerId = offer.farmer_id || offer.listing_farmer_id;
  const normalizedStatus = (
    newStatus.toLowerCase() === 'accepted' ? 'Accepted' :
    newStatus.toLowerCase() === 'rejected' ? 'Rejected' :
    newStatus.toLowerCase() === 'countered' ? 'Countered' : 'Rejected'
  );

  // Authorization check
  if (normalizedStatus === 'Accepted' || normalizedStatus === 'Rejected') {
    // If the offer was made by buyer, farmer accepts/rejects.
    // If it was a counter from farmer, buyer accepts/rejects.
    if (offer.sender_role === 'farmer') {
      if (offer.buyer_id !== actorId) {
        throw new Error('Unauthorized: Only the buyer can accept or reject this counter-offer');
      }
    } else {
      if (farmerId !== actorId) {
        throw new Error('Unauthorized: Only the farmer can accept or reject this offer');
      }
    }
  }

  await execute(
    `UPDATE offers SET status = ?, updated_at = now() WHERE id = ?`,
    [normalizedStatus, id]
  );

  let createdTransaction: TransactionRecord | undefined = undefined;
  let createdOrder: OrderRecord | undefined = undefined;

  if (normalizedStatus === 'Accepted') {
    const listing = await getProduceListingById(offer.listing_id);
    const cropName = offer.crop_name || listing?.crop_name || 'Agri Produce';
    const quantity = offer.quantity;
    const agreedPrice = offer.offered_price;
    // Standard calculation: price per quintal (100 kg), or direct
    const totalAmount = Math.round((quantity * (agreedPrice / 100)) * 100) / 100;

    // 1. Create Transaction (Starting at 'Accepted' stage)
    const txId = `tx_${crypto.randomUUID().slice(0, 12)}`;
    await execute(
      `INSERT INTO transactions (
        id, farmer_id, buyer_id, listing_id, offer_id, crop_name, quantity, quantity_unit, agreed_price, total_amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Accepted')`,
      [
        txId,
        farmerId!,
        offer.buyer_id,
        offer.listing_id,
        offer.id,
        cropName,
        quantity,
        offer.quantity_unit || 'kg',
        agreedPrice,
        totalAmount
      ]
    );
    createdTransaction = await getTransactionById(txId) || undefined;

    // 2. Also create Order + Logistics record for existing pipeline compatibility
    const orderId = `ord_${crypto.randomUUID().slice(0, 12)}`;
    await execute(
      `INSERT INTO orders (
        id, listing_id, farmer_id, buyer_id, offer_id, crop_name, quantity, quantity_unit, agreed_price, total_amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
      [
        orderId,
        offer.listing_id,
        farmerId!,
        offer.buyer_id,
        offer.id,
        cropName,
        quantity,
        offer.quantity_unit || 'kg',
        agreedPrice,
        totalAmount
      ]
    );

    const logId = `log_${crypto.randomUUID().slice(0, 12)}`;
    await execute(
      `INSERT INTO logistics (
        id, order_id, pickup_location, delivery_location, transporter_name, vehicle_number, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [
        logId,
        orderId,
        listing?.market_location || listing?.district || 'Farm Gate',
        'Buyer Central Hub',
        'KisanSetu Verified Logistics',
        'MH-15-TC-4402'
      ]
    );
    createdOrder = await getOrderById(orderId) || undefined;

    // Persistent notifications for both parties
    await createNotification({
      recipient_id: offer.buyer_id,
      type: 'offer_accepted',
      title: 'Offer Accepted! 🎉',
      message: `Offer for ${cropName} was accepted at ₹${agreedPrice}/q (Total: ₹${totalAmount.toLocaleString('en-IN')}). Transaction initiated.`,
      related_entity_id: txId,
      related_entity_type: 'transaction'
    });

    if (farmerId) {
      await createNotification({
        recipient_id: farmerId,
        type: 'offer_accepted',
        title: 'Deal Finalized! 🎉',
        message: `Deal for ${cropName} accepted at ₹${agreedPrice}/q with ${offer.buyer_name || 'Buyer'}. Next stage: Payment Pending.`,
        related_entity_id: txId,
        related_entity_type: 'transaction'
      });
    }
  } else if (normalizedStatus === 'Rejected') {
    const notifyRecipient = offer.sender_role === 'farmer' ? farmerId : offer.buyer_id;
    if (notifyRecipient) {
      await createNotification({
        recipient_id: notifyRecipient,
        type: 'offer_rejected',
        title: 'Offer Declined',
        message: `Offer for ${offer.crop_name || 'Produce'} at ₹${offer.offered_price}/q was declined.`,
        related_entity_id: offer.id,
        related_entity_type: 'offer'
      });
    }
  }

  const updatedOffer = await getOfferById(id)!;
  return { offer: updatedOffer, transaction: createdTransaction, order: createdOrder };
}

// ----------------------------------------------------
// TRANSACTIONS REPOSITORY (5-Stage Farmer-Buyer Lifecycle)
// Accepted -> Payment Pending -> Payment Completed -> Delivery/Pickup -> Completed
// ----------------------------------------------------
export const TRANSACTION_STATUS_FLOW = [
  'Accepted',
  'Payment Pending',
  'Payment Completed',
  'Delivery/Pickup',
  'Completed'
] as const;

export type TransactionStatus = typeof TRANSACTION_STATUS_FLOW[number];

export async function getTransactions(filters: {
  farmerId?: string;
  buyerId?: string;
  status?: string;
} = {}) {
  let sql = `
    SELECT t.*,
           farmer_u.name as farmer_name,
           buyer_u.name as buyer_name, buyer_u.organization_name as buyer_organization
    FROM transactions t
    JOIN users farmer_u ON t.farmer_id = farmer_u.id
    JOIN users buyer_u ON t.buyer_id = buyer_u.id
    WHERE 1=1
  `;
  const params: (string | number | boolean | null)[] = [];

  if (filters.farmerId) {
    sql += ` AND t.farmer_id = ?`;
    params.push(filters.farmerId);
  }
  if (filters.buyerId) {
    sql += ` AND t.buyer_id = ?`;
    params.push(filters.buyerId);
  }
  if (filters.status) {
    sql += ` AND LOWER(t.status) = ?`;
    params.push(filters.status.toLowerCase());
  }

  sql += ` ORDER BY t.created_at DESC`;
  return await queryAll<TransactionRecord>(sql, params);
}

export async function getTransactionById(id: string) {
  return await queryOne<TransactionRecord>(
    `SELECT t.*,
            farmer_u.name as farmer_name,
            buyer_u.name as buyer_name, buyer_u.organization_name as buyer_organization
     FROM transactions t
     JOIN users farmer_u ON t.farmer_id = farmer_u.id
     JOIN users buyer_u ON t.buyer_id = buyer_u.id
     WHERE t.id = ? LIMIT 1`,
    [id]
  );
}

export async function updateTransactionStatus(
  id: string,
  newStatus: string,
  actorId?: string
) {
  const transaction = await getTransactionById(id);
  if (!transaction) throw new Error('Transaction not found');

  // Verify actor permission if actorId provided
  if (actorId && actorId !== transaction.farmer_id && actorId !== transaction.buyer_id) {
    throw new Error('Unauthorized: You are not a party to this transaction');
  }

  const validTransitions: Record<string, string[]> = {
    'Accepted': ['Payment Pending', 'Cancelled'],
    'Payment Pending': ['Payment Completed', 'Cancelled'],
    'Payment Completed': ['Delivery/Pickup'],
    'Delivery/Pickup': ['Completed'],
    'Completed': [],
    'Cancelled': []
  };

  const allowedNext = validTransitions[transaction.status] || [];
  if (!allowedNext.includes(newStatus)) {
    throw new Error(
      `Invalid transaction transition: Cannot move from "${transaction.status}" to "${newStatus}". Allowed next: ${allowedNext.join(', ') || 'None'}`
    );
  }

  await execute(
    `UPDATE transactions SET status = ?, updated_at = now() WHERE id = ?`,
    [newStatus, id]
  );

  const updated = await getTransactionById(id)!;

  // Trigger persistent notifications for counterparty
  const notifyRecipient = actorId === transaction.farmer_id ? transaction.buyer_id : transaction.farmer_id;
  await createNotification({
    recipient_id: notifyRecipient,
    type: 'transaction_status_changed',
    title: `Transaction Update: ${newStatus}`,
    message: `Transaction for ${transaction.crop_name} (₹${transaction.total_amount.toLocaleString('en-IN')}) is now at stage "${newStatus}".`,
    related_entity_id: id,
    related_entity_type: 'transaction'
  });

  return updated;
}

// ----------------------------------------------------
// NOTIFICATIONS REPOSITORY
// ----------------------------------------------------
export async function createNotification(data: {
  recipient_id: string;
  type: string;
  title: string;
  message: string;
  related_entity_id?: string;
  related_entity_type?: string;
}) {
  const id = `notif_${crypto.randomUUID().slice(0, 12)}`;
  await execute(
    `INSERT INTO notifications (
      id, recipient_id, type, title, message, related_entity_id, related_entity_type, is_read
    ) VALUES (?, ?, ?, ?, ?, ?, ?, false)`,
    [
      id,
      data.recipient_id,
      data.type,
      data.title,
      data.message,
      data.related_entity_id || null,
      data.related_entity_type || null
    ]
  );

  return await queryOne<NotificationRecord>(`SELECT * FROM notifications WHERE id = ?`, [id])!;
}

export async function getNotifications(recipientId?: string) {
  if (recipientId) {
    return await queryAll<NotificationRecord>(
      `SELECT * FROM notifications WHERE recipient_id = ? ORDER BY created_at DESC LIMIT 50`,
      [recipientId]
    );
  }
  return await queryAll<NotificationRecord>(
    `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50`
  );
}

export async function getUnreadNotificationCount(recipientId?: string) {
  if (recipientId) {
    const row = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND is_read = false`,
      [recipientId]
    );
    return row?.count || 0;
  }
  const row = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM notifications WHERE is_read = false`
  );
  return row?.count || 0;
}

export async function markNotificationAsRead(id: string, recipientId: string) {
  await execute(
    `UPDATE notifications SET is_read = true WHERE id = ? AND recipient_id = ?`,
    [id, recipientId]
  );
  return true;
}

export async function markAllNotificationsAsRead(recipientId: string) {
  await execute(
    `UPDATE notifications SET is_read = true WHERE recipient_id = ?`,
    [recipientId]
  );
  return true;
}


// ----------------------------------------------------
// ORDERS REPOSITORY
// ----------------------------------------------------
export async function getOrders(filters: {
  farmerId?: string;
  buyerId?: string;
  status?: string;
} = {}) {
  let sql = `
    SELECT o.*,
           farmer_u.name as farmer_name,
           buyer_u.name as buyer_name, buyer_u.organization_name as buyer_organization
    FROM orders o
    JOIN users farmer_u ON o.farmer_id = farmer_u.id
    JOIN users buyer_u ON o.buyer_id = buyer_u.id
    WHERE 1=1
  `;
  const params: (string | number | boolean | null)[] = [];

  if (filters.farmerId) {
    sql += ` AND o.farmer_id = ?`;
    params.push(filters.farmerId);
  }
  if (filters.buyerId) {
    sql += ` AND o.buyer_id = ?`;
    params.push(filters.buyerId);
  }
  if (filters.status) {
    sql += ` AND o.status = ?`;
    params.push(filters.status);
  }

  sql += ` ORDER BY o.created_at DESC`;
  return await queryAll<OrderRecord>(sql, params);
}

export async function getOrderById(id: string) {
  return await queryOne<OrderRecord>(
    `SELECT o.*,
            farmer_u.name as farmer_name,
            buyer_u.name as buyer_name, buyer_u.organization_name as buyer_organization
     FROM orders o
     JOIN users farmer_u ON o.farmer_id = farmer_u.id
     JOIN users buyer_u ON o.buyer_id = buyer_u.id
     WHERE o.id = ? LIMIT 1`,
    [id]
  );
}

export async function createOrder(data: {
  listing_id?: string;
  farmer_id: string;
  buyer_id: string;
  offer_id?: string;
  crop_name: string;
  quantity: number;
  quantity_unit?: string;
  agreed_price: number;
}) {
  const orderId = `ord_${crypto.randomUUID().slice(0, 12)}`;
  const totalAmount = Math.round((Number(data.quantity) * (Number(data.agreed_price) / 100)) * 100) / 100;

  await execute(
    `INSERT INTO orders (
      id, listing_id, farmer_id, buyer_id, offer_id, crop_name, quantity, quantity_unit, agreed_price, total_amount, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
    [
      orderId,
      data.listing_id || null,
      data.farmer_id,
      data.buyer_id,
      data.offer_id || null,
      data.crop_name.trim(),
      Number(data.quantity),
      data.quantity_unit || 'kg',
      Number(data.agreed_price),
      totalAmount
    ]
  );

  // Initialize logistics
  const logId = `log_${crypto.randomUUID().slice(0, 12)}`;
  await execute(
    `INSERT INTO logistics (
      id, order_id, pickup_location, delivery_location, transporter_name, vehicle_number, status
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    [
      logId,
      orderId,
      'Farm Gate Warehouse',
      'Buyer Receiving Hub',
      'KisanSetu Verified Logistics',
      'MH-04-AX-8910'
    ]
  );

  const order = await getOrderById(orderId);
  if (!order) throw new Error('Failed to create order');
  return order;
}

export async function updateOrderStatus(
  id: string,
  status: 'confirmed' | 'processing' | 'ready_for_delivery' | 'delivered' | 'completed' | 'cancelled'
) {
  await execute(
    `UPDATE orders SET status = ?, updated_at = now() WHERE id = ?`,
    [status, id]
  );

  // Synchronize logistics status if order completed or delivered
  if (status === 'delivered' || status === 'completed') {
    await execute(
      `UPDATE logistics SET status = 'delivered', actual_delivery_date = now(), updated_at = now() WHERE order_id = ?`,
      [id]
    );
  } else if (status === 'processing' || status === 'ready_for_delivery') {
    await execute(
      `UPDATE logistics SET status = 'in_transit', updated_at = now() WHERE order_id = ?`,
      [id]
    );
  }

  return await getOrderById(id);
}

// ----------------------------------------------------
// LOGISTICS REPOSITORY
// ----------------------------------------------------
export async function getLogisticsByOrderId(orderId: string) {
  return await queryOne<LogisticsRecord>(
    `SELECT * FROM logistics WHERE order_id = ? LIMIT 1`,
    [orderId]
  );
}

export async function getAllLogistics() {
  return await queryAll<LogisticsRecord & { order?: OrderRecord }>(
    `SELECT l.*, o.crop_name, o.quantity, o.quantity_unit, o.status as order_status,
            farmer_u.name as farmer_name, buyer_u.name as buyer_name
     FROM logistics l
     JOIN orders o ON l.order_id = o.id
     JOIN users farmer_u ON o.farmer_id = farmer_u.id
     JOIN users buyer_u ON o.buyer_id = buyer_u.id
     ORDER BY l.created_at DESC`
  );
}

export async function createOrUpdateLogistics(data: {
  order_id: string;
  pickup_location?: string;
  delivery_location?: string;
  transporter_name?: string;
  vehicle_number?: string;
  estimated_delivery_date?: string;
  status?: 'pending' | 'pickup_scheduled' | 'in_transit' | 'delivered';
}) {
  const existing = await getLogisticsByOrderId(data.order_id);

  if (existing) {
    const pickup_location = data.pickup_location !== undefined ? data.pickup_location : existing.pickup_location;
    const delivery_location = data.delivery_location !== undefined ? data.delivery_location : existing.delivery_location;
    const transporter_name = data.transporter_name !== undefined ? data.transporter_name : existing.transporter_name;
    const vehicle_number = data.vehicle_number !== undefined ? data.vehicle_number : existing.vehicle_number;
    const estimated_delivery_date = data.estimated_delivery_date !== undefined ? data.estimated_delivery_date : existing.estimated_delivery_date;
    const status = data.status !== undefined ? data.status : existing.status;

    await execute(
      `UPDATE logistics
       SET pickup_location = ?, delivery_location = ?, transporter_name = ?, vehicle_number = ?,
           estimated_delivery_date = ?, status = ?, updated_at = now()
       WHERE order_id = ?`,
      [pickup_location, delivery_location, transporter_name, vehicle_number, estimated_delivery_date, status, data.order_id]
    );
  } else {
    const id = `log_${crypto.randomUUID().slice(0, 12)}`;
    await execute(
      `INSERT INTO logistics (
        id, order_id, pickup_location, delivery_location, transporter_name, vehicle_number, estimated_delivery_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.order_id,
        data.pickup_location?.trim() || null,
        data.delivery_location?.trim() || null,
        data.transporter_name?.trim() || 'KisanSetu Logistics',
        data.vehicle_number?.trim() || null,
        data.estimated_delivery_date || null,
        data.status || 'pending'
      ]
    );
  }

  return await getLogisticsByOrderId(data.order_id)!;
}

export async function updateLogisticsStatus(
  orderId: string,
  status: 'pending' | 'pickup_scheduled' | 'in_transit' | 'delivered'
) {
  const actualDeliveryDate = status === 'delivered' ? "now()" : "actual_delivery_date";
  await execute(
    `UPDATE logistics 
     SET status = ?, 
         actual_delivery_date = ${status === 'delivered' ? "now()" : "actual_delivery_date"}, 
         updated_at = now()
     WHERE order_id = ?`,
    [status, orderId]
  );
  return await getLogisticsByOrderId(orderId);
}

// ----------------------------------------------------
// CART REPOSITORY
// ----------------------------------------------------
function calculateItemTotal(quantity: number, quantityUnit: string, unitPrice: number, priceUnit: string): number {
  const isQuintalPrice = !priceUnit || priceUnit.toLowerCase().includes('quintal') || priceUnit.toLowerCase().includes('/q');
  const isKgQuantity = !quantityUnit || quantityUnit.toLowerCase() === 'kg';

  if (isQuintalPrice && isKgQuantity) {
    // 1 quintal = 100 kg
    return Math.round((quantity * (unitPrice / 100)) * 100) / 100;
  }
  return Math.round((quantity * unitPrice) * 100) / 100;
}

export async function getCartItems(buyerId: string) {
  const rows = await queryAll<any>(
    `SELECT * FROM cart_items WHERE buyer_id = ? ORDER BY created_at DESC`,
    [buyerId]
  );

  const items: CartItemRecord[] = rows.map((r) => {
    const total_amount = calculateItemTotal(
      Number(r.quantity),
      r.quantity_unit || 'kg',
      Number(r.unit_price),
      r.price_unit || 'Rs/quintal'
    );
    return {
      id: r.id,
      buyer_id: r.buyer_id,
      listing_id: r.listing_id || null,
      crop_name: r.crop_name,
      variety: r.variety || null,
      farmer_id: r.farmer_id || null,
      farmer_name: r.farmer_name,
      quantity: Number(r.quantity),
      quantity_unit: r.quantity_unit || 'kg',
      unit_price: Number(r.unit_price),
      price_unit: r.price_unit || 'Rs/quintal',
      quality_grade: r.quality_grade || null,
      location: r.location || null,
      total_amount,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  });

  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = Math.round(items.reduce((sum, item) => sum + item.total_amount, 0) * 100) / 100;

  return {
    items,
    summary: {
      totalItems,
      totalQuantity,
      subtotal,
    },
  };
}

export async function addToCart(data: {
  buyerId: string;
  listingId?: string | null;
  cropName: string;
  variety?: string | null;
  farmerId?: string | null;
  farmerName: string;
  quantity: number;
  quantityUnit?: string;
  unitPrice: number;
  priceUnit?: string;
  qualityGrade?: string | null;
  location?: string | null;
}) {
  const buyerId = data.buyerId.trim();
  const cropName = data.cropName.trim();
  const farmerName = data.farmerName.trim();
  const quantity = Math.max(1, Number(data.quantity) || 1);
  const quantityUnit = data.quantityUnit || 'kg';
  const unitPrice = Number(data.unitPrice) || 0;
  const priceUnit = data.priceUnit || 'Rs/quintal';
  const listingId = data.listingId || null;
  const variety = data.variety || null;
  const farmerId = data.farmerId || null;
  const qualityGrade = data.qualityGrade || 'Grade A';
  const location = data.location || null;

  // Check if item for this listing or crop already exists in cart for this buyer
  let existing: any = null;
  if (listingId) {
    existing = await queryOne<any>(
      `SELECT * FROM cart_items WHERE buyer_id = ? AND listing_id = ? LIMIT 1`,
      [buyerId, listingId]
    );
  } else {
    existing = await queryOne<any>(
      `SELECT * FROM cart_items WHERE buyer_id = ? AND crop_name = ? AND farmer_name = ? LIMIT 1`,
      [buyerId, cropName, farmerName]
    );
  }

  if (existing) {
    const newQuantity = Number(existing.quantity) + quantity;
    await execute(
      `UPDATE cart_items SET quantity = ?, unit_price = ?, updated_at = now() WHERE id = ?`,
      [newQuantity, unitPrice, existing.id]
    );
    const updated = await queryOne<any>(`SELECT * FROM cart_items WHERE id = ?`, [existing.id]);
    return {
      ...updated,
      total_amount: calculateItemTotal(newQuantity, updated.quantity_unit, unitPrice, updated.price_unit),
    };
  }

  const id = `cart_${crypto.randomUUID().slice(0, 12)}`;
  await execute(
    `INSERT INTO cart_items (
      id, buyer_id, listing_id, crop_name, variety, farmer_id, farmer_name,
      quantity, quantity_unit, unit_price, price_unit, quality_grade, location,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), now())`,
    [
      id,
      buyerId,
      listingId,
      cropName,
      variety,
      farmerId,
      farmerName,
      quantity,
      quantityUnit,
      unitPrice,
      priceUnit,
      qualityGrade,
      location,
    ]
  );

  const total_amount = calculateItemTotal(quantity, quantityUnit, unitPrice, priceUnit);
  return {
    id,
    buyer_id: buyerId,
    listing_id: listingId,
    crop_name: cropName,
    variety,
    farmer_id: farmerId,
    farmer_name: farmerName,
    quantity,
    quantity_unit: quantityUnit,
    unit_price: unitPrice,
    price_unit: priceUnit,
    quality_grade: qualityGrade,
    location,
    total_amount,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function updateCartItemQuantity(id: string, quantity: number) {
  const cleanQty = Number(quantity);
  if (cleanQty <= 0) {
    await removeCartItem(id);
    return null;
  }

  await execute(
    `UPDATE cart_items SET quantity = ?, updated_at = now() WHERE id = ?`,
    [cleanQty, id]
  );

  const item = await queryOne<any>(`SELECT * FROM cart_items WHERE id = ?`, [id]);
  if (!item) return null;

  return {
    ...item,
    total_amount: calculateItemTotal(cleanQty, item.quantity_unit, item.unit_price, item.price_unit),
  };
}

export async function removeCartItem(id: string) {
  await execute(`DELETE FROM cart_items WHERE id = ?`, [id]);
  return true;
}

export async function clearCart(buyerId: string) {
  await execute(`DELETE FROM cart_items WHERE buyer_id = ?`, [buyerId]);
  return true;
}

export async function checkoutCart(buyerId: string, itemIds?: string[]) {
  const { items } = await getCartItems(buyerId);
  const itemsToOrder = itemIds && itemIds.length > 0
    ? items.filter((it) => itemIds.includes(it.id))
    : items;

  if (itemsToOrder.length === 0) {
    throw new Error('Cart is empty. Please add items to cart before placing order.');
  }

  const createdOrders: OrderRecord[] = [];
  const createdTransactions: TransactionRecord[] = [];

  for (const item of itemsToOrder) {
    // Find or fallback farmer ID
    let farmerId = item.farmer_id;
    if (!farmerId && item.listing_id) {
      const listing = await getProduceListingById(item.listing_id);
      if (listing?.farmer_id) farmerId = listing.farmer_id;
    }
    if (!farmerId) {
      // Default to farmer-1 if unlinked
      farmerId = 'farmer-1';
    }

    const orderId = `ord_${crypto.randomUUID().slice(0, 12)}`;
    const totalAmount = item.total_amount;

    // 1. Create order record
    await execute(
      `INSERT INTO orders (
        id, listing_id, farmer_id, buyer_id, crop_name, quantity, quantity_unit, agreed_price, total_amount, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', now(), now())`,
      [
        orderId,
        item.listing_id || null,
        farmerId,
        buyerId,
        item.crop_name,
        item.quantity,
        item.quantity_unit,
        item.unit_price,
        totalAmount,
      ]
    );

    // 2. Create logistics record
    await createOrUpdateLogistics({
      order_id: orderId,
      pickup_location: item.location || 'Farm Gate, Nashik Hub',
      delivery_location: 'Buyer Warehouse / Processing Center',
      transporter_name: 'KisanSetu Express Logistics',
      status: 'pending',

    // 3. Create transaction record for procurement contract & escrow flow
    const txId = `tx_${crypto.randomUUID().slice(0, 12)}`;
    await execute(
      `INSERT INTO transactions (
        id, farmer_id, buyer_id, listing_id, crop_name, quantity, quantity_unit, agreed_price, total_amount, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Accepted', now(), now())`,
      [
        txId,
        farmerId,
        buyerId,
        item.listing_id || null,
        item.crop_name,
        item.quantity,
        item.quantity_unit,
        item.unit_price,
        totalAmount,
      ]
    );

    // 4. Notifications
    await createNotification({
      recipient_id: farmerId,
      type: 'order',
      title: 'New Procurement Order Placed',
      message: `Buyer has placed an order for ${item.quantity} ${item.quantity_unit} of ${item.crop_name} (Total: ₹${totalAmount.toLocaleString('en-IN')}).`,
      related_entity_id: orderId,
      related_entity_type: 'order',
    });

    await createNotification({
      recipient_id: buyerId,
      type: 'order',
      title: 'Order Confirmed',
      message: `Your order for ${item.quantity} ${item.quantity_unit} of ${item.crop_name} from ${item.farmer_name} has been placed successfully!`,
      related_entity_id: orderId,
      related_entity_type: 'order',
    });

    const fullOrder = await getOrderById(orderId);
    if (fullOrder) createdOrders.push(fullOrder);

    const fullTx = await getTransactionById(txId);
    if (fullTx) createdTransactions.push(fullTx);

    // Remove item from cart
    await removeCartItem(item.id);
  }

  return {
    orders: createdOrders,
    transactions: createdTransactions,
  };
}

