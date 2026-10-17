import type { MissionItem } from "../types";

export type GameState =
  | "ordering"
  | "croissant_unavailable"
  | "alternative_requested"
  | "alternative_revealed"
  | "prices_revealed"
  | "payment"
  | "completed";

export type MissionHint = {
  guidance: string;
  words?: string[];
};

export type LearnerView = {
  eyebrow: string;
  title: string;
  information?: string[];
  task: string;
  usefulWords?: string[];
  hint?: MissionHint;
};

export type InstructorView = {
  eyebrow: string;
  title: string;
  privateInfo: string[];
  instruction: string;
  guidance?: string;
  gateLabel?: string;
};

const prices = {
  coffee: 3,
  croissant: 2.5,
  water: 2,
  painAuChocolat: 2,
} as const;

const budget = 10;
const alternativeTotal = prices.painAuChocolat * 2;
const total = prices.coffee + alternativeTotal + prices.water;
const euro = (amount: number) => `${amount.toString().replace(".", ",")} €`;

const items: MissionItem[] = [
  { emoji: "☕", label: "coffee", quantity: 1 },
  { emoji: "🥐", label: "croissants", quantity: 2 },
  { emoji: "💧", label: "water", quantity: 1 },
];

const knownPrices = [
  `Coffee: ${euro(prices.coffee)}`,
  `Pain au chocolat: ${euro(prices.painAuChocolat)} each`,
  `Water: ${euro(prices.water)}`,
];

export const cafeMission = {
  id: "cafe-a1",
  level: "A1",
  duration: "5–10 min",
  title: "Breakfast in Paris",
  context: "You're visiting Paris and enter a cafe for breakfast.",
  budget,
  items,
  learnerCompletion: {
    title: "Breakfast sorted.",
    description: "You handled a real-life cafe situation in French.",
  },
  nativeCompletion: {
    title: "Mission complete.",
    description: "You guided the customer through the cafe conversation.",
  },
} as const;

export const missionBriefing = {
  imageUrl:
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1600&q=85",
  learner: {
    title: "Breakfast in Paris",
    context: "You're visiting Paris and enter a cafe for breakfast.",
    role: "Customer",
    goal: "Buy breakfast, handle unexpected problems, and stay within €10.",
  },
  instructor: {
    title: "Run the Cafe",
    context: "You're a cafe employee serving a visiting customer.",
    role: "Cafe employee",
    goal: "Guide a natural French conversation following the game's events.",
    rules: [
      "No scripted dialogue; communicate meaning freely.",
      "Only the Speaker confirms completion and advances the mission.",
    ],
  },
} as const;

export const stateStep: Record<GameState, number> = {
  ordering: 1,
  croissant_unavailable: 2,
  alternative_requested: 3,
  alternative_revealed: 4,
  prices_revealed: 5,
  payment: 6,
  completed: 6,
};

export const learnerViews: Record<GameState, LearnerView> = {
  ordering: {
    eyebrow: "YOUR TURN",
    title: "Place your breakfast order.",
    information: items.map(
      (item) => `${item.quantity} ${item.label}`,
    ).concat([`Budget: ${euro(budget)}`]),
    task: "Order the breakfast you want.",
    usefulWords: ["un café", "deux", "s'il vous plaît"],
    hint: {
      guidance: "Say what you would like and how many you want.",
      words: ["je voudrais", "un", "deux"],
    },
  },
  croissant_unavailable: {
    eyebrow: "YOUR TURN",
    title: "Choose how to continue.",
    information: ["Croissants are unavailable."],
    task: "Ask for another breakfast option.",
  },
  alternative_requested: {
    eyebrow: "YOUR TURN",
    title: "Ask about the alternative.",
    task: "Ask how much the alternative costs.",
    usefulWords: ["combien", "coûter"],
  },
  alternative_revealed: {
    eyebrow: "NEW INFORMATION",
    title: "Ask about the other prices.",
    information: [
      `Pain au chocolat: ${euro(prices.painAuChocolat)} each`,
    ],
    task: "Ask how much the coffee and water cost.",
    usefulWords: ["combien", "coûter", "le café", "l'eau"],
    hint: {
      guidance: "Ask how much the coffee and water cost.",
      words: ["combien", "ça coûte", "le café", "l'eau"],
    },
  },
  prices_revealed: {
    eyebrow: "YOUR DECISION",
    title: "Choose your breakfast.",
    information: [...knownPrices, `Your budget: ${euro(budget)}`],
    task: "Choose what to buy and tell the employee.",
    usefulWords: ["je prends", "combien", "en tout"],
  },
  payment: {
    eyebrow: "FINISH THE PURCHASE",
    title: "Complete your purchase.",
    task: "Pay for your order and end the conversation politely.",
    usefulWords: ["payer", "par carte", "en espèces", "merci"],
  },
  completed: {
    eyebrow: "MISSION COMPLETE",
    title: "Breakfast in Paris is complete.",
    information: [`Order total: ${euro(total)}`],
    task: "Finish the conversation politely.",
  },
};

