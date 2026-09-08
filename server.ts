import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { getDb, saveDb } from "./src/db/database";
import {
  createUser,
  findUserByCredentials,
  findUserById,
  updateUser,
  getFarmerProfile,
  getBuyerProfile,
  updateFarmerProfile,
  updateBuyerProfile,
  comparePassword,
  getProduceListings,
  getProduceListingById,
  createProduceListing,
  updateProduceListing,
  deleteProduceListing,
  getBuyerDemands,
  getBuyerDemandById,
  createBuyerDemand,
  updateBuyerDemand,
  deleteBuyerDemand,
  getOffers,
  getOfferById,
  getOfferNegotiationHistory,
  createOffer,
  createCounterOffer,
  updateOfferStatus,
  getTransactions,
  getTransactionById,
  updateTransactionStatus,
  TRANSACTION_STATUS_FLOW,
  createNotification,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getLogisticsByOrderId,
  getAllLogistics,
  createOrUpdateLogistics,
  updateLogisticsStatus,
  getCartItems,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  checkoutCart,
} from "./src/db/queries";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || "agrilink-secure-jwt-key-2026";

app.use(express.json());

// Official Data.gov.in Mandi Price Catalog details
const DATA_GOV_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const DATA_GOV_BASE_URL = `https://api.data.gov.in/resource/${DATA_GOV_RESOURCE_ID}`;
const DATA_GOV_CATALOG_URL =
  "https://www.data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi";

// Verified Government of India Portals Directory
export const OFFICIAL_GOVT_SOURCES = [
  {
    id: "data-gov-mandi",
    name: "Open Government Data (OGD) Platform - Mandi Prices",
    organization: "National Informatics Centre (NIC) / MeitY",
    domain: "data.gov.in",
    url: DATA_GOV_CATALOG_URL,
    category: "Market Prices & Datasets",
    description:
      "Official open dataset for current daily price of agricultural commodities across APMC mandis in India.",
    apiAvailable: true,
    requiresAuth: true,
    authType: "Free API Key from data.gov.in",
  },
  {
    id: "agmarknet",
    name: "Agmarknet Portal (Agricultural Marketing Information Network)",
    organization: "Directorate of Marketing & Inspection (DMI), Ministry of Agriculture",
    domain: "agmarknet.gov.in",
    url: "https://agmarknet.gov.in/",
    category: "Mandi Prices & Arrivals",
    description:
      "National portal for daily market arrivals, wholesale prices, commodity trends, and grading standards.",
    apiAvailable: true,
    requiresAuth: false,
  },
  {
    id: "enam",
    name: "e-NAM (National Agriculture Market)",
    organization: "Small Farmers Agribusiness Consortium (SFAC)",
    domain: "enam.gov.in",
    url: "https://www.enam.gov.in/",
    category: "Electronic Trading & Mandis",
    description:
      "Pan-India electronic trading portal networking existing APMC mandis to create a unified national market.",
    apiAvailable: true,
    requiresAuth: false,
  },
  {
    id: "pm-kisan",
    name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    organization: "Department of Agriculture & Farmers Welfare (DAC&FW)",
    domain: "pmkisan.gov.in",
    url: "https://pmkisan.gov.in/",
    category: "Farmer Support & Direct Benefit",
    description:
      "Direct income support scheme providing ₹6,000 per year in 3 equal installments to eligible farmer families.",
    apiAvailable: false,
    requiresAuth: true,
    authType: "Aadhaar / Farmer Mobile Authentication",
  },
  {
    id: "soil-health",
    name: "Soil Health Card Portal",
    organization: "Ministry of Agriculture and Farmers Welfare",
    domain: "soilhealth.dac.gov.in",
    url: "https://soilhealth.dac.gov.in/",
    category: "Soil Health & Nutrients",
    description:
      "Soil nutrient status report and crop-wise fertilizer dosage recommendations based on lab soil testing.",
    apiAvailable: false,
    requiresAuth: false,
  },
  {
    id: "mkisan",
    name: "mKisan Portal & Kisan Call Centre (KCC)",
    organization: "Ministry of Agriculture and Farmers Welfare",
    domain: "mkisan.gov.in",
    url: "https://mkisan.gov.in/",
    category: "Advisory & Helpline",
    description:
      "SMS-based advisories and toll-free expert farmer support via Kisan Call Centre (1800-180-1551).",
    apiAvailable: false,
    requiresAuth: false,
  },
  {
    id: "imd-agromet",
    name: "India Meteorological Department (IMD) - Agromet Advisory",
    organization: "Ministry of Earth Sciences",
    domain: "mausam.imd.gov.in",
    url: "https://mausam.imd.gov.in/",
    category: "Weather & Forecasts",
    description:
      "Official district-level agrometeorological weather bulletins, monsoon tracks, and rainfall warnings.",
    apiAvailable: true,
    requiresAuth: false,
  },
  {
    id: "desagri",
    name: "Directorate of Economics and Statistics (DESAgri)",
    organization: "Department of Agriculture & Farmers Welfare",
    domain: "desagri.gov.in",
    url: "https://desagri.gov.in/",
    category: "Agricultural Statistics",
    description:
      "Official estimates for agricultural production, crop area, MSP benchmarks, and farm economic indices.",
    apiAvailable: false,
    requiresAuth: false,
  },
  {
    id: "icar",
    name: "Indian Council of Agricultural Research (ICAR)",
    organization: "Department of Agricultural Research and Education (DARE)",
    domain: "icar.org.in",
    url: "https://icar.org.in/",
    category: "Research & Agronomy",
    description:
      "Apex body for coordinating and guiding agricultural research, high-yield seed varieties, and crop sciences.",
    apiAvailable: false,
    requiresAuth: false,
  },
];

// Initialize Gemini client lazily
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Language helper name map
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi (हिंदी)",
  mr: "Marathi (मराठी)",
  pa: "Punjabi (ਪੰਜਾਬੀ)",
  bn: "Bengali (বাংলা)",
  gu: "Gujarati (ગુજરાતી)",
  ta: "Tamil (தமிழ்)",
  te: "Telugu (తెలుగు)",
  kn: "Kannada (ಕನ್ನಡ)",
  ml: "Malayalam (മലയാളം)",
  or: "Odia (ଓଡ଼ିଆ)",
};

/**
 * Fetch real mandi prices from data.gov.in official OGD endpoint
 */
