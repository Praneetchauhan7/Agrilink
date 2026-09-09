const QUALITY_ORDER = ['grade c', 'grade b', 'grade a', 'premium'];

const normalize = (value) => (value || '').toString().toLowerCase().trim();

export function computeDemandMatch(demand, farmerListings) {
  const demandCrop = normalize(demand.produce);
  const activeListings = (farmerListings || []).filter((listing) => normalize(listing.status) === 'active');
  const matchingListings = activeListings.filter((listing) => normalize(listing.produce) === demandCrop);

  if (matchingListings.length === 0) {
    return {
      score: 0,
      hasListing: false,
      factors: [
        { label: 'Produce Match', matched: false },
        { label: 'Quantity Match', matched: false },
        { label: 'Quality Match', matched: false },
        { label: 'Price Match', matched: false },
        { label: 'Location Match', matched: false },
      ],
    };
  }

  const listing = matchingListings.reduce(
    (best, current) => ((current.quantity || 0) > (best?.quantity || 0) ? current : best),
    matchingListings[0]
  );

  const requiredQty = demand.quantity || demand.requiredQuantity || demand.quantityRequired || 0;
  const qtyRatio = requiredQty > 0 ? Math.min((listing.quantity || 0) / requiredQty, 1) : 1;
  const qtyPoints = 15 * qtyRatio;
  const qtyMatched = qtyRatio >= 0.9;

  const farmerQualityIdx = QUALITY_ORDER.indexOf(normalize(listing.quality));
  const demandQualityIdx = QUALITY_ORDER.indexOf(normalize(demand.quality));
  const qualityKnown = farmerQualityIdx >= 0 && demandQualityIdx >= 0;
  const qualityMatched = qualityKnown && farmerQualityIdx >= demandQualityIdx;
  const qualityPoints = qualityMatched ? 15 : qualityKnown ? 7 : 5;

  const targetPrice = demand.targetPrice || demand.target_price || 0;
  const farmerPrice = listing.expectedPrice || 0;
  let pricePoints = 5;
  let priceMatched = false;
  if (targetPrice > 0 && farmerPrice > 0) {
    const diffRatio = (farmerPrice - targetPrice) / targetPrice;
    if (diffRatio <= 0.15) {
      pricePoints = 15;
      priceMatched = true;
    } else if (diffRatio <= 0.3) {
      pricePoints = 8;
    } else {
      pricePoints = 3;
    }
  }

  const demandParts = normalize(demand.location).split(',').map((part) => part.trim());
  const farmerParts = normalize(listing.location).split(',').map((part) => part.trim());
  let locationPoints = 3;
  let locationMatched = false;
  if (demandParts[0] && farmerParts[0] && demandParts[0] === farmerParts[0]) {
    locationPoints = 15;
    locationMatched = true;
  } else if (demandParts[1] && farmerParts[1] && demandParts[1] === farmerParts[1]) {
    locationPoints = 8;
    locationMatched = true;
  }

  return {
    score: Math.min(100, Math.round(40 + qtyPoints + qualityPoints + pricePoints + locationPoints)),
    hasListing: true,
    factors: [
      { label: 'Produce Match', matched: true },
      { label: 'Quantity Match', matched: qtyMatched },
      { label: 'Quality Match', matched: qualityMatched },
      { label: 'Price Match', matched: priceMatched },
      { label: 'Location Match', matched: locationMatched },
    ],
  };
}
