// Standardized Indian Agricultural Commodities for KisanSetu
// Used across Farmer Listings, Buyer Requirements, Search, Offers, and Market Pricing

export const COMMODITIES = [
  // Vegetables
  { id: 'tomatoes', name: 'Tomatoes', hindiName: 'टमाटर', category: 'Vegetables', emoji: '🍅', defaultUnit: 'kg', typicalPrice: 2800 },
  { id: 'onions', name: 'Onions', hindiName: 'प्याज़', category: 'Vegetables', emoji: '🧅', defaultUnit: 'kg', typicalPrice: 2200 },
  { id: 'potatoes', name: 'Potatoes', hindiName: 'आलू', category: 'Vegetables', emoji: '🥔', defaultUnit: 'kg', typicalPrice: 1600 },
  { id: 'garlic', name: 'Garlic', hindiName: 'लहसुन', category: 'Vegetables', emoji: '🧄', defaultUnit: 'kg', typicalPrice: 9500 },
  { id: 'ginger', name: 'Ginger', hindiName: 'अदरक', category: 'Vegetables', emoji: '🫚', defaultUnit: 'kg', typicalPrice: 6500 },
  { id: 'green_chilli', name: 'Green Chilli', hindiName: 'हरी मिर्च', category: 'Vegetables', emoji: '🌶️', defaultUnit: 'kg', typicalPrice: 4200 },
  { id: 'cabbage', name: 'Cabbage', hindiName: 'पत्तागोभी', category: 'Vegetables', emoji: '🥬', defaultUnit: 'kg', typicalPrice: 1200 },
  { id: 'cauliflower', name: 'Cauliflower', hindiName: 'फूलगोभी', category: 'Vegetables', emoji: '🥦', defaultUnit: 'kg', typicalPrice: 1800 },
  
  // Grains & Cereals
  { id: 'wheat', name: 'Wheat', hindiName: 'गेहूं', category: 'Grains & Cereals', emoji: '🌾', defaultUnit: 'quintal', typicalPrice: 2450 },
  { id: 'rice', name: 'Rice', hindiName: 'चावल / धान', category: 'Grains & Cereals', emoji: '🍚', defaultUnit: 'quintal', typicalPrice: 3200 },
  { id: 'maize', name: 'Maize', hindiName: 'मक्का', category: 'Grains & Cereals', emoji: '🌽', defaultUnit: 'quintal', typicalPrice: 2150 },
  { id: 'bajra', name: 'Bajra', hindiName: 'बाजरा', category: 'Grains & Cereals', emoji: '🌾', defaultUnit: 'quintal', typicalPrice: 2350 },
  { id: 'jowar', name: 'Jowar', hindiName: 'ज्वार', category: 'Grains & Cereals', emoji: '🌾', defaultUnit: 'quintal', typicalPrice: 3100 },

  // Pulses (Dal / Legumes)
  { id: 'chana', name: 'Chana (Gram)', hindiName: 'चना', category: 'Pulses', emoji: '🫘', defaultUnit: 'quintal', typicalPrice: 5800 },
  { id: 'tur_arhar', name: 'Tur (Arhar)', hindiName: 'तुअर / अरहर', category: 'Pulses', emoji: '🫘', defaultUnit: 'quintal', typicalPrice: 9800 },
  { id: 'moong', name: 'Moong', hindiName: 'मूंग', category: 'Pulses', emoji: '🫘', defaultUnit: 'quintal', typicalPrice: 8400 },
  { id: 'urad', name: 'Urad', hindiName: 'उड़द', category: 'Pulses', emoji: '🫘', defaultUnit: 'quintal', typicalPrice: 8100 },
  { id: 'masoor', name: 'Masoor', hindiName: 'मसूर', category: 'Pulses', emoji: '🫘', defaultUnit: 'quintal', typicalPrice: 6200 },

  // Commercial & Oilseeds
  { id: 'cotton', name: 'Cotton', hindiName: 'कपास', category: 'Commercial & Cash Crops', emoji: '☁️', defaultUnit: 'quintal', typicalPrice: 7100 },
  { id: 'soybean', name: 'Soybean', hindiName: 'सोयाबीन', category: 'Oilseeds', emoji: '🌱', defaultUnit: 'quintal', typicalPrice: 4600 },
  { id: 'mustard', name: 'Mustard', hindiName: 'सरसों', category: 'Oilseeds', emoji: '🌼', defaultUnit: 'quintal', typicalPrice: 5450 },
  { id: 'groundnut', name: 'Groundnut', hindiName: 'मूंगफली', category: 'Oilseeds', emoji: '🥜', defaultUnit: 'quintal', typicalPrice: 6300 },
  { id: 'turmeric', name: 'Turmeric', hindiName: 'हल्दी', category: 'Spices', emoji: '🟡', defaultUnit: 'quintal', typicalPrice: 13500 },

  // Fruits
  { id: 'grapes', name: 'Grapes', hindiName: 'अंगूर', category: 'Fruits', emoji: '🍇', defaultUnit: 'kg', typicalPrice: 5500 },
  { id: 'banana', name: 'Banana', hindiName: 'केला', category: 'Fruits', emoji: '🍌', defaultUnit: 'kg', typicalPrice: 1750 },
  { id: 'mango', name: 'Mango', hindiName: 'आम', category: 'Fruits', emoji: '🥭', defaultUnit: 'kg', typicalPrice: 6000 },
  { id: 'pomegranate', name: 'Pomegranate', hindiName: 'अनार', category: 'Fruits', emoji: '🍎', defaultUnit: 'kg', typicalPrice: 7500 },
  { id: 'apple', name: 'Apple', hindiName: 'सेब', category: 'Fruits', emoji: '🍏', defaultUnit: 'kg', typicalPrice: 8500 }
];

export const COMMODITY_NAMES = COMMODITIES.map(c => c.name);

export const COMMODITY_EMOJI_MAP = COMMODITIES.reduce((acc, c) => {
  acc[c.name.toLowerCase()] = c.emoji;
  return acc;
}, {});

export function getCommodityEmoji(commodityName) {
  if (!commodityName) return '🌱';
  const lower = commodityName.toLowerCase();
  for (const c of COMMODITIES) {
    if (lower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(lower)) {
      return c.emoji;
    }
  }
  return '🌱';
}