async function fetchRealMandiPrices(filters: {
  commodity?: string;
  state?: string;
  district?: string;
  market?: string;
  limit?: number;
  offset?: number;
}) {
  const apiKey = process.env.DATA_GOV_API_KEY || process.env.OGD_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey === "your_key_here") {
    return {
      success: false,
      status: "api_key_required",
      source: "data.gov.in (Government of India Open Government Data Platform)",
      dataset: "Current Daily Price of Various Commodities from Various Markets (Mandi)",
      catalogUrl: DATA_GOV_CATALOG_URL,
      officialPortalUrl: "https://agmarknet.gov.in/",
      message:
        "An official data.gov.in API key is required to query live mandi prices from the Open Government Data (OGD) Platform.",
      instructions:
        "To enable live government price feeds, register at https://data.gov.in, generate your API key under 'My Account > API Key', and set DATA_GOV_API_KEY in your environment variables.",
      records: [],
      total: 0,
    };
  }

  try {
    const url = new URL(DATA_GOV_BASE_URL);
    url.searchParams.append("api-key", apiKey.trim());
    url.searchParams.append("format", "json");
    url.searchParams.append("limit", String(filters.limit || 25));
    url.searchParams.append("offset", String(filters.offset || 0));

    if (filters.commodity && filters.commodity.trim()) {
      url.searchParams.append("filters[commodity]", filters.commodity.trim());
    }
    if (filters.state && filters.state.trim()) {
      url.searchParams.append("filters[state]", filters.state.trim());
    }
    if (filters.district && filters.district.trim()) {
      url.searchParams.append("filters[district]", filters.district.trim());
    }
    if (filters.market && filters.market.trim()) {
      url.searchParams.append("filters[market]", filters.market.trim());
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "AgriLink-Marketplace/1.0",
        Accept: "application/json",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        success: false,
        status: `http_error_${response.status}`,
        source: "data.gov.in",
        dataset: "Current Daily Price of Various Commodities from Various Markets (Mandi)",
        catalogUrl: DATA_GOV_CATALOG_URL,
        message: `The data.gov.in API returned HTTP status ${response.status}: ${errorText || response.statusText}`,
        records: [],
        total: 0,
      };
    }

    const json: any = await response.json();
    const rawRecords = Array.isArray(json?.records) ? json.records : [];

    const formattedRecords = rawRecords.map((r: any) => ({
      commodity: r.commodity || "",
      market: r.market || "",
      state: r.state || "",
      district: r.district || "",
      date: r.arrival_date || "",
      variety: r.variety || "",
      grade: r.grade || "",
      min_price: r.min_price ? Number(r.min_price) : null,
      max_price: r.max_price ? Number(r.max_price) : null,
      modal_price: r.modal_price ? Number(r.modal_price) : null,
      unit: "₹ / Quintal",
    }));

    return {
      success: true,
      status: "live_data_retrieved",
      source: "data.gov.in (Official OGD Platform)",
      dataset: "Current Daily Price of Various Commodities from Various Markets (Mandi)",
      catalogUrl: DATA_GOV_CATALOG_URL,
      officialPortalUrl: "https://agmarknet.gov.in/",
      total: json?.total || formattedRecords.length,
      count: formattedRecords.length,
      records: formattedRecords,
      lastUpdated: json?.updated_date || new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      success: false,
      status: "network_error",
      source: "data.gov.in",
      dataset: "Current Daily Price of Various Commodities from Various Markets (Mandi)",
      catalogUrl: DATA_GOV_CATALOG_URL,
      message: `Failed to connect to data.gov.in API: ${error?.message || error}`,
      records: [],
      total: 0,
    };
  }
}

// Commodity and state mapping dictionaries for robust matching
const COMMODITY_MAP: { [key: string]: string } = {
  tomato: "Tomato",
  tomatoes: "Tomato",
  "टमाटर": "Tomato",
  "टमाटो": "Tomato",
  onion: "Onion",
  onions: "Onion",
  "प्याज": "Onion",
  "कांदा": "Onion",
  potato: "Potato",
  potatoes: "Potato",
  "आलू": "Potato",
  "बटाटा": "Potato",
  wheat: "Wheat",
  "गेहूं": "Wheat",
  "कनक": "Wheat",
  rice: "Rice",
  paddy: "Paddy(Dhan)(Common)",
  "चावल": "Rice",
  "धान": "Paddy(Dhan)(Common)",
  maize: "Maize",
  corn: "Maize",
  "मक्का": "Maize",
  "मका": "Maize",
  cotton: "Cotton",
  "कपास": "Cotton",
  "रूई": "Cotton",
  soyabean: "Soyabean",
  soybean: "Soyabean",
  "सोयाबीन": "Soyabean",
  mustard: "Mustard",
  "सरसों": "Mustard",
  banana: "Banana",
  "केला": "Banana",
  "केळी": "Banana",
  apple: "Apple",
  "सेब": "Apple",
  garlic: "Garlic",
  "लहसुन": "Garlic",
  "लसूण": "Garlic",
  ginger: "Ginger(Green)",
  "अदरक": "Ginger(Green)",
  chilli: "Green Chilli",
  chillies: "Green Chilli",
  "मिर्च": "Green Chilli",
  gram: "Gram Raw(Chholia)",
  chana: "Gram Raw(Chholia)",
  "चना": "Gram Raw(Chholia)",
  tur: "Arhar (Tur/Red Gram)(Whole)",
  arhar: "Arhar (Tur/Red Gram)(Whole)",
  "तुअर": "Arhar (Tur/Red Gram)(Whole)",
  moong: "Moong(Green Gram)(Whole)",
  "मूंग": "Moong(Green Gram)(Whole)",
  urad: "Urad (Black Gram)(Whole)",
  "उड़द": "Urad (Black Gram)(Whole)",
  groundnut: "Groundnut",
  "मूंगफली": "Groundnut",
  sugarcane: "Sugarcane",
  "गन्ना": "Sugarcane",
};

const STATE_MAP: { [key: string]: string } = {
  maharashtra: "Maharashtra",
  "महाराष्ट्र": "Maharashtra",
  punjab: "Punjab",
  "पंजाब": "Punjab",
  haryana: "Haryana",
  "हरियाणा": "Haryana",
  "uttar pradesh": "Uttar Pradesh",
  up: "Uttar Pradesh",
  "उत्तर प्रदेश": "Uttar Pradesh",
  "madhya pradesh": "Madhya Pradesh",
  mp: "Madhya Pradesh",
  "मध्य प्रदेश": "Madhya Pradesh",
  rajasthan: "Rajasthan",
  "राजस्थान": "Rajasthan",
  gujarat: "Gujarat",
  "गुजरात": "Gujarat",
  karnataka: "Karnataka",
  "कर्नाटक": "Karnataka",
  "tamil nadu": "Tamil Nadu",
  "तमिलनाडु": "Tamil Nadu",
  "andhra pradesh": "Andhra Pradesh",
  "आंध्र": "Andhra Pradesh",
  telangana: "Telangana",
  "तेलंगाना": "Telangana",
  kerala: "Kerala",
  keralam: "Kerala",
  "केरल": "Kerala",
  odisha: "Odisha",
  orissa: "Odisha",
  "ओडिशा": "Odisha",
  assam: "Assam",
  "असम": "Assam",
  "west bengal": "West Bengal",
  bengal: "West Bengal",
  "पश्चिम बंगाल": "West Bengal",
  bihar: "Bihar",
  "बिहार": "Bihar",
  "himachal pradesh": "Himachal Pradesh",
  "हिमाचल": "Himachal Pradesh",
};

/**
 * Intelligent Fallback Engine for Agricultural Guidance
 * Adheres strictly to DIRECT and CONCISE responses without intros, long explanations, or filler.
 */
