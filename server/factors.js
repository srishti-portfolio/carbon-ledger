// factors.js — authoritative emission data + computation (single source of truth).
// Figures are mid-range estimates (DEFRA/BEIS 2023, IPCC, Our World in Data).

export const GLOBAL = { grid: 0.48, avg: 4.7 };

// name -> [grid kgCO2e/kWh, avg tonnes/person/yr] for ~70 major countries.
export const COUNTRY_DATA = {
  Afghanistan: [0.16, 0.3], Albania: [0.02, 1.7], Algeria: [0.49, 3.9], Argentina: [0.31, 3.7],
  Australia: [0.55, 15.0], Austria: [0.11, 7.0], Bangladesh: [0.55, 0.6], Belgium: [0.14, 7.7],
  Brazil: [0.10, 2.2], Bulgaria: [0.45, 5.9], Canada: [0.13, 14.0], Chile: [0.32, 4.6],
  China: [0.58, 8.0], Colombia: [0.16, 1.8], "Costa Rica": [0.04, 1.6], Croatia: [0.20, 4.4],
  Czechia: [0.41, 8.9], Denmark: [0.18, 4.5], Egypt: [0.45, 2.4], Ethiopia: [0.03, 0.15],
  Finland: [0.07, 6.8], France: [0.06, 4.7], Germany: [0.38, 8.0], Ghana: [0.30, 0.6],
  Greece: [0.33, 5.5], Hungary: [0.22, 4.6], Iceland: [0.028, 9.0], India: [0.71, 2.0],
  Indonesia: [0.62, 2.3], Iran: [0.47, 8.2], Iraq: [0.60, 4.7], Ireland: [0.29, 7.0],
  Israel: [0.55, 6.0], Italy: [0.30, 5.6], Japan: [0.49, 8.5], Kazakhstan: [0.55, 14.0],
  Kenya: [0.10, 0.4], Kuwait: [0.60, 25.0], Malaysia: [0.55, 8.0], Mexico: [0.42, 3.6],
  Morocco: [0.61, 1.9], Netherlands: [0.27, 8.0], "New Zealand": [0.10, 7.0], Nigeria: [0.43, 0.6],
  Norway: [0.03, 7.5], Pakistan: [0.41, 0.9], Peru: [0.25, 1.8], Philippines: [0.61, 1.3],
  Poland: [0.66, 8.0], Portugal: [0.19, 4.3], Qatar: [0.49, 35.0], Romania: [0.30, 3.9],
  Russia: [0.36, 11.0], "Saudi Arabia": [0.60, 18.0], Singapore: [0.40, 8.5], Slovakia: [0.14, 5.9],
  "South Africa": [0.91, 7.0], "South Korea": [0.44, 11.6], Spain: [0.19, 5.2], "Sri Lanka": [0.45, 1.0],
  Sweden: [0.04, 3.6], Switzerland: [0.05, 4.0], Taiwan: [0.50, 11.0], Thailand: [0.50, 3.7],
  Turkey: [0.44, 5.3], Ukraine: [0.30, 3.6], "United Arab Emirates": [0.40, 20.0],
  "United Kingdom": [0.21, 5.0], "United States": [0.37, 14.9], Vietnam: [0.45, 3.5],
};

export const COUNTRIES = ["Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo (Brazzaville)","Congo (Kinshasa)","Costa Rica","Côte d'Ivoire","Croatia","Cuba","Cyprus","Czechia","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"];

const REGION_SET = new Set([...COUNTRIES, "Global average"]);
export const isValidRegion = (name) => REGION_SET.has(name);
export function regionInfo(name) {
  if (!name || name === "Global average") return { label: "Global average", grid: GLOBAL.grid, avg: GLOBAL.avg };
  const d = COUNTRY_DATA[name];
  return d ? { label: name, grid: d[0], avg: d[1] } : { label: name, grid: GLOBAL.grid, avg: GLOBAL.avg };
}

export const PARIS_ANNUAL = 2300;
export const PARIS_DAILY = PARIS_ANNUAL / 365;