export const instructorViews: Record<GameState, InstructorView> = {
  ordering: {
    eyebrow: "YOUR ACTION",
    title: "Take the customer's order.",
    privateInfo: [
      `Coffee: ${euro(prices.coffee)}`,
      `Croissant: ${euro(prices.croissant)}`,
      `Water: ${euro(prices.water)}`,
    ],
    instruction: "Greet the customer and take their order.",
    guidance:
      "Ask what they would like and how many of each item. Share prices if asked; do not mention the stock issue.",
    gateLabel: "The customer has clearly placed an order",
  },
  croissant_unavailable: {
    eyebrow: "YOUR ACTION",
    title: "Explain the stock problem.",
    privateInfo: [
      "Croissants are unavailable.",
      "Do not suggest an alternative until the customer asks.",
    ],
    instruction: "Explain that croissants are unavailable.",
    guidance:
      "Wait for the customer to ask for another option. Do not suggest one before they ask.",
    gateLabel: "The customer has asked for another option",
  },
  alternative_requested: {
    eyebrow: "YOUR ACTION",
    title: "Offer pain au chocolat.",
    privateInfo: [
      "Pain au chocolat is available.",
      `Price: ${euro(prices.painAuChocolat)} each.`,
      "Share the price only if the customer asks.",
    ],
    instruction: "Offer pain au chocolat.",
    guidance:
      "Offer it and ask if they would like it. Share its €2 each price only if asked.",
    gateLabel: "The customer has responded to the alternative",
  },
  alternative_revealed: {
    eyebrow: "YOUR ACTION",
    title: "Answer the customer's price questions.",
    privateInfo: [
      `Coffee: ${euro(prices.coffee)}`,
      `Pain au chocolat: ${euro(prices.painAuChocolat)} each`,
      `Water: ${euro(prices.water)}`,
    ],
    instruction: "Answer the customer's questions about prices.",
    guidance:
      "Share the coffee (€3) and water (€2) prices. Answer only what the customer asks.",
    gateLabel: "The customer has the prices they need",
  },
  prices_revealed: {
    eyebrow: "YOUR ACTION",
    title: "Confirm the customer's choice.",
    privateInfo: [
      ...knownPrices,
      `Budget: ${euro(budget)}`,
    ],
    instruction: "Help the customer choose and confirm their order.",
    guidance:
      "Ask what they want to buy and in what quantities. Check the total stays within their €10 budget.",
    gateLabel: "The customer has chosen and confirmed their order",
  },
  payment: {
    eyebrow: "YOUR ACTION",
    title: "Complete the payment.",
    privateInfo: [
      `Expected total: ${euro(total)}`,
      "Payment can be by card or cash.",
    ],
    instruction: "Finish the payment and close the conversation.",
    guidance:
      "State the agreed total, ask how the customer would like to pay, and end the conversation naturally.",
    gateLabel: "The customer has completed the purchase",
  },
  completed: {
    eyebrow: "MISSION COMPLETE",
    title: "Breakfast in Paris is complete.",
    privateInfo: [],
    instruction: "Congratulate the customer and close the conversation.",
    guidance: "Confirm the purchase is complete and end the interaction warmly.",
  },
};

export const nextGameState: Partial<Record<GameState, GameState>> = {
  ordering: "croissant_unavailable",
  croissant_unavailable: "alternative_requested",
  alternative_requested: "alternative_revealed",
  alternative_revealed: "prices_revealed",
  prices_revealed: "payment",
  payment: "completed",
};