function getOfflineAgricultureResponse(
  message: string,
  languageCode: string = "en",
  role: string = "farmer",
  realMarketData?: any
): string {
  const query = message.toLowerCase();
  const isHindi = languageCode === "hi";

  // Check if query is asking for market prices or mandi rates
  const isPriceQuery =
    query.includes("price") ||
    query.includes("rate") ||
    query.includes("mandi") ||
    query.includes("bhav") ||
    query.includes("cost") ||
    query.includes("highest") ||
    query.includes("lowest") ||
    query.includes("भाव") ||
    query.includes("कीमत") ||
    query.includes("दाम") ||
    query.includes("रेट");

  if (isPriceQuery) {
    const records = (realMarketData?.records || []).filter((r: any) => Number(r.modal_price) > 0);

    if (!records || records.length === 0) {
      return isHindi
        ? "माफ़ कीजिए, मुझे सरकारी बाज़ार डेटा में वह जानकारी नहीं मिली।"
        : "Sorry, I couldn't find that data in the government market data.";
    }

    // 1. Check if user asked for "highest" price or market
    if (
      query.includes("highest") ||
      query.includes("maximum") ||
      query.includes("top") ||
      query.includes("best") ||
      query.includes("सबसे ज्यादा") ||
      query.includes("अधिकतम") ||
      query.includes("उच्चतम")
    ) {
      const highestRec = [...records].sort((a: any, b: any) => Number(b.modal_price) - Number(a.modal_price))[0];
      if (isHindi) {
        return `${highestRec.market}, ${highestRec.state}: ₹${Number(highestRec.modal_price).toLocaleString()} / क्विंटल`;
      }
      return `${highestRec.market}, ${highestRec.state}: ₹${Number(highestRec.modal_price).toLocaleString()} / quintal`;
    }

    // 2. Check if user asked for "lowest" price or market
    if (
      query.includes("lowest") ||
      query.includes("minimum") ||
      query.includes("cheapest") ||
      query.includes("सबसे कम") ||
      query.includes("न्यूनतम")
    ) {
      const lowestRec = [...records].sort((a: any, b: any) => Number(a.modal_price) - Number(b.modal_price))[0];
      if (isHindi) {
        return `${lowestRec.market}, ${lowestRec.state}: ₹${Number(lowestRec.modal_price).toLocaleString()} / क्विंटल`;
      }
      return `${lowestRec.market}, ${lowestRec.state}: ₹${Number(lowestRec.modal_price).toLocaleString()} / quintal`;
    }

    // 3. Check if user specified a state
    let matchedState = "";
    for (const [key, val] of Object.entries(STATE_MAP)) {
      if (query.includes(key)) {
        matchedState = val;
        break;
      }
    }

    if (matchedState) {
      const stateRecords = records.filter((r: any) => r.state && r.state.toLowerCase().includes(matchedState.toLowerCase()));
      if (stateRecords.length > 0) {
        const topState = stateRecords[0];
        if (isHindi) {
          return `₹${Number(topState.modal_price).toLocaleString()} / क्विंटल (${topState.market}, ${topState.state} • ${topState.date})`;
        }
        return `₹${Number(topState.modal_price).toLocaleString()} / quintal (${topState.market}, ${topState.state} • ${topState.date})`;
      } else {
        return isHindi
          ? "माफ़ कीजिए, मुझे सरकारी बाज़ार डेटा में वह जानकारी नहीं मिली।"
          : "Sorry, I couldn't find that data in the government market data.";
      }
    }

    // 4. Direct general commodity price question (e.g. "What is the tomato price?")
    const first = records[0];

    if (isHindi) {
      return `₹${Number(first.modal_price).toLocaleString()} / क्विंटल (${first.market}, ${first.state} • ${first.date})`;
    }
    return `₹${Number(first.modal_price).toLocaleString()} / quintal (${first.market}, ${first.state} • ${first.date})`;
  }

  // 2. Selling produce on AgriLink
  if (
    query.includes("sell") ||
    query.includes("how to sell") ||
    query.includes("list produce") ||
    query.includes("बेचें") ||
    query.includes("विक्री")
  ) {
    if (isHindi) {
      return `अपनी फसल बेचने के लिए 'My Produce' टैब में जाएं, 'Add Produce' पर क्लिक करें और फसल का विवरण व अपेक्षित मूल्य दर्ज करें।`;
    }
    return `To sell your crop, go to the 'My Produce' tab, click 'Add Produce', and enter your crop details and expected price to publish your listing to buyers.`;
  }

  // 3. How the platform works / Smart Aggregation
  if (
    query.includes("how does this platform work") ||
    query.includes("how it works") ||
    query.includes("aggregation") ||
    query.includes("काम कैसे करता") ||
    query.includes("agrilink")
  ) {
    if (isHindi) {
      return `AgriLink छोटे किसानों की उपज को बड़े ऑर्डरों में एकत्रित (aggregate) करता है, सीधे थोक खरीदारों से जोड़ता है और डिलीवरी पर सुरक्षित भुगतान जारी करता है।`;
    }
    return `AgriLink aggregates crop lots from multiple farmers into bulk orders, connects directly with institutional buyers, and releases payment securely upon delivery.`;
  }

  // 4. Modal price explanation
  if (
    query.includes("modal price") ||
    query.includes("what is modal") ||
    query.includes("मॉडल भाव")
  ) {
    if (isHindi) {
      return `मॉडल भाव (Modal Price) वह दर है जिस पर किसी मंडी में उस दिन सबसे अधिक मात्रा में फसल का व्यापार हुआ है।`;
    }
    return `Modal price is the rate at which the highest quantity of a commodity traded in a mandi on that day.`;
  }

  // 5. Weather inquiry
  if (
    query.includes("weather") ||
    query.includes("rain") ||
    query.includes("monsoon") ||
    query.includes("मौसम") ||
    query.includes("बारिश") ||
    query.includes("हवामान")
  ) {
    if (isHindi) {
      return `सटीक मौसम पूर्वानुमान mausam.imd.gov.in पर देखें। बारिश से 24-48 घंटे पहले कीटनाशक छिड़काव और सिंचाई से बचें।`;
    }
    return `Check mausam.imd.gov.in for official forecasts. Avoid spraying pesticides or scheduling heavy irrigation within 24-48 hours of predicted rainfall.`;
  }

  // 6. Soil inquiry
  if (
    query.includes("soil") ||
    query.includes("मिट्टी") ||
    query.includes("माती") ||
    query.includes("npk") ||
    query.includes("fertilizer") ||
    query.includes("खाद")
  ) {
    if (isHindi) {
      return `हर 2 साल में soilhealth.dac.gov.in से मिट्टी की जांच कराएं और प्रयोगशाला की सिफारिश के आधार पर संतुलित N-P-K और जैविक खाद डालें।`;
    }
    return `Test soil every 2 years via soilhealth.dac.gov.in and apply balanced N-P-K and organic manure based on your soil test report.`;
  }

  // 7. Pest & Disease Management
  if (
    query.includes("pest") ||
    query.includes("disease") ||
    query.includes("insect") ||
    query.includes("blight") ||
    query.includes("fungus") ||
    query.includes("কীট") ||
    query.includes("कीट") ||
    query.includes("रोग") ||
    query.includes("इल्ली")
  ) {
    if (isHindi) {
      return `चूसक कीटों के लिए नीम का तेल (5ml/L) और चिपचिपे ट्रैप लगाएं। फफूंद धब्बों के लिए कॉपर ऑक्सीक्लोराइड या मैंकोज़ेब (2g/L) का छिड़काव करें।`;
    }
    return `For sucking pests, use yellow sticky traps and spray neem oil (5ml/L). For fungal leaf blight, spray copper oxychloride or mancozeb (2g/L).`;
  }

  // 8. Minimum Support Price (MSP)
  if (
    query.includes("msp") ||
    query.includes("minimum support") ||
    query.includes("समर्थन मूल्य") ||
    query.includes("एमएसपी")
  ) {
    if (isHindi) {
      return `न्यूनतम समर्थन मूल्य (MSP) भारत सरकार द्वारा 22 फसलों के लिए तय न्यूनतम गारंटीकृत मूल्य है। विवरण: desagri.gov.in।`;
    }
    return `Minimum Support Price (MSP) is the government-guaranteed floor price for 22 mandated crops. Official details: desagri.gov.in.`;
  }

  // Default concise direct response
  if (isHindi) {
    return `आप मंडी भाव, फसल बिक्री या खेती से संबंधित कोई भी सीधा सवाल पूछ सकते हैं।`;
  }
  return `Ask any direct question about crop prices, mandis, or farming.`;
}

// ----------------------------------------------------
// 1. API: /api/market-prices (Real data.gov.in Integration)
// ----------------------------------------------------
app.get("/api/market-prices", async (req, res) => {
  const { commodity, state, district, market, limit, offset } = req.query;

  const result = await fetchRealMandiPrices({
    commodity: commodity as string,
    state: state as string,
    district: district as string,
    market: market as string,
    limit: limit ? Number(limit) : 25,
    offset: offset ? Number(offset) : 0,
  });

  return res.json(result);
});

// ----------------------------------------------------
// 1b. API: /api/market-price-trends (Real Price Trend Graph Data)
// ----------------------------------------------------
app.get("/api/market-price-trends", async (req, res) => {
  const { commodity, state, district, market, period = "1w" } = req.query;

  const result = await fetchRealMandiPrices({
    commodity: commodity as string,
    state: state as string,
    district: district as string,
    market: market as string,
    limit: 50,
  });

  const records = result.records || [];
  const distinctDates = Array.from(new Set(records.map((r: any) => r.date).filter(Boolean)));
  const hasMultipleDates = distinctDates.length > 1;

  return res.json({
    success: result.success,
    status: result.status,
    period: String(period),
    commodity: commodity || "All",
    state: state || "All",
    district: district || "All",
    market: market || "All",
    totalRecords: records.length,
    recordedDates: distinctDates,
    hasHistoricalArchive: hasMultipleDates,
    historicalNotice: distinctDates.length <= 1
      ? "Official data.gov.in dataset (Current Daily Price) provides active daily mandi reports. Multi-month or annual historical archives are not distributed in this daily API feed. Showing all verified real government records without fabrication."
      : null,
    source: "data.gov.in (Official OGD Platform)",
    catalogUrl: DATA_GOV_CATALOG_URL,
    records: records,
  });
});

// ----------------------------------------------------
// 2. API: /api/government-sources
// ----------------------------------------------------
app.get("/api/government-sources", async (req, res) => {
  res.json({
    status: "ok",
    count: OFFICIAL_GOVT_SOURCES.length,
    sources: OFFICIAL_GOVT_SOURCES,
    catalogUrl: DATA_GOV_CATALOG_URL,
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------------------------------
// AUTHENTICATION HELPER & MIDDLEWARE
// ----------------------------------------------------
function generateToken(user: { id: string; role: string; name: string; mobile?: string | null; email?: string | null }): string {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function verifyAuthToken(req: express.Request): { id: string; role: string; name: string } | null {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      return jwt.verify(token, JWT_SECRET) as { id: string; role: string; name: string };
    }
    const tokenHeader = req.headers["x-auth-token"] as string;
    if (tokenHeader) {
      return jwt.verify(tokenHeader, JWT_SECRET) as { id: string; role: string; name: string };
    }
    return null;
  } catch (err) {
    return null;
  }
}

// Optional / Required Auth Middleware
async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = verifyAuthToken(req);
  if (!user) {
    // If not bearer token, allow mock header for seamless fallback if passed in client
    const fallbackId = (req.headers["x-user-id"] as string) || (req.query.userId as string);
    if (fallbackId) {
      const dbUser = await findUserById(fallbackId);
      if (dbUser) {
        (req as any).user = dbUser;
        return next();
      }
    }
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  (req as any).user = user;
  next();
}

// ----------------------------------------------------
// 3. API: AUTHENTICATION (Register, Login, Me)
// ----------------------------------------------------
app.post("/api/auth/register", async (req, res) => {
  try {
    const {
      role,
      name,
      organization_name,
      mobile,
      email,
      password,
      state,
      district,
      preferred_language,
      farm_location,
      village,
      business_type,
      location,
    } = req.body;

    if (!role || (role !== "farmer" && role !== "buyer")) {
      return res.status(400).json({ success: false, message: "Invalid role. Must be 'farmer' or 'buyer'" });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, message: "Password must be at least 4 characters" });
    }

    if (role === "farmer" && (!mobile || !mobile.trim())) {
      return res.status(400).json({ success: false, message: "A valid mobile number is required for Farmer registration" });
    }
    if (role === "buyer" && !email && !mobile) {
      return res.status(400).json({ success: false, message: "Email or mobile number is required for Buyer registration" });
    }

    // Check if user already exists
    const identifier = mobile || email;
    if (identifier) {
      const existing = await findUserByCredentials(identifier);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "An account with this mobile number or email already exists. Please login instead.",
        });
      }
    }

    const newUser = await createUser({
      role,
      name: name.trim(),
      organization_name,
      mobile,
      email,
      password,
      state: state || undefined,
      district: district || undefined,
      preferred_language,
      farm_location,
      village,
      business_type,
      location,
    });

    const token = generateToken(newUser);
    const profile = role === "farmer" ? await getFarmerProfile(newUser.id) : await getBuyerProfile(newUser.id);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        ...newUser,
        profile,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to register user" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { role, name, mobile, email, identifier, password } = req.body;

    const userIdentifier = identifier || mobile || email;

    if (!userIdentifier || !userIdentifier.trim()) {
      return res.status(400).json({
        success: false,
        message: "Mobile number or email identifier is required",
      });
    }

    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, message: "Password must be at least 4 characters" });
    }

    let user = await findUserByCredentials(userIdentifier.trim());
    const effectiveRole = user?.role || role || (userIdentifier.includes("@") ? "buyer" : "farmer");

    // If user does not exist yet (e.g. first-time login), create account automatically
    if (!user) {
      user = await createUser({
        role: effectiveRole,
        name: name?.trim() || (effectiveRole === "farmer" ? "Farmer Producer" : "Enterprise Buyer"),
        organization_name: effectiveRole === "buyer" ? (name?.trim() || "") : undefined,
        mobile: mobile || (userIdentifier.includes("@") ? undefined : userIdentifier),
        email: email || (userIdentifier.includes("@") ? userIdentifier : undefined),
        password,
      });
    } else {
      // Verify password if user exists and has password hash
      if (user.password_hash) {
        const isMatch = comparePassword(password, user.password_hash);
        if (!isMatch) {
          return res.status(401).json({ success: false, message: "Invalid credentials. Incorrect password." });
        }
      }
    }

    const safeUser = await findUserById(user.id);
    const profile = safeUser?.role === "farmer" ? await getFarmerProfile(user.id) : await getBuyerProfile(user.id);
    const token = generateToken(safeUser!);

    return res.json({
      success: true,
      message: `${safeUser?.role === "farmer" ? "Farmer" : "Buyer"} authentication successful`,
      token,
      user: {
        ...safeUser,
        profile,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: error.message || "Authentication error" });
  }
});

app.get("/api/auth/me", async (req, res) => {
  const authUser = verifyAuthToken(req);
  if (!authUser) {
    return res.status(401).json({ success: false, message: "Unauthorized or invalid token" });
  }
  const user = await findUserById(authUser.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  const profile = user.role === "farmer" ? await getFarmerProfile(user.id) : await getBuyerProfile(user.id);
  return res.json({
    success: true,
    user: {
      ...user,
      profile,
    },
  });
});

app.put("/api/auth/profile", async (req, res) => {
  try {
    const authUser = verifyAuthToken(req);
    const userId = authUser?.id || req.body.id || req.body.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized or missing user ID" });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found in database" });
    }

    const {
      name,
      organization_name,
      mobile,
      email,
      state,
      district,
      preferred_language,
      farm_location,
      village,
      business_type,
      location,
    } = req.body;

    const updatedUser = await updateUser(userId, {
      name: name !== undefined ? name.trim() : user.name,
      organization_name: organization_name !== undefined ? organization_name : user.organization_name,
      mobile: mobile !== undefined ? mobile : user.mobile,
      email: email !== undefined ? email : user.email,
      state: state !== undefined ? state : user.state,
      district: district !== undefined ? district : user.district,
      preferred_language: preferred_language !== undefined ? preferred_language : user.preferred_language,
    });

    let updatedProfile: any = null;
    if (user.role === "farmer") {
      updatedProfile = await updateFarmerProfile(userId, {
        farm_location: farm_location !== undefined ? farm_location.trim() || null : (location !== undefined ? location.trim() || null : undefined),
        village: village !== undefined ? village.trim() || null : undefined,
        state: state !== undefined ? state.trim() || null : undefined,
        district: district !== undefined ? district.trim() || null : undefined,
      });
    } else {
      updatedProfile = await updateBuyerProfile(userId, {
        organization_name: organization_name !== undefined ? organization_name.trim() || null : undefined,
        business_type: business_type !== undefined ? business_type.trim() || null : undefined,
        location: location !== undefined ? location.trim() || null : (farm_location !== undefined ? farm_location.trim() || null : undefined),
        state: state !== undefined ? state.trim() || null : undefined,
        district: district !== undefined ? district.trim() || null : undefined,
      });
    }

    saveDb();

    return res.json({
      success: true,
      message: "Profile updated successfully in SQLite database",
      user: {
        ...updatedUser,
        profile: updatedProfile,
      },
    });
  } catch (err: any) {
    console.error("Profile update error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to update profile" });
  }
});

