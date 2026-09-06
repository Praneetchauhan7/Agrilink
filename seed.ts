/**
 * Development Seed Script for AgriLink
 * 
 * IMPORTANT: This script is for optional development/testing purposes ONLY.
 * It is NOT executed automatically when the server runs.
 * 
 * Usage:
 *   npx tsx seed.ts
 */

import { getDb } from './src/db/database';
import { 
  createUser, 
  createProduceListing, 
  createBuyerDemand, 
  createOffer, 
  createOrder 
} from './src/db/queries';

async function seed() {
  console.log('--- Seeding Development Data into SQLite Database ---');
  await getDb();

  // 1. Create Farmer User
  console.log('Creating demo Farmer: Ramesh Kumar (9876543210 / password123)...');
  const farmer = createUser({
    role: 'farmer',
    name: 'Ramesh Kumar',
    mobile: '9876543210',
    email: 'ramesh.kumar@agrilink.in',
    password: 'password123',
    state: 'Maharashtra',
    district: 'Nashik',
    village: 'Pimpalgaon',
    farm_location: 'Nashik Agro Belt, Maharashtra'
  });

  // 2. Create Buyer User
  console.log('Creating demo Buyer: FreshMart Foods (9123456780 / buyer123)...');
  const buyer = createUser({
    role: 'buyer',
    name: 'Priya Sharma',
    organization_name: 'FreshMart Foods Private Limited',
    mobile: '9123456780',
    email: 'procurement@freshmart.in',
    password: 'buyer123',
    state: 'Maharashtra',
    district: 'Pune',
    business_type: 'Retail Supermarket Chain',
    location: 'Pune Distribution Hub, Maharashtra'
  });

  // 3. Create Produce Listings for Farmer
  console.log('Creating Produce Listings...');
  const listing1 = createProduceListing({
    farmer_id: farmer.id,
    crop_name: 'Tomatoes',
    variety: 'Hybrid (Abhinav)',
    quantity: 5000,
    quantity_unit: 'kg',
    expected_price: 2850,
    price_unit: 'Rs/quintal',
    quality_grade: 'Grade A',
    description: 'Freshly harvested firm red tomatoes suitable for retail distribution and processing.',
    harvest_date: '2026-08-28',
    available_from: '2026-08-29',
    available_until: '2026-09-10',
    state: 'Maharashtra',
    district: 'Nashik',
    market_location: 'Nashik APMC Mandi'
  });

  createProduceListing({
    farmer_id: farmer.id,
    crop_name: 'Onions',
    variety: 'Nashik Red',
    quantity: 12000,
    quantity_unit: 'kg',
    expected_price: 2150,
    price_unit: 'Rs/quintal',
    quality_grade: 'Grade A',
    description: 'Dry, sorted export-quality red onions with long shelf life.',
    harvest_date: '2026-08-20',
    available_from: '2026-08-22',
    available_until: '2026-09-30',
    state: 'Maharashtra',
    district: 'Nashik',
    market_location: 'Lasalgaon Mandi'
  });

  // 4. Create Buyer Demands
  console.log('Creating Buyer Procurement Demands...');
  createBuyerDemand({
    buyer_id: buyer.id,
    crop_name: 'Tomatoes',
    variety: 'Grade A Firm Red',
    required_quantity: 10000,
    quantity_unit: 'kg',
    target_price: 2800,
    price_unit: 'Rs/quintal',
    quality_requirement: 'Grade A (>55mm diameter, no bruising)',
    delivery_location: 'Pune Central Distribution Hub',
    state: 'Maharashtra',
    district: 'Pune',
    required_by: '2026-09-05',
    description: 'Urgent bulk procurement for retail hypermarkets across Western Maharashtra.'
  });

  // 5. Create Sample Offer
  console.log('Creating sample Buyer Offer on Tomato listing...');
  const offer = createOffer({
    listing_id: listing1.id,
    buyer_id: buyer.id,
    offered_price: 2820,
    quantity: 3000,
    quantity_unit: 'kg',
    message: 'We can collect directly from your farm gate in Nashik with verified cold-chain logistics.'
  });

  console.log('--- Development Seed Completed Successfully! ---');
}

seed().catch((err) => {
  console.error('Error seeding data:', err);
  process.exit(1);
});