// items carry `factor` (kg per unit) OR `kw` (appliances: kg = hours × kw × grid).
// `factor: null` on electricity means "use the region grid factor".
export const CATEGORIES = {
  transport: {
    label: "Transport", color: "#2A9D8F", icon: "Car",
    tip: "Short car trips are the easiest to swap — transit, cycling, or carpooling for a few each week compounds quickly.",
    items: {
      car_petrol: { label: "Car · petrol", unit: "km", factor: 0.17, icon: "Car" },
      car_ev: { label: "Car · electric", unit: "km", factor: 0.05, icon: "Car" },
      motorbike: { label: "Motorbike", unit: "km", factor: 0.10, icon: "Bike" },
      bus: { label: "Bus", unit: "km", factor: 0.10, icon: "Bus" },
      train: { label: "Train / Metro", unit: "km", factor: 0.035, icon: "Train" },
      flight: { label: "Flight", unit: "km", factor: 0.18, icon: "Plane" },
    },
  },
  home: {
    label: "Home energy", color: "#E8A33D", icon: "Home",
    tip: "Efficient appliances, LED lighting, and a cleaner electricity source cut this fastest.",
    items: {
      electricity: { label: "Electricity", unit: "kWh", factor: null, icon: "Zap" },
      lpg: { label: "Cooking gas · LPG", unit: "kg", factor: 2.98, icon: "Wind" },
      gas: { label: "Natural gas", unit: "kWh", factor: 0.184, icon: "Wind" },
    },
  },
  food: {
    label: "Food", color: "#6FA85B", icon: "UtensilsCrossed",
    tip: "Shifting a couple of red-meat meals a week to poultry or plant-based has outsized impact for little effort.",
    items: {
      beef: { label: "Red-meat meal", unit: "meal", factor: 6.6, icon: "Beef" },
      chicken: { label: "Poultry meal", unit: "meal", factor: 1.8, icon: "UtensilsCrossed" },
      fish: { label: "Fish meal", unit: "meal", factor: 1.6, icon: "UtensilsCrossed" },
      veg: { label: "Vegetarian meal", unit: "meal", factor: 1.2, icon: "Leaf" },
      vegan: { label: "Vegan meal", unit: "meal", factor: 0.9, icon: "Leaf" },
    },
  },
  shopping: {
    label: "Shopping", color: "#8B6FC9", icon: "ShoppingBag",
    tip: "Buying less, choosing second-hand, and keeping things longer shrinks the embodied emissions you carry.",
    items: {
      clothing: { label: "New clothing item", unit: "item", factor: 15, icon: "ShoppingBag" },
      electronics: { label: "Small electronics", unit: "item", factor: 100, icon: "ShoppingBag" },
    },
  },
  appliances: {
    label: "Appliances", color: "#3E6CB5", icon: "AirVent",
    tip: "Cooling, heating, and water heating dominate appliance energy — run them for less time, at efficient settings, and on a cleaner electricity source.",
    items: {
      ac: { label: "Air conditioner", unit: "hours", kw: 1.2, icon: "AirVent" },
      heater: { label: "Space heater", unit: "hours", kw: 1.5, icon: "Flame" },
      geyser: { label: "Water heater / geyser", unit: "hours", kw: 2.0, icon: "Thermometer" },
      fridge: { label: "Refrigerator", unit: "hours", kw: 0.15, icon: "Snowflake" },
      washer: { label: "Washing machine", unit: "hours", kw: 0.5, icon: "Droplets" },
      dryer: { label: "Clothes dryer", unit: "hours", kw: 2.5, icon: "Wind" },
      dishwasher: { label: "Dishwasher", unit: "hours", kw: 1.2, icon: "Droplets" },
      microwave: { label: "Microwave", unit: "hours", kw: 1.0, icon: "Microwave" },
      kettle: { label: "Electric kettle", unit: "hours", kw: 1.8, icon: "Coffee" },
      iron: { label: "Iron", unit: "hours", kw: 1.1, icon: "Shirt" },
      fan: { label: "Ceiling fan", unit: "hours", kw: 0.075, icon: "Fan" },
      tv: { label: "Television", unit: "hours", kw: 0.1, icon: "Tv" },
      computer: { label: "Computer", unit: "hours", kw: 0.15, icon: "Monitor" },
      lighting: { label: "Lighting", unit: "hours", kw: 0.06, icon: "Lightbulb" },
      ev: { label: "EV charging", unit: "hours", kw: 7.0, icon: "BatteryCharging" },
    },
  },
};

export const ACTIONS = [
  { id: "transit", label: "Swap 2 weekly car trips for transit or cycling", saving: 300, icon: "Bus", cat: "transport" },
  { id: "redmeat", label: "Keep red meat to once a week", saving: 350, icon: "Beef", cat: "food" },
  { id: "ac", label: "Run heating or AC 1°C more efficiently", saving: 220, icon: "Wind", cat: "home" },
  { id: "led", label: "Switch every bulb to LED", saving: 90, icon: "Lightbulb", cat: "home" },
  { id: "airdry", label: "Air-dry laundry instead of machine drying", saving: 130, icon: "Wind", cat: "home" },
  { id: "solar", label: "Move to renewable or rooftop-solar electricity", saving: 900, icon: "Zap", cat: "home" },
  { id: "foodwaste", label: "Halve household food waste", saving: 260, icon: "UtensilsCrossed", cat: "food" },
  { id: "flight", label: "Take one fewer short flight this year", saving: 250, icon: "Plane", cat: "transport" },
  { id: "efficientac", label: "Run AC and heating at efficient settings", saving: 230, icon: "AirVent", cat: "appliances" },
  { id: "standby", label: "Cut standby power on idle electronics", saving: 80, icon: "Tv", cat: "appliances" },
];
export const ACTION_IDS = new Set(ACTIONS.map((a) => a.id));

/** Validate inputs and compute CO2e for one activity. Throws on bad input. */
export function computeCo2e({ category, item, amount, region }) {
  const cat = CATEGORIES[category];
  if (!cat) throw new Error(`Unknown category: ${category}`);
  const it = cat.items[item];
  if (!it) throw new Error(`Unknown item: ${item}`);
  if (!isValidRegion(region)) throw new Error(`Unknown region: ${region}`);
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) throw new Error("Amount must be a positive number");

  const grid = regionInfo(region).grid;
  let factor;
  if (category === "home" && item === "electricity") factor = grid;
  else if (category === "appliances") factor = it.kw * grid;
  else factor = it.factor;
  return Math.round(amt * factor * 100) / 100;
}

/** Everything the client needs to render the UI. */
export function catalog() {
  return { countries: COUNTRIES, countryData: COUNTRY_DATA, global: GLOBAL, categories: CATEGORIES, actions: ACTIONS, paris: { annual: PARIS_ANNUAL, daily: PARIS_DAILY } };
}