// ----------------------------------------------------
// USERS API
// ----------------------------------------------------
app.get("/api/users/:id", async (req, res) => {
  const user = await findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  const profile = user.role === "farmer" ? await getFarmerProfile(user.id) : await getBuyerProfile(user.id);
  return res.json({ success: true, user: { ...user, profile } });
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const updated = await updateUser(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.json({ success: true, message: "Profile updated successfully", user: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// 4. API: PRODUCE LISTINGS (Farmer Catalog & Search)
// ----------------------------------------------------
app.get("/api/produce", async (req, res) => {
  try {
    const {
      farmerId,
      status,
      crop,
      commodity,
      location,
      state,
      district,
      market,
      quality,
      search,
      q,
      minPrice,
      maxPrice,
    } = req.query;

    const listings = await getProduceListings({
      farmerId: farmerId as string,
      status: status as string,
      crop: (crop as string) || (commodity as string),
      commodity: commodity as string,
      location: location as string,
      state: state as string,
      district: district as string,
      market: market as string,
      quality: quality as string,
      search: (search as string) || (q as string),
      q: (q as string) || (search as string),
      minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
      maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
    });
    return res.json({ success: true, count: listings.length, listings, produce: listings });
  } catch (error: any) {
    console.error("Error fetching produce listings:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/produce/:id", async (req, res) => {
  const listing = await getProduceListingById(req.params.id);
  if (!listing) {
    return res.status(404).json({ success: false, message: "Produce listing not found" });
  }
  return res.json({ success: true, listing });
});

app.post("/api/produce", async (req, res) => {
  try {
    const {
      farmer_id,
      farmerId,
      crop_name,
      produce,
      variety,
      quantity,
      quantity_unit,
      expected_price,
      expectedPrice,
      price_unit,
      quality_grade,
      grade,
      description,
      harvest_date,
      harvestDate,
      available_from,
      available_until,
      state,
      district,
      market_location,
      market,
    } = req.body;

    const fId = farmer_id || farmerId;
    const crop = crop_name || produce;
    const price = expected_price || expectedPrice;

    if (!fId) {
      return res.status(400).json({ success: false, message: "Farmer ID is required" });
    }
    if (!crop || !crop.trim()) {
      return res.status(400).json({ success: false, message: "Crop name is required" });
    }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      return res.status(400).json({ success: false, message: "A valid positive quantity is required" });
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      return res.status(400).json({ success: false, message: "A valid positive expected price is required" });
    }

    const listing = await createProduceListing({
      farmer_id: fId,
      crop_name: crop,
      variety,
      quantity: Number(quantity),
      quantity_unit: quantity_unit || "kg",
      expected_price: Number(price),
      price_unit: price_unit || "Rs/quintal",
      quality_grade: quality_grade || grade || "Grade A",
      description,
      harvest_date: harvest_date || harvestDate,
      available_from,
      available_until,
      state: state || "Maharashtra",
      district: district || "Nashik",
      market_location: market_location || market || "Nashik APMC Mandi",
    });

    return res.status(201).json({
      success: true,
      message: "Produce listing published successfully",
      listing,
    });
  } catch (error: any) {
    console.error("Error creating produce listing:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/produce/:id", async (req, res) => {
  try {
    const { farmer_id, farmerId } = req.body;
    const fId = farmer_id || farmerId;
    if (!fId) {
      return res.status(400).json({ success: false, message: "Farmer ID is required for verification" });
    }

    const updated = await updateProduceListing(req.params.id, fId, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }
    return res.json({ success: true, message: "Listing updated successfully", listing: updated });
  } catch (error: any) {
    console.error("Error updating produce listing:", error);
    return res.status(403).json({ success: false, message: error.message });
  }
});

app.delete("/api/produce/:id", async (req, res) => {
  try {
    const farmerId = (req.query.farmerId as string) || req.body.farmerId || req.body.farmer_id;
    if (!farmerId) {
      return res.status(400).json({ success: false, message: "Farmer ID is required" });
    }
    const success = await deleteProduceListing(req.params.id, farmerId);
    if (!success) {
      return res.status(404).json({ success: false, message: "Listing not found or unauthorized" });
    }
    return res.json({ success: true, message: "Listing removed successfully" });
  } catch (error: any) {
    return res.status(403).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 5. API: BUYER DEMANDS (Procurement Requirements)
// ----------------------------------------------------
app.get("/api/buyer-demands", async (req, res) => {
  try {
    const { buyerId, status, crop, state } = req.query;
    const demands = await getBuyerDemands({
      buyerId: buyerId as string,
      status: status as string,
      crop: crop as string,
      state: state as string,
    });
    return res.json({ success: true, count: demands.length, demands });
  } catch (error: any) {
    console.error("Error fetching buyer demands:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/buyer-demands/:id", async (req, res) => {
  const demand = await getBuyerDemandById(req.params.id);
  if (!demand) {
    return res.status(404).json({ success: false, message: "Buyer demand not found" });
  }
  return res.json({ success: true, demand });
});

app.post("/api/buyer-demands", async (req, res) => {
  try {
    const {
      buyer_id,
      buyerId,
      crop_name,
      produce,
      variety,
      required_quantity,
      quantity,
      quantity_unit,
      target_price,
      targetPrice,
      price_unit,
      quality_requirement,
      grade,
      delivery_location,
      location,
      state,
      district,
      required_by,
      deadline,
      description,
    } = req.body;

    const bId = buyer_id || buyerId;
    const crop = crop_name || produce;
    const reqQty = required_quantity || quantity;
    const tPrice = target_price || targetPrice;

    if (!bId) {
      return res.status(400).json({ success: false, message: "Buyer ID is required" });
    }
    if (!crop || !crop.trim()) {
      return res.status(400).json({ success: false, message: "Crop name is required" });
    }
    if (!reqQty || isNaN(Number(reqQty)) || Number(reqQty) <= 0) {
      return res.status(400).json({ success: false, message: "A valid positive required quantity is required" });
    }
    if (!tPrice || isNaN(Number(tPrice)) || Number(tPrice) <= 0) {
      return res.status(400).json({ success: false, message: "A valid positive target price is required" });
    }

    const demand = await createBuyerDemand({
      buyer_id: bId,
      crop_name: crop,
      variety,
      required_quantity: Number(reqQty),
      quantity_unit: quantity_unit || "kg",
      target_price: Number(tPrice),
      price_unit: price_unit || "Rs/quintal",
      quality_requirement: quality_requirement || grade || "Grade A",
      delivery_location: delivery_location || location || "Pune Central Hub",
      state: state || "Maharashtra",
      district: district || "Pune",
      required_by: required_by || deadline,
      description,
    });

    return res.status(201).json({
      success: true,
      message: "Procurement requirement published successfully",
      demand,
    });
  } catch (error: any) {
    console.error("Error creating buyer demand:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/buyer-demands/:id", async (req, res) => {
  try {
    const { buyer_id, buyerId } = req.body;
    const bId = buyer_id || buyerId;
    if (!bId) {
      return res.status(400).json({ success: false, message: "Buyer ID is required" });
    }
    const updated = await updateBuyerDemand(req.params.id, bId, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Buyer demand not found" });
    }
    return res.json({ success: true, message: "Demand updated successfully", demand: updated });
  } catch (error: any) {
    return res.status(403).json({ success: false, message: error.message });
  }
});

app.delete("/api/buyer-demands/:id", async (req, res) => {
  try {
    const buyerId = (req.query.buyerId as string) || req.body.buyerId || req.body.buyer_id;
    if (!buyerId) {
      return res.status(400).json({ success: false, message: "Buyer ID is required" });
    }
    const success = await deleteBuyerDemand(req.params.id, buyerId);
    if (!success) {
      return res.status(404).json({ success: false, message: "Demand not found or unauthorized" });
    }
    return res.json({ success: true, message: "Demand removed successfully" });
  } catch (error: any) {
    return res.status(403).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 6. API: OFFERS & NEGOTIATION (Bids, Counters, Acceptance)
// ----------------------------------------------------
app.get("/api/offers", async (req, res) => {
  try {
    const { buyerId, farmerId, listingId, status, originalOfferId } = req.query;
    const offers = await getOffers({
      buyerId: buyerId as string,
      farmerId: farmerId as string,
      listingId: listingId as string,
      status: status as string,
      originalOfferId: originalOfferId as string,
    });
    return res.json({ success: true, count: offers.length, offers });
  } catch (error: any) {
    console.error("Error fetching offers:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/offers/:id", async (req, res) => {
  const offer = await getOfferById(req.params.id);
  if (!offer) {
    return res.status(404).json({ success: false, message: "Offer not found" });
  }
  const history = await getOfferNegotiationHistory(offer.id);
  return res.json({ success: true, offer, history });
});

app.get("/api/offers/:id/history", async (req, res) => {
  try {
    const history = await getOfferNegotiationHistory(req.params.id);
    return res.json({ success: true, count: history.length, history });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/offers", async (req, res) => {
  try {
    const { listing_id, listingId, buyer_id, buyerId, offered_price, offeredPrice, quantity, quantity_unit, message } = req.body;

    const listId = listing_id || listingId;
    const bId = buyer_id || buyerId;
    const price = offered_price || offeredPrice;

    if (!listId) {
      return res.status(400).json({ success: false, message: "Listing ID is required" });
    }
    if (!bId) {
      return res.status(400).json({ success: false, message: "Buyer ID is required" });
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      return res.status(400).json({ success: false, message: "A valid positive offered price is required" });
    }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      return res.status(400).json({ success: false, message: "A valid positive quantity is required" });
    }

    const offer = await createOffer({
      listing_id: listId,
      buyer_id: bId,
      offered_price: Number(price),
      quantity: Number(quantity),
      quantity_unit: quantity_unit || "kg",
      message,
    });

    return res.status(201).json({
      success: true,
      message: "Offer submitted successfully to farmer",
      offer,
    });
  } catch (error: any) {
    console.error("Error creating offer:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
});

// Counter-Offer endpoint
app.post("/api/offers/:id/counter", async (req, res) => {
  try {
    const { 
      actor_id, actorId, 
      actor_role, actorRole, 
      offered_price, offeredPrice, counter_price, counterPrice,
      quantity, counter_quantity, counterQuantity,
      quantity_unit, message 
    } = req.body;
    const userActorId = actor_id || actorId;
    const userActorRole = actor_role || actorRole;
    const price = counter_price ?? counterPrice ?? offered_price ?? offeredPrice;

    if (!userActorId) {
      return res.status(400).json({ success: false, message: "Actor ID is required" });
    }
    if (!userActorRole || !["farmer", "buyer"].includes(userActorRole)) {
      return res.status(400).json({ success: false, message: "Actor role must be 'farmer' or 'buyer'" });
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      return res.status(400).json({ success: false, message: "Valid positive counter price is required" });
    }

    const parentOffer = await getOfferById(req.params.id);
    if (!parentOffer) {
      return res.status(404).json({ success: false, message: "Original offer not found" });
    }

    const qty = counter_quantity ?? counterQuantity ?? quantity ?? parentOffer.quantity;
    if (!qty || isNaN(Number(qty)) || Number(qty) <= 0) {
      return res.status(400).json({ success: false, message: "Valid positive quantity is required" });
    }

    const result = await createCounterOffer({
      parent_offer_id: req.params.id,
      actor_id: userActorId,
      actor_role: userActorRole as "farmer" | "buyer",
      offered_price: Number(price),
      quantity: Number(qty),
      quantity_unit: quantity_unit || parentOffer.quantity_unit,
      message,
    });

    return res.status(201).json({
      success: true,
      message: "Counter-offer submitted successfully",
      offer: result.counterOffer,
      counterOffer: result.counterOffer,
      parentOffer: result.parentOffer,
    });
  } catch (error: any) {
    console.error("Error creating counter-offer:", error);
    return res.status(400).json({ success: false, message: error.message, error: error.message });
  }
});

// Explicit Accept endpoint
app.post("/api/offers/:id/accept", async (req, res) => {
  try {
    const { actor_id, actorId } = req.body;
    const userActorId = actor_id || actorId;
    if (!userActorId) {
      return res.status(400).json({ success: false, message: "Actor ID is required for verification" });
    }
    const result = await updateOfferStatus(req.params.id, "Accepted", userActorId);
    return res.json({
      success: true,
      message: "Offer accepted! Transaction created.",
      offer: result.offer,
      transaction: result.transaction,
      order: result.order,
    });
  } catch (error: any) {
    console.error("Error accepting offer:", error);
    return res.status(400).json({ success: false, message: error.message, error: error.message });
  }
});

// Explicit Reject endpoint
app.post("/api/offers/:id/reject", async (req, res) => {
  try {
    const { actor_id, actorId } = req.body;
    const userActorId = actor_id || actorId;
    if (!userActorId) {
      return res.status(400).json({ success: false, message: "Actor ID is required for verification" });
    }
    const result = await updateOfferStatus(req.params.id, "Rejected", userActorId);
    return res.json({
      success: true,
      message: "Offer rejected.",
      offer: result.offer,
    });
  } catch (error: any) {
    console.error("Error rejecting offer:", error);
    return res.status(400).json({ success: false, message: error.message, error: error.message });
  }
});

app.put("/api/offers/:id", async (req, res) => {
  try {
    const { status, actor_id, actorId } = req.body;
    const userActorId = actor_id || actorId;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required ('Accepted', 'Rejected', 'Countered')" });
    }
    if (!userActorId) {
      return res.status(400).json({ success: false, message: "Actor ID is required for verification" });
    }

    const result = await updateOfferStatus(req.params.id, status, userActorId);
    return res.json({
      success: true,
      message: result.transaction ? "Offer accepted! Transaction created." : `Offer status updated to ${result.offer.status}`,
      offer: result.offer,
      transaction: result.transaction,
      order: result.order,
    });
  } catch (error: any) {
    console.error("Error updating offer:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 7. API: TRANSACTIONS (5-Stage Farmer-Buyer State Flow)
// Accepted -> Payment Pending -> Payment Completed -> Delivery/Pickup -> Completed
// ----------------------------------------------------
app.get("/api/transactions", async (req, res) => {
  try {
    const { farmerId, buyerId, status } = req.query;
    const transactions = await getTransactions({
      farmerId: farmerId as string,
      buyerId: buyerId as string,
      status: status as string,
    });
    return res.json({ success: true, count: transactions.length, transactions });
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/transactions/:id", async (req, res) => {
  try {
    const transaction = await getTransactionById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }
    return res.json({ success: true, transaction });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

const handleUpdateTransactionStatus = async (req: express.Request, res: express.Response) => {
  try {
    const { status, actor_id, actorId } = req.body;
    const userActorId = actor_id || actorId;

    if (!status) {
      return res.status(400).json({ success: false, message: "New status is required" });
    }

    const updated = await updateTransactionStatus(req.params.id, status, userActorId);
    return res.json({
      success: true,
      message: `Transaction state successfully moved to '${status}'`,
      transaction: updated,
    });
  } catch (error: any) {
    console.error("Error updating transaction status:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

app.put("/api/transactions/:id/status", handleUpdateTransactionStatus);
app.patch("/api/transactions/:id/status", handleUpdateTransactionStatus);

// ----------------------------------------------------
// 8. API: PERSISTENT NOTIFICATIONS
// ----------------------------------------------------
app.get("/api/notifications", async (req, res) => {
  try {
    const recipientId = (req.query.recipientId as string) || (req.query.userId as string);
    const notifications = await getNotifications(recipientId);
    const unreadCount = await getUnreadNotificationCount(recipientId);
    return res.json({ success: true, unreadCount, count: notifications.length, notifications });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.patch("/api/notifications/:id/read", async (req, res) => {
  try {
    const recipientId = (req.body.recipientId as string) || (req.query.recipientId as string) || (req.body.userId as string);
    if (!recipientId) {
      return res.status(400).json({ success: false, message: "Recipient ID is required" });
    }
    await markNotificationAsRead(req.params.id, recipientId);
    return res.json({ success: true, message: "Notification marked as read" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/notifications/mark-all-read", async (req, res) => {
  try {
    const recipientId = (req.body.recipientId as string) || (req.body.userId as string);
    if (!recipientId) {
      return res.status(400).json({ success: false, message: "Recipient ID is required" });
    }
    await markAllNotificationsAsRead(recipientId);
    return res.json({ success: true, message: "All notifications marked as read" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 7. API: ORDERS & TRANSACTIONS
// ----------------------------------------------------
app.get("/api/orders", async (req, res) => {
  try {
    const { farmerId, buyerId, status } = req.query;
    const orders = await getOrders({
      farmerId: farmerId as string,
      buyerId: buyerId as string,
      status: status as string,
    });
    return res.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/orders/:id", async (req, res) => {
  const order = await getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  const logistics = await getLogisticsByOrderId(order.id);
  return res.json({ success: true, order: { ...order, logistics } });
});

app.post("/api/orders", async (req, res) => {
  try {
    const { listing_id, farmer_id, buyer_id, offer_id, crop_name, quantity, quantity_unit, agreed_price } = req.body;

    if (!farmer_id || !buyer_id || !crop_name || !quantity || !agreed_price) {
      return res.status(400).json({ success: false, message: "Missing required order fields" });
    }

    const order = await createOrder({
      listing_id,
      farmer_id,
      buyer_id,
      offer_id,
      crop_name,
      quantity: Number(quantity),
      quantity_unit: quantity_unit || "kg",
      agreed_price: Number(agreed_price),
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/orders/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }
    const order = await updateOrderStatus(req.params.id, status);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    return res.json({ success: true, message: `Order marked as ${status}`, order });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 7.1 API: BUYER CART (Persistent PostgreSQL/SQLite)
// ----------------------------------------------------
app.get("/api/cart", async (req, res) => {
  try {
    const buyerId = (req.query.buyerId as string) || (req.query.buyer_id as string);
    if (!buyerId) {
      return res.status(400).json({ success: false, message: "buyerId is required" });
    }
    const { items, summary } = await getCartItems(buyerId);
    return res.json({ success: true, items, summary });
  } catch (error: any) {
    console.error("Error fetching cart:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/cart", async (req, res) => {
  try {
    const {
      buyerId,
      buyer_id,
      listingId,
      listing_id,
      cropName,
      crop_name,
      variety,
      farmerId,
      farmer_id,
      farmerName,
      farmer_name,
      quantity,
      quantityUnit,
      quantity_unit,
      unitPrice,
      unit_price,
      priceUnit,
      price_unit,
      qualityGrade,
      quality_grade,
      location,
    } = req.body;

    const bId = buyerId || buyer_id;
    const cName = cropName || crop_name;
    const fName = farmerName || farmer_name || "Verified Farmer";
    const uPrice = Number(unitPrice ?? unit_price);
    const qty = Number(quantity);

    if (!bId || !cName || isNaN(uPrice) || isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: buyerId, cropName, quantity, and unitPrice are required",
      });
    }

    const item = await addToCart({
      buyerId: bId,
      listingId: listingId || listing_id || null,
      cropName: cName,
      variety: variety || null,
      farmerId: farmerId || farmer_id || null,
      farmerName: fName,
      quantity: qty,
      quantityUnit: quantityUnit || quantity_unit || "kg",
      unitPrice: uPrice,
      priceUnit: priceUnit || price_unit || "Rs/quintal",
      qualityGrade: qualityGrade || quality_grade || "Grade A",
      location: location || null,
    });

    const { summary } = await getCartItems(bId);

    return res.status(201).json({
      success: true,
      message: `${cName} added to cart successfully`,
      item,
      summary,
    });
  } catch (error: any) {
    console.error("Error adding to cart:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/cart/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    if (quantity === undefined || isNaN(Number(quantity))) {
      return res.status(400).json({ success: false, message: "Valid quantity is required" });
    }

    const item = await updateCartItemQuantity(id, Number(quantity));
    return res.json({
      success: true,
      message: item ? "Cart item quantity updated" : "Item removed from cart",
      item,
    });
  } catch (error: any) {
    console.error("Error updating cart item:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/cart/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await removeCartItem(id);
    return res.json({ success: true, message: "Item removed from cart" });
  } catch (error: any) {
    console.error("Error removing cart item:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/cart", async (req, res) => {
  try {
    const buyerId = (req.query.buyerId as string) || (req.query.buyer_id as string);
    if (!buyerId) {
      return res.status(400).json({ success: false, message: "buyerId is required" });
    }
    await clearCart(buyerId);
    return res.json({ success: true, message: "Cart cleared successfully" });
  } catch (error: any) {
    console.error("Error clearing cart:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/cart/checkout", async (req, res) => {
  try {
    const { buyerId, buyer_id, itemIds } = req.body;
    const bId = buyerId || buyer_id;
    if (!bId) {
      return res.status(400).json({ success: false, message: "buyerId is required to checkout" });
    }

    const result = await checkoutCart(bId, itemIds);

    return res.status(201).json({
      success: true,
      message: `Successfully placed ${result.orders.length} order(s)`,
      orders: result.orders,
      transactions: result.transactions,
    });
  } catch (error: any) {
    console.error("Error placing orders from cart:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 8. API: LOGISTICS
// ----------------------------------------------------
app.get("/api/logistics", async (req, res) => {
  try {
    const records = await getAllLogistics();
    return res.json({ success: true, count: records.length, logistics: records });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/logistics/:orderId", async (req, res) => {
  const record = await getLogisticsByOrderId(req.params.orderId);
  if (!record) {
    return res.status(404).json({ success: false, message: "Logistics record not found for this order" });
  }
  return res.json({ success: true, logistics: record });
});

app.post("/api/logistics", async (req, res) => {
  try {
    const { order_id, orderId } = req.body;
    const ordId = order_id || orderId;
    if (!ordId) {
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }
    const logistics = await createOrUpdateLogistics({ ...req.body, order_id: ordId });
    return res.status(201).json({ success: true, message: "Logistics updated", logistics });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/logistics/:orderId", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !["pending", "pickup_scheduled", "in_transit", "delivered"].includes(status)) {
      return res.status(400).json({ success: false, message: "Valid logistics status is required" });
    }
    const updated = await updateLogisticsStatus(req.params.orderId, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Logistics record not found" });
    }
    return res.json({ success: true, message: `Logistics status updated to ${status}`, logistics: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 4. API: /api/chat (AI-Powered Agriculture Chatbot)
// ----------------------------------------------------
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [], language = "en", role = "farmer" } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const langName = LANGUAGE_NAMES[language] || "English";
    const queryLower = message.toLowerCase();

    // Check if query is asking for market price or mentions a commodity
    let realMarketData: any = null;
    let detectedCommodity: string | undefined = undefined;
    let detectedState: string | undefined = undefined;

    // Detect commodity from mapping
    for (const [key, val] of Object.entries(COMMODITY_MAP)) {
      if (queryLower.includes(key)) {
        detectedCommodity = val;
        break;
      }
    }

    // Detect state from mapping
    for (const [key, val] of Object.entries(STATE_MAP)) {
      if (queryLower.includes(key)) {
        detectedState = val;
        break;
      }
    }

    const isPriceQuery =
      queryLower.includes("price") ||
      queryLower.includes("rate") ||
      queryLower.includes("mandi") ||
      queryLower.includes("bhav") ||
      queryLower.includes("cost") ||
      queryLower.includes("highest") ||
      queryLower.includes("lowest") ||
      queryLower.includes("भाव") ||
      queryLower.includes("कीमत") ||
      queryLower.includes("दाम") ||
      queryLower.includes("रेट") ||
      Boolean(detectedCommodity);

    if (isPriceQuery) {
      realMarketData = await fetchRealMandiPrices({
        commodity: detectedCommodity,
        state: detectedState,
        limit: 100,
      });
    }

    const ai = getGeminiClient();

    if (ai) {
      let liveDataContext = "";
      if (realMarketData && realMarketData.success && realMarketData.records.length > 0) {
        const sortedDesc = [...realMarketData.records].sort((a: any, b: any) => Number(b.modal_price) - Number(a.modal_price));
        const highest = sortedDesc[0];
        const lowest = sortedDesc[sortedDesc.length - 1];
        
        let stateSpecific = "";
        if (detectedState) {
          const matched = realMarketData.records.filter((r: any) => r.state && r.state.toLowerCase().includes(detectedState!.toLowerCase()));
          stateSpecific = `Records matching requested state (${detectedState}): ${JSON.stringify(matched.slice(0, 10))}`;
        }

        liveDataContext = `
REAL OFFICIAL MARKET DATA FROM DATA.GOV.IN:
Target Commodity: ${detectedCommodity || "All"}
Target State: ${detectedState || "All"}
Total records found: ${realMarketData.records.length}
Highest price record: ${highest.market} (${highest.state}): ₹${highest.modal_price}/quintal on ${highest.date}
Lowest price record: ${lowest.market} (${lowest.state}): ₹${lowest.modal_price}/quintal on ${lowest.date}
${stateSpecific}
Sample reporting records: ${JSON.stringify(realMarketData.records.slice(0, 8))}
`;
      } else if (isPriceQuery && (!realMarketData || !realMarketData.records || realMarketData.records.length === 0)) {
        liveDataContext = `
CRITICAL: No matching government market data was found for this query in the official data.gov.in feed.
Instruction: You MUST reply: "Sorry, I couldn't find that data in the government market data." Do NOT invent or estimate any price.
`;
      }

      const systemInstruction = `You are the AgriAssistant for Indian farmers.

CRITICAL RESPONSE STYLE RULES:
1. DIRECT & CONCISE FIRST: Always give a DIRECT and CONCISE answer immediately in the very first sentence.
   - User: "What is the tomato price?" -> Give the actual available price directly.
   - User: "Which market has the highest tomato price?" -> Give the market and price directly.
   - User: "What is maize price in Maharashtra?" -> Give the relevant real price/data directly.
2. ABSOLUTE DATA TRUTH: 
   - For market-price questions, use ONLY real data from the official data.gov.in records provided in the context. NEVER invent, estimate, or guess prices.
   - If the requested data is unavailable or not in the context, reply simply:
     "Sorry, I couldn't find that data in the government market data."
3. STRICT PROHIBITIONS:
   - Do NOT add unnecessary introductions (e.g. "Hello", "Welcome", "Here is the price...").
   - Do NOT add long explanations.
   - Do NOT add repeated information.
   - Do NOT add unrelated advice.
   - Do NOT use excessive bullet points.
   - Do NOT add "Would you like to know more?", "Feel free to ask", or similar endings.
4. AGRONOMY & FARMING:
   - If asked an agronomy or farming question, answer directly in 1-3 short, clear sentences.
5. LANGUAGE: Respond in ${langName}. If Hindi or regional language, keep the exact same direct, concise, simple tone without fluff.

${liveDataContext}`;

      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
      const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
      for (const turn of recentHistory) {
        if (turn.sender === "user" && turn.text) {
          contents.push({ role: "user", parts: [{ text: turn.text }] });
        } else if (turn.sender === "bot" && turn.text) {
          contents.push({ role: "model", parts: [{ text: turn.text }] });
        }
      }

      contents.push({
        role: "user",
        parts: [{ text: message }],
      });

      let aiResponseText: string | null = null;
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.5,
          },
        });

        if (response && response.text) {
          aiResponseText = response.text;
        }
      } catch (_aiError) {
        // Fall back cleanly to the domain knowledge engine without logging error traces to stderr
      }

      if (aiResponseText) {
        return res.json({
          reply: aiResponseText,
          source: realMarketData?.success
            ? "data.gov.in (Official OGD Platform) + gemini-3.8-flash"
            : "gemini-3.8-flash",
          language: language,
          realDataStatus: realMarketData?.status || "general_knowledge",
        });
      }
    }

    // Offline / Knowledge Engine Fallback
    const fallbackText = getOfflineAgricultureResponse(
      message,
      language,
      role,
      realMarketData
    );
    return res.json({
      reply: fallbackText,
      source: realMarketData?.success
        ? "data.gov.in (Official OGD Platform)"
        : "agrilink-knowledge-engine",
      language: language,
      realDataStatus: realMarketData?.status || "general_knowledge",
    });
  } catch (_error) {
    const fallbackText = getOfflineAgricultureResponse(
      req.body?.message || "",
      req.body?.language || "en",
      req.body?.role || "farmer"
    );
    return res.json({
      reply: fallbackText,
      source: "agrilink-knowledge-engine",
      language: req.body?.language || "en",
      realDataStatus: "general_knowledge",
    });
  }
});

// ----------------------------------------------------
// 5. Other Structured Endpoints (Crop production, weather, soil)
// ----------------------------------------------------
app.get("/api/crop-production", async (req, res) => {
  const { crop, year, state } = req.query;
  res.json({
    status: "api_ready",
    endpoint: "/api/crop-production",
    source: "Directorate of Economics & Statistics / DAC&FW (desagri.gov.in)",
    query: { crop, year, state },
    message:
      "Crop production statistics endpoint is structured and ready for official government statistics API.",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/weather", async (req, res) => {
  const { lat, lon, district, state } = req.query;
  res.json({
    status: "api_ready",
    endpoint: "/api/weather",
    source: "India Meteorological Department (IMD) / Agromet Advisory (mausam.imd.gov.in)",
    query: { lat, lon, district, state },
    message:
      "Weather endpoint is structured and ready for IMD / Agromet weather API integration.",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/soil", async (req, res) => {
  const { district, state, soilType } = req.query;
  res.json({
    status: "api_ready",
    endpoint: "/api/soil",
    source: "Soil Health Card Portal / ICAR Soil Survey (soilhealth.dac.gov.in)",
    query: { district, state, soilType },
    message:
      "Soil analysis endpoint is structured and ready for Soil Health Card API integration.",
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get("/api/health", async (req, res) => {
  res.json({
    status: "ok",
    appName: "AgriLink",
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasDataGovKey: !!(process.env.DATA_GOV_API_KEY || process.env.OGD_API_KEY),
    officialDataset: DATA_GOV_CATALOG_URL,
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------------------------------
// Vite Middleware / Static Asset Serving
// ----------------------------------------------------
async function startServer() {
  try {
    // Connect to Postgres (Supabase) and verify connectivity
    await getDb();
    console.log("🌾 Connected to Supabase Postgres database successfully.");
  } catch (dbErr) {
    console.error("Failed to connect to Supabase Postgres database:", dbErr);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", async (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌾 AgriLink server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
