import { pgTable, text, doublePrecision, timestamp, index, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ----------------------------------------------------
// USERS TABLE
// ----------------------------------------------------
export const users = pgTable('users', {
  id: text('id').primaryKey(), // e.g. usr_..., farmer-1, buyer-1
  role: text('role').notNull(), // 'farmer' | 'buyer'
  name: text('name').notNull(),
  organizationName: text('organization_name'),
  mobile: text('mobile'),
  email: text('email'),
  passwordHash: text('password_hash').notNull(),
  state: text('state'),
  district: text('district'),
  preferredLanguage: text('preferred_language').default('en').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_users_mobile').on(table.mobile),
  index('idx_users_email').on(table.email),
  index('idx_users_role').on(table.role),
]);

// ----------------------------------------------------
// FARMER PROFILES TABLE
// ----------------------------------------------------
export const farmerProfiles = pgTable('farmer_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  farmLocation: text('farm_location'),
  village: text('village'),
  state: text('state'),
  district: text('district'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

// ----------------------------------------------------
// BUYER PROFILES TABLE
// ----------------------------------------------------
export const buyerProfiles = pgTable('buyer_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  organizationName: text('organization_name'),
  businessType: text('business_type'),
  location: text('location'),
  state: text('state'),
  district: text('district'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

// ----------------------------------------------------
// PRODUCE LISTINGS TABLE (Farmer selling crops)
// ----------------------------------------------------
export const produceListings = pgTable('produce_listings', {
  id: text('id').primaryKey(),
  farmerId: text('farmer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  cropName: text('crop_name').notNull(),
  variety: text('variety'),
  quantity: doublePrecision('quantity').notNull(),
  quantityUnit: text('quantity_unit').default('kg').notNull(),
  expectedPrice: doublePrecision('expected_price').notNull(),
  priceUnit: text('price_unit').default('Rs/quintal').notNull(),
  qualityGrade: text('quality_grade').default('Grade A').notNull(),
  description: text('description'),
  harvestDate: text('harvest_date'),
  availableFrom: text('available_from'),
  availableUntil: text('available_until'),
  state: text('state'),
  district: text('district'),
  marketLocation: text('market_location'),
  status: text('status').default('active').notNull(), // 'active' | 'sold' | 'expired' | 'cancelled'
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_produce_farmer').on(table.farmerId),
  index('idx_produce_status').on(table.status),
  index('idx_produce_crop').on(table.cropName),
]);

// ----------------------------------------------------
// BUYER DEMANDS TABLE (Buyer procurement requirements)
// ----------------------------------------------------
export const buyerDemands = pgTable('buyer_demands', {
  id: text('id').primaryKey(),
  buyerId: text('buyer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  cropName: text('crop_name').notNull(),
  variety: text('variety'),
  requiredQuantity: doublePrecision('required_quantity').notNull(),
  quantityUnit: text('quantity_unit').default('kg').notNull(),
  targetPrice: doublePrecision('target_price').notNull(),
  priceUnit: text('price_unit').default('Rs/quintal').notNull(),
  qualityRequirement: text('quality_requirement'),
  deliveryLocation: text('delivery_location'),
  state: text('state'),
  district: text('district'),
  requiredBy: text('required_by'),
  description: text('description'),
  status: text('status').default('active').notNull(), // 'active' | 'fulfilled' | 'cancelled' | 'expired'
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_demands_buyer').on(table.buyerId),
  index('idx_demands_status').on(table.status),
  index('idx_demands_crop').on(table.cropName),
]);

// ----------------------------------------------------
// OFFERS TABLE
// ----------------------------------------------------
export const offers = pgTable('offers', {
  id: text('id').primaryKey(),
  listingId: text('listing_id')
    .notNull()
    .references(() => produceListings.id, { onDelete: 'cascade' }),
  buyerId: text('buyer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  farmerId: text('farmer_id')
    .references(() => users.id, { onDelete: 'cascade' }),
  parentOfferId: text('parent_offer_id'),
  originalOfferId: text('original_offer_id'),
  senderRole: text('sender_role').default('buyer').notNull(), // 'buyer' | 'farmer'
  offeredPrice: doublePrecision('offered_price').notNull(),
  quantity: doublePrecision('quantity').notNull(),
  quantityUnit: text('quantity_unit').default('kg').notNull(),
  message: text('message'),
  status: text('status').default('Pending').notNull(), // 'Pending' | 'Accepted' | 'Rejected' | 'Countered'
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_offers_listing').on(table.listingId),
  index('idx_offers_buyer').on(table.buyerId),
  index('idx_offers_farmer').on(table.farmerId),
  index('idx_offers_parent').on(table.parentOfferId),
  index('idx_offers_original').on(table.originalOfferId),
  index('idx_offers_status').on(table.status),
]);

// ----------------------------------------------------
// TRANSACTIONS TABLE (Farmer-Buyer Post-Acceptance Flow)
// ----------------------------------------------------
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  farmerId: text('farmer_id')
    .notNull()
    .references(() => users.id),
  buyerId: text('buyer_id')
    .notNull()
    .references(() => users.id),
  listingId: text('listing_id').references(() => produceListings.id, { onDelete: 'set null' }),
  offerId: text('offer_id').references(() => offers.id, { onDelete: 'set null' }),
  cropName: text('crop_name').notNull(),
  quantity: doublePrecision('quantity').notNull(),
  quantityUnit: text('quantity_unit').default('kg').notNull(),
  agreedPrice: doublePrecision('agreed_price').notNull(),
  totalAmount: doublePrecision('total_amount').notNull(),
  status: text('status').default('Accepted').notNull(), // 'Accepted' | 'Payment Pending' | 'Payment Completed' | 'Delivery/Pickup' | 'Completed'
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_transactions_farmer').on(table.farmerId),
  index('idx_transactions_buyer').on(table.buyerId),
  index('idx_transactions_status').on(table.status),
]);

// ----------------------------------------------------
// NOTIFICATIONS TABLE (Persistent In-App Alerts)
// ----------------------------------------------------
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  recipientId: text('recipient_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'offer_received' | 'counter_offer' | 'offer_accepted' | 'offer_rejected' | 'transaction_status_changed'
  title: text('title').notNull(),
  message: text('message').notNull(),
  relatedEntityId: text('related_entity_id'),
  relatedEntityType: text('related_entity_type'), // 'offer' | 'transaction' | 'listing'
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_notifications_recipient').on(table.recipientId),
  index('idx_notifications_read').on(table.isRead),
]);

// ----------------------------------------------------
// ORDERS TABLE
// ----------------------------------------------------
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  listingId: text('listing_id').references(() => produceListings.id, { onDelete: 'set null' }),
  farmerId: text('farmer_id')
    .notNull()
    .references(() => users.id),
  buyerId: text('buyer_id')
    .notNull()
    .references(() => users.id),
  offerId: text('offer_id').references(() => offers.id, { onDelete: 'set null' }),
  cropName: text('crop_name').notNull(),
  quantity: doublePrecision('quantity').notNull(),
  quantityUnit: text('quantity_unit').default('kg').notNull(),
  agreedPrice: doublePrecision('agreed_price').notNull(),
  totalAmount: doublePrecision('total_amount').notNull(),
  status: text('status').default('confirmed').notNull(), // 'confirmed' | 'processing' | 'ready_for_delivery' | 'delivered' | 'completed' | 'cancelled'
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_orders_farmer').on(table.farmerId),
  index('idx_orders_buyer').on(table.buyerId),
  index('idx_orders_status').on(table.status),
]);

// ----------------------------------------------------
// CART ITEMS TABLE (Buyer persistent crop cart)
// ----------------------------------------------------
export const cartItems = pgTable('cart_items', {
  id: text('id').primaryKey(),
  buyerId: text('buyer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  listingId: text('listing_id')
    .references(() => produceListings.id, { onDelete: 'set null' }),
  cropName: text('crop_name').notNull(),
  variety: text('variety'),
  farmerId: text('farmer_id')
    .references(() => users.id, { onDelete: 'set null' }),
  farmerName: text('farmer_name').notNull(),
  quantity: doublePrecision('quantity').notNull(),
  quantityUnit: text('quantity_unit').default('kg').notNull(),
  unitPrice: doublePrecision('unit_price').notNull(),
  priceUnit: text('price_unit').default('Rs/quintal').notNull(),
  qualityGrade: text('quality_grade'),
  location: text('location'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_cart_buyer').on(table.buyerId),
  index('idx_cart_listing').on(table.listingId),
]);

// ----------------------------------------------------
// LOGISTICS TABLE
// ----------------------------------------------------
export const logistics = pgTable('logistics', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: 'cascade' }),
  pickupLocation: text('pickup_location'),
  deliveryLocation: text('delivery_location'),
  transporterName: text('transporter_name'),
  vehicleNumber: text('vehicle_number'),
  estimatedDeliveryDate: text('estimated_delivery_date'),
  actualDeliveryDate: text('actual_delivery_date'),
  status: text('status').default('pending').notNull(), // 'pending' | 'pickup_scheduled' | 'in_transit' | 'delivered'
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_logistics_order').on(table.orderId),
]);

// ----------------------------------------------------
// RELATIONS
// ----------------------------------------------------
export const usersRelations = relations(users, ({ one, many }) => ({
  farmerProfile: one(farmerProfiles, {
    fields: [users.id],
    references: [farmerProfiles.userId],
  }),
  buyerProfile: one(buyerProfiles, {
    fields: [users.id],
    references: [buyerProfiles.userId],
  }),
  produceListings: many(produceListings),
  buyerDemands: many(buyerDemands),
  buyerOffers: many(offers),
  farmerOrders: many(orders, { relationName: 'farmerOrders' }),
  buyerOrders: many(orders, { relationName: 'buyerOrders' }),
  cartItems: many(cartItems),
}));

export const farmerProfilesRelations = relations(farmerProfiles, ({ one }) => ({
  user: one(users, {
    fields: [farmerProfiles.userId],
    references: [users.id],
  }),
}));

export const buyerProfilesRelations = relations(buyerProfiles, ({ one }) => ({
  user: one(users, {
    fields: [buyerProfiles.userId],
    references: [users.id],
  }),
}));

export const produceListingsRelations = relations(produceListings, ({ one, many }) => ({
  farmer: one(users, {
    fields: [produceListings.farmerId],
    references: [users.id],
  }),
  offers: many(offers),
  orders: many(orders),
}));

export const buyerDemandsRelations = relations(buyerDemands, ({ one }) => ({
  buyer: one(users, {
    fields: [buyerDemands.buyerId],
    references: [users.id],
  }),
}));

export const offersRelations = relations(offers, ({ one }) => ({
  listing: one(produceListings, {
    fields: [offers.listingId],
    references: [produceListings.id],
  }),
  buyer: one(users, {
    fields: [offers.buyerId],
    references: [users.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  farmer: one(users, {
    fields: [orders.farmerId],
    references: [users.id],
    relationName: 'farmerOrders',
  }),
  buyer: one(users, {
    fields: [orders.buyerId],
    references: [users.id],
    relationName: 'buyerOrders',
  }),
  listing: one(produceListings, {
    fields: [orders.listingId],
    references: [produceListings.id],
  }),
  offer: one(offers, {
    fields: [orders.offerId],
    references: [offers.id],
  }),
  logistics: one(logistics, {
    fields: [orders.id],
    references: [logistics.orderId],
  }),
}));

export const logisticsRelations = relations(logistics, ({ one }) => ({
  order: one(orders, {
    fields: [logistics.orderId],
    references: [orders.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  farmer: one(users, {
    fields: [transactions.farmerId],
    references: [users.id],
    relationName: 'farmerTransactions',
  }),
  buyer: one(users, {
    fields: [transactions.buyerId],
    references: [users.id],
    relationName: 'buyerTransactions',
  }),
  listing: one(produceListings, {
    fields: [transactions.listingId],
    references: [produceListings.id],
  }),
  offer: one(offers, {
    fields: [transactions.offerId],
    references: [offers.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  buyer: one(users, {
    fields: [cartItems.buyerId],
    references: [users.id],
  }),
  listing: one(produceListings, {
    fields: [cartItems.listingId],
    references: [produceListings.id],
  }),
  farmer: one(users, {
    fields: [cartItems.farmerId],
    references: [users.id],
  }),
}));

