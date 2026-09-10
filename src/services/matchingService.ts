import { INDIAN_LOCATIONS } from "../constants/locations.js";
import type { ProduceListingRecord } from "../db/queries";

export interface MandiMatch {
  id: string;
  name: string;
  state: string;
  district: string;
  accepted_crops: string[];
  match_score: number;
  match_reasons: string[];
}

const DEFAULT_CROPS = ["tomato", "onion", "potato", "wheat", "rice", "grape"];

const CROP_HINTS: Record<string, string[]> = {
  tomato: ["tomato"],
  onion: ["onion"],
  potato: ["potato"],
  wheat: ["grain", "wheat", "rice", "basmati", "anaj"],
  rice: ["grain", "rice", "basmati", "anaj"],
  grape: ["grape"],
  garlic: ["garlic"],
  chilli: ["chilli", "mirchi"],
  turmeric: ["turmeric"],
  groundnut: ["groundnut"],
  coriander: ["coriander"],
  cotton: ["cotton"],
  maize: ["maize"],
  banana: ["banana"],
  coconut: ["coconut"],
};

function normalize(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

function getAcceptedCrops(marketName: string): string[] {
  const market = normalize(marketName);
  const hintedCrops = Object.entries(CROP_HINTS)
    .filter(([, hints]) => hints.some((hint) => market.includes(hint)))
    .map(([crop]) => crop);

  return hintedCrops.length > 0 ? hintedCrops : DEFAULT_CROPS;
}

function buildMandiDirectory() {
  return INDIAN_LOCATIONS.flatMap((stateLocation) =>
    stateLocation.districts.flatMap((districtLocation) =>
      districtLocation.markets.map((marketName, index) => ({
        id: `mandi-${stateLocation.state.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${districtLocation.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index + 1}`,
        name: marketName,
        state: stateLocation.state,
        district: districtLocation.name,
        accepted_crops: getAcceptedCrops(marketName),
      }))
    )
  );
}

export function findMatchingMandiHouses(product: ProduceListingRecord): MandiMatch[] {
  const crop = normalize(product.crop_name);
  const state = normalize(product.state);
  const district = normalize(product.district);
  const marketLocation = normalize(product.market_location);
  const quantity = Number(product.quantity) || 0;

  return buildMandiDirectory()
    .map((mandi) => {
      const scoreParts: number[] = [];
      const reasons: string[] = [];
      const cropMatched = mandi.accepted_crops.some((acceptedCrop) => crop.includes(acceptedCrop) || acceptedCrop.includes(crop));

      if (cropMatched) {
        scoreParts.push(45);
        reasons.push("Crop accepted");
      }
      if (state && normalize(mandi.state) === state) {
        scoreParts.push(20);
        reasons.push("Same state");
      }
      if (district && normalize(mandi.district) === district) {
        scoreParts.push(20);
        reasons.push("Same district");
      }
      if (marketLocation && (marketLocation.includes(normalize(mandi.name)) || normalize(mandi.name).includes(marketLocation))) {
        scoreParts.push(10);
        reasons.push("Preferred mandi");
      }
      if (quantity > 0) {
        scoreParts.push(5);
        reasons.push(`Quantity available: ${quantity} ${product.quantity_unit}`);
      }

      return {
        ...mandi,
        match_score: Math.min(scoreParts.reduce((total, part) => total + part, 0), 100),
        match_reasons: reasons,
      };
    })
    .filter((mandi) => mandi.match_score > 0)
    .sort((left, right) => right.match_score - left.match_score || left.name.localeCompare(right.name))
    .slice(0, 12);
}