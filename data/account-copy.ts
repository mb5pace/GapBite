/**
 * Words for Account (docs/SCREENS.md "Account"). Plain, short, campus-specific. Numbers come from lib/config.ts,
 * never typed here.
 */
import { FEEDBACK_TEXT_MAX, FIRST_NAME_MAX, FIRST_NAME_MIN, PICKUP_STALE_MIN, WALLET_MIN_TO_USE } from "@/lib/config";
import { formatRupees } from "@/lib/format";
import type { RefundReason, RunOutcome } from "@/lib/history-types";

export const ACCOUNT_COPY = {
  /** The line under each row's name on the Account list. */
  rowHints: {
    wallet: "Balance, top up and every payment",
    profile: "Your name and ID",
    preferences: "Default building, way to get it and time",
    notifications: "Sounds and what you hear about",
    history: "Finished orders and runs",
    refunds: "Money that came back to your wallet",
    terms: "What this prototype is and is not",
    feedback: "Tell the team how it went",
    support: "Where to go when something is wrong",
  },
  profileCard: { walletLabel: "Wallet balance", idStudent: "AU number", idStaff: "Staff ID" },
  logout: {
    row: "Log out",
    hint: "End this session on this phone",
    title: "Log out of QuickX?",
    body: "Orders you have placed carry on. Come back with the same AU number and they are still there.",
    confirm: "Log out",
    stay: "Stay logged in",
  },

  profile: {
    nameLabel: "First name",
    nameHint: `${FIRST_NAME_MIN} to ${FIRST_NAME_MAX} letters. Spaces, apostrophes and hyphens are fine.`,
    idLabelStudent: "AU number",
    idLabelStaff: "Staff ID",
    idHint: "This is how QuickX knows you. It cannot be changed here.",
    roleLabel: "Role",
    roleStudent: "Student",
    roleStaff: "QuickX staff",
    save: "Save name",
    saving: "Saving",
    saved: (name: string) => `Saved. You are ${name} now. Orders you already placed keep the name they had.`,
    unchanged: "That is already your name.",
    failed: "Could not save. Check your connection and try again.",
  },

  preferences: {
    intro: "Checkout and the Next break strip on Home start from these. You can still change them on any order.",
    buildingLabel: "Default building",
    modeLabel: "Default way to get it",
    modePickup: "Pick up at UC",
    modeDelivery: "Deliver to my building",
    whenLabel: "Default time",
    whenAsap: "As soon as possible",
    whenNextBreak: "Next break",
    whenHint: "Next break picks the first break that is still open when you check out. If none is, it falls back to as soon as possible.",
    modeHint: "With pickup, the building is not used.",
    save: "Save preferences",
    saving: "Saving",
    saved: "Saved. Checkout and Home will start from these.",
    unchanged: "Nothing has changed.",
    badValue: "That choice is not available.",
    failed: "Could not save. Check your connection and try again.",
  },

  notifications: {
    intro: "Updates always show every order and wallet change. Only Sounds changes anything today.",
    orderUpdates: { label: "Order updates", hint: "Not connected yet: the Updates tab shows every order change." },
    walletUpdates: { label: "Wallet updates", hint: "Not connected yet: the Updates tab shows every wallet change." },
    sounds: { label: "Sounds", hint: "A soft chime when a new Update arrives, while QuickX is open." },
    soundsNote: "Browsers only allow sound after you have tapped the page once, and a phone on silent stays silent.",
    saveFailed: "Could not save that switch. Check your connection and try again.",
    cosmetic: "Cosmetic",
  },

  history: {
    intro: "Everything that has finished: your orders and the deliveries you carried.",
    filterLabel: "Show",
    filters: { all: "All", orders: "Orders", runs: "Runs" },
    emptyAll: "Nothing here yet. Finished orders and runs show up here.",
    emptyOrders: "No finished orders yet.",
    emptyRuns: "No finished runs yet. Scan a bag at UC to carry one.",
    runTitle: (building: string) => `Run to ${building}`,
    runKindRunner: "Runner buddy",
    runKindStaff: "QuickX staff",
    outcome: {
      delivered: "Delivered",
      "failed-late": "Failed late",
      "no-show": "Buyer missed it",
    } satisfies Record<RunOutcome, string>,
    earned: (amount: number) => `${formatRupees(amount)} earned`,
    charged: (amount: number) => `${formatRupees(amount)} taken from your wallet`,
    noEarning: "No earning for staff deliveries",
    loadFailed: "Could not load your history. Pull down to try again.",
  },

  refunds: {
    intro: "Cancelled, rejected and late orders are refunded in full, straight to your wallet.",
    totalLabel: "Refunded so far",
    state: "Refunded to wallet",
    reason: {
      cancelled: "You cancelled it",
      rejected: "The cafe could not make it",
      "failed-late": "It was not delivered in time",
    } satisfies Record<RefundReason, string>,
    empty: "No refunds yet. If an order is cancelled, rejected or late, the money comes back here.",
    noShowNote: `A delivery you missed after your runner arrived on time is not refunded. You can collect it at the cafe counter for ${PICKUP_STALE_MIN} minutes.`,
    loadFailed: "Could not load your refunds. Pull down to try again.",
  },

  terms: {
    intro: "Short and plain. This is a prototype.",
    sections: [
      {
        title: "What QuickX is",
        body: [
          "QuickX is a prototype built by Team GapBite for Ahmedabad University. It is made to be shown and tested, not run as a real service.",
          "Things may reset, break or change without notice.",
        ],
      },
      {
        title: "The money is pretend",
        body: [
          "Top-ups use a mock UPI screen. No real payment is taken and no real money moves.",
          "Wallet balances, refunds, runner earnings and penalties are numbers inside the prototype. The team can change or clear them at any time.",
        ],
      },
      {
        title: "Orders and refunds",
        body: [
          "You can cancel an order until the cafe accepts it. Cancelled, rejected and late orders are refunded in full to your wallet.",
          `If your runner arrived on time and you were not there, the order is not refunded. The bag waits at the cafe counter for ${PICKUP_STALE_MIN} minutes and your code still collects it.`,
        ],
      },
      {
        title: "Runner buddies",
        body: [
          `A student with at least ${formatRupees(WALLET_MIN_TO_USE)} in their wallet can carry a delivery and earns the amount shown when they scan the bag.`,
          "A runner whose delivery is late pays the order total from their own wallet and keeps the food.",
        ],
      },
      {
        title: "Your details",
        body: [
          "QuickX asks for your first name and AU number so your orders and wallet stay yours. There are no passwords: the access code you were given is what lets you in.",
          "Do not share your 4-digit order codes. Only you can see yours.",
        ],
      },
      {
        title: "Pictures and credits",
        body: [
          "Illustrations: Open Peeps by Pablo Stanley (CC0, openpeeps.com). The drawings are not added yet. Until they are, QuickX uses simple line icons.",
          "Icons: Phosphor Icons (MIT). Fonts: Grandstander and Figtree (SIL Open Font License). Food photos appear only where the team has taken them.",
        ],
      },
    ],
  },

  feedback: {
    title: "How was QuickX?",
    ratingLabel: "Your rating",
    faces: ["Very bad", "Bad", "Okay", "Good", "Great"],
    ratingOf: (n: number, word: string) => `${n} of 5, ${word}`,
    textLabel: "Anything to add? (optional)",
    textHint: `Up to ${FEEDBACK_TEXT_MAX} characters.`,
    submit: "Send feedback",
    sending: "Sending",
    pickAFace: "Pick a face first.",
    tooLong: `Keep it under ${FEEDBACK_TEXT_MAX} characters.`,
    tooSoon: "That went through a moment ago. Try again in a few seconds.",
    thanksTitle: "Thanks",
    thanks: "Your feedback reached the team.",
    again: "Send more feedback",
    failed: "Could not send that. Check your connection and try again.",
  },

  support: {
    helpDeskTitle: "UC help desk",
    helpDesk: [
      "Problem with your food or a bag? Ask at the counter of the cafe you ordered from, or at the UC help desk.",
      "Have your order ID ready. It looks like QX-4821 and is at the top of your order.",
    ],
    teamTitle: "Team GapBite",
    team: "Contact details for the team will be added here.",
    faqTitle: "Fees, late orders, refunds",
    faq: "The FAQ answers the questions we hear most.",
    faqLink: "Open the FAQ",
  },
} as const;
