/**
 * Words for Discover (docs/SCREENS.md "Discover"): the five pages and the FAQ. Plain, short, campus-specific.
 * Every fee, limit and time is read from lib/config.ts and data/locations.ts, so the FAQ can never disagree
 * with what the app actually does.
 */
import { BUILDINGS } from "@/data/locations";
import {
  FEES,
  GRACE_MIN,
  MAX_ACTIVE_RUNS,
  PICKUP_STALE_MIN,
  RUNNER_EARN,
  TOPUP_MAX,
  TOPUP_MIN,
  WALLET_MIN_TO_USE,
  WALLET_SUGGESTED,
} from "@/lib/config";
import { formatRupees } from "@/lib/format";

export const DISCOVER_TOPICS = ["introduction", "help", "smart-vending", "feedback", "faq"] as const;
export type DiscoverTopic = (typeof DISCOVER_TOPICS)[number];

export function isDiscoverTopic(value: string): value is DiscoverTopic {
  return (DISCOVER_TOPICS as readonly string[]).includes(value);
}

/** "AG, GICT, SAS and AMSOM" */
export function joinList(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

const near = joinList(BUILDINGS.filter((b) => b.zone === "near").map((b) => b.short));
const far = joinList(BUILDINGS.filter((b) => b.zone === "far").map((b) => b.short));
const everyBuilding = joinList(BUILDINGS.map((b) => b.short));

export const DISCOVER_COPY = {
  title: "Discover",
  intro: "How QuickX works, in a minute.",
  rows: {
    introduction: { title: "Introduction", blurb: "What QuickX is and who it is for" },
    help: { title: "Help", blurb: "How to order, pick up and get a delivery" },
    "smart-vending": { title: "Smart Vending", blurb: "How paying for the vending machine works" },
    feedback: { title: "Feedback", blurb: "Tell the team how it went" },
    faq: { title: "FAQ", blurb: "Fees, wallet, late orders, runners and refunds" },
  } satisfies Record<DiscoverTopic, { title: string; blurb: string }>,

  introduction: {
    paragraphs: [
      "QuickX gets food from UC into your hands during your break. Pick a cafe or the vending machine, pay from your wallet, and either collect it at UC or have it brought to your building.",
      `Order from Truly Indian, Global Bistro, Cafe Delice, Greens and Grains or the UC vending machine. The food is made before you walk over. A student already walking from UC to ${everyBuilding} can carry it to your drop point and earn a little for it.`,
      "QuickX is a prototype from Team GapBite. The payments are pretend: top-ups use a mock UPI step and no real money moves.",
    ],
  },

  help: {
    sections: [
      {
        title: "How to order",
        steps: [
          "Open a place from Home and add what you want. One place per order.",
          "At checkout choose pickup at UC or delivery to your building, and as soon as possible or a break.",
          `Pay from your wallet. You need at least ${formatRupees(WALLET_MIN_TO_USE)} in it, and at least the order total.`,
        ],
      },
      {
        title: "How pickup works",
        steps: [
          "The cafe accepts your order and makes it. You see each step on the order page.",
          "When it says Ready, go to the cafe counter and show your 4-digit code. For the vending machine, type the code on its keypad.",
        ],
      },
      {
        title: "How delivery works",
        steps: [
          `A runner buddy or QuickX staff takes your bag to the drop point at your building (${everyBuilding}). The order page shows which one and where.`,
          "When they tap I'm here you get an Update. Show them your 4-digit code. Only hand it over when the bag is in your hands.",
          `Delivery costs ${formatRupees(FEES.near)} to ${near} and ${formatRupees(FEES.far)} to ${far}. Pickup is free.`,
        ],
      },
      {
        title: "Where is my order?",
        steps: ["Orders shows everything in progress, with a countdown to the promised time. Updates lists what has happened, newest first."],
      },
    ],
  },

  smartVending: {
    steps: [
      "Open the UC Vending Machine in QuickX. You see what is in stock right now.",
      "Add what you want and pay from your wallet. There is no delivery fee for pickup.",
      "The cafe desk confirms the order and you get a 4-digit code.",
      "Type the code on the machine's keypad at UC. The slots with your items open.",
    ],
    note: "If the cafe cannot fill an order, it is cancelled and the money goes back to your wallet.",
    open: "Open vending",
  },

  faq: {
    items: [
      {
        id: "fees",
        question: "What does delivery cost?",
        answer: [
          `Pickup at UC is free. Delivery adds ${formatRupees(FEES.near)} to ${near}, and ${formatRupees(FEES.far)} to ${far}, on top of the food.`,
          "You see the exact total before you pay. The fee is the same whoever ends up carrying your bag.",
        ],
      },
      {
        id: "wallet",
        question: "How much do I need in my wallet?",
        answer: [
          `At least ${formatRupees(WALLET_MIN_TO_USE)} to place an order, and at least the order total. We suggest keeping ${formatRupees(WALLET_SUGGESTED)} so orders never get stuck. After you pay, your balance can drop below ${formatRupees(WALLET_MIN_TO_USE)}.`,
          `Top up from the Wallet page with the mock UPI step, ${formatRupees(TOPUP_MIN)} to ${formatRupees(TOPUP_MAX)} at a time. No real money is used.`,
        ],
      },
      {
        id: "late",
        question: "What if my order is late?",
        answer: [
          `Every delivery has a promised time and ${GRACE_MIN} minutes of grace. At the promised time the order shows Due now. If it has still not reached you ${GRACE_MIN} minutes later, it fails and you get a full refund, food and fee, back in your wallet.`,
          "Pickup orders never fail by themselves.",
        ],
      },
      {
        id: "no-show",
        question: "What if I am not there when my runner arrives?",
        answer: [
          `If your runner tapped I'm here on time and you did not come, it counts as a missed delivery. You are not refunded, and the bag waits at the cafe counter for ${PICKUP_STALE_MIN} minutes. Show the same 4-digit code there to collect it.`,
          "If the runner was late, it is a late delivery instead, and you are refunded.",
        ],
      },
      {
        id: "runners",
        question: "How do runner buddies earn?",
        answer: [
          `A student with at least ${formatRupees(WALLET_MIN_TO_USE)} in their wallet can scan a Ready delivery bag at UC and carry it, up to ${MAX_ACTIVE_RUNS} at a time.`,
          `When the buyer's 4-digit code is entered, the runner earns ${formatRupees(RUNNER_EARN.near)} for ${near} or ${formatRupees(RUNNER_EARN.far)} for ${far}, in their wallet.`,
          "If a run is late, the full order total comes out of the runner's wallet and they keep the food. QuickX staff can carry bags too, and earn nothing.",
        ],
      },
      {
        id: "refunds",
        question: "How do refunds work?",
        answer: [
          "You can cancel until the cafe accepts your order and get everything back. If the cafe cannot make it, you get everything back and are told why. A late delivery is refunded in full.",
          "Refunds go straight to your wallet. Account › Refund Status lists them.",
        ],
      },
      {
        id: "code",
        question: "What is the 4-digit code?",
        answer: [
          "It shows the bag is yours. Show it to your runner or the cafe counter, or type it on the vending machine. Only you can see it, so do not send it to anyone.",
        ],
      },
    ],
  },
} as const;
