import { ADMIN_ADJUST_MAX, ADMIN_NOTE_MAX, ADMIN_NOTE_MIN, MAX_UNITS_PER_ORDER, MORNING_CUTOFF, TOPUP_MAX, TOPUP_MIN, WALLET_MIN_TO_USE, WALLET_SUGGESTED } from "@/lib/config";
import { formatRupees } from "@/lib/format";

/**
 * Shared UI strings. Plain, short, specific to campus (UI_UX_BIBLE.md section 8).
 * Strings that appear on more than one screen, or that the server sends back,
 * live here. One-off labels can stay in their component.
 */

export const COPY = {
  tagline: "Food from UC, in your break.",

  common: {
    network: "Could not reach QuickX. Check your connection and try again.",
    wrongPortal: "That page is for a different QuickX portal. Log out and enter the right code.",
    needUser: "Tell us who's ordering first.",
  },

  /** The pages Next shows when a page is missing or breaks. They carry our colours, never the browser's. */
  errorPages: {
    notFound: "We could not find that page. It may have moved, or it belongs to someone else.",
    goHome: "Go to Home",
    goBack: "Back to QuickX",
    broke: "This page stopped working. Try again, and if it keeps happening tell the QuickX team.",
    tryAgain: "Try again",
  },

  gate: {
    label: "Enter your QuickX access code",
    placeholder: "K7Q-M2X",
    button: "Enter",
    codeRequired: "Type your access code first.",
    badCode: "That code doesn't work. Ask the QuickX team for a fresh one.",
    tooManyTries: "Too many tries, wait a few minutes.",
    showCode: "Show code",
    hideCode: "Hide code",
    sessionEnded: "Your session has ended. Ask for a new code.",
    notSetUp: "QuickX is not set up yet. Ask the QuickX team to check the server settings.",
    cannotCheck: "Could not check that code. Try again in a moment.",
  },

  identify: {
    title: "Who's ordering?",
    auLabel: "Your AU number",
    auPlaceholder: "AU2340101",
    auHint: "AU followed by 7 digits, like AU2340101.",
    nameLabel: "Your first name",
    nameHint: "2 to 20 characters. Letters, spaces, apostrophes and hyphens are fine. We only ask this once.",
    staffLabel: "Your staff ID",
    staffPlaceholder: "QX-STF-01",
    staffHint: "QX-STF- followed by 2 digits, like QX-STF-01.",
    staffUnknown: "That staff ID is not set up. Ask the QuickX team.",
    switchToStaff: "I'm QuickX staff",
    switchToStudent: "I'm a student",
    button: "Continue",
    prototypeNote: "Prototype: anyone with a code can enter any AU number.",
    badAu: "That AU number does not look right. It is AU followed by 7 digits.",
    badStaffId: "That staff ID does not look right. It is QX-STF- followed by 2 digits.",
    badName: "Enter your first name: 2 to 20 characters, using letters, spaces, apostrophes or hyphens.",
  },

  student: {
    logout: "Log out",
    staffBadge: "Staff",
    walletLabel: "Wallet balance",
    tabs: {
      home: "Home",
      discover: "Discover",
      orders: "Orders",
      updates: "Updates",
      account: "Account",
    },
    /** Header title for each tab. Home shows the greeting instead. */
    titles: {
      cart: "Cart",
      checkout: "Checkout",
      order: "Order",
      discover: "Discover",
      orders: "Orders",
      updates: "Updates",
      account: "Account",
    },
    accountSections: {
      wallet: "Wallet",
      profile: "My Profile",
      preferences: "Preferences",
      notifications: "Notifications",
      history: "Order History",
      refunds: "Refund Status",
      terms: "Terms and Conditions",
      feedback: "Feedback",
      support: "Support",
    },
    home: {
      searchLabel: "Search the menu",
      searchPlaceholder: "Search poha, cold coffee, Paper Boat…",
      searchClear: "Clear search",
      orderFrom: "Order from",
      popular: "Popular at UC",
      bestseller: "Bestseller",
      open: "Open",
      noResults: "Nothing matches that. Try poha, cold coffee or Paper Boat.",
      noMoreBreaks: "No more breaks today. You can still order as soon as possible.",
    },
    menu: {
      morningOnly: "Morning only",
      notToday: "Not today",
      soldOut: "Sold out",
      readyNow: "Ready now",
      vendingLine: "Pay here, then enter your code at the machine, or get it delivered.",
    },
    cart: {
      title: "Cart",
      empty: "Your cart is empty. Pick something from UC.",
      browse: "Browse the menu",
      addMore: "Add more items",
      subtotal: "Subtotal",
      checkout: "Checkout",
      remove: "Remove",
      viewCart: "View cart",
      keepCart: "Keep my cart",
      startNew: "Start new cart",
      fixFirst: "Fix the items marked below to continue.",
      overStock: "Not enough left",
    },
    /** One line for each page that is not built yet. */
    stubs: {
      discover: "Help, FAQ and feedback will live here.",
      account: "Wallet, profile and history will live here.",
      section: "This part of Account opens in a later release.",
    },
  },

  cafe: {
    title: "QuickX · UC Cafe Desk",
  },

  admin: {
    title: "QuickX Admin",
    codeNotUnused: "That code has already been used or removed. The list is up to date now.",
    sessionAlreadyEnded: "That session has already ended.",
    slotEmpty: "There is no permanent code in that slot.",
    nav: { codes: "Codes", staff: "Staff", users: "Users", orders: "Live orders" },
    staff: {
      title: "Staff",
      intro: "Staff sign in with any student access code, then tap \"I'm QuickX staff\" and type their ID.",
      nameLabel: "Staff member's first name",
      nameHint: "2 to 20 characters. Letters, spaces, apostrophes and hyphens are fine.",
      addButton: "Add staff",
      addedHeading: "Staff ID created",
      addedHelp: "Give them this ID. They type it after tapping \"I'm QuickX staff\".",
      listHeading: "Staff accounts",
      empty: "No staff yet. Add the first person above.",
      badName: "Enter a name of 2 to 20 characters, using letters, spaces, apostrophes or hyphens.",
      full: "Every staff ID is already in use.",
    },
  },
} as const;

/** Wallet strings. Amounts come from lib/config.ts so a rule change cannot leave the words behind. */
export const WALLET_COPY = {
  title: "Wallet",
  balanceLabel: "Wallet balance",
  topUp: "Top up",
  activity: "Wallet activity",
  prototypeNote: "Prototype: this is a mock UPI step. No real money moves.",
  blockedBanner: `Top up to order. You need at least ${formatRupees(WALLET_MIN_TO_USE)} in your wallet to place an order or take a run.`,
  lowBanner: `Keep at least ${formatRupees(WALLET_SUGGESTED)} in your wallet so orders never get stuck.`,
  emptyLedger: "No wallet activity yet. Top up to place your first order.",
  badAmount: `Enter an amount from ${formatRupees(TOPUP_MIN)} to ${formatRupees(TOPUP_MAX)}.`,
  otherAmount: `Other amount (${formatRupees(TOPUP_MIN)} to ${formatRupees(TOPUP_MAX)})`,
  processing: "Processing your UPI payment",
  processingHint: "This takes a moment. Do not close the app.",
  cancel: "Cancel",
  done: "Done",
  types: {
    topup: "Top-up",
    order: "Order payment",
    refund: "Refund",
    earning: "Runner earning",
    penalty: "Late delivery penalty",
    adjustment: "Adjustment by QuickX",
  },
  admin: {
    title: "Users and wallets",
    intro: "Find someone by AU number, staff ID or name. Adjust their wallet with a note; every change is written to their ledger.",
    searchLabel: "Search by AU number, staff ID or name",
    none: "No one matches that. Students appear here after they identify themselves.",
    noneYet: "No one has signed in yet.",
    amountLabel: "Amount (+ adds, − takes away)",
    amountHint: `Whole rupees, up to ${formatRupees(ADMIN_ADJUST_MAX)} at a time. A wallet cannot go below ₹0 this way.`,
    noteLabel: "Note (required)",
    noteHint: `${ADMIN_NOTE_MIN} to ${ADMIN_NOTE_MAX} characters. The person sees this in their ledger.`,
    apply: "Apply adjustment",
    badAmount: `Enter a whole number of rupees, not zero, up to ${formatRupees(ADMIN_ADJUST_MAX)}. Use − to take money away.`,
    badNote: `Write a note of ${ADMIN_NOTE_MIN} to ${ADMIN_NOTE_MAX} characters.`,
    noOne: "No one has that ID.",
  },
} as const;

/** Why an item could not be added to the cart, in one plain sentence. */
export function refusalMessage(
  reason: "limit" | "stock" | "unavailable" | "morning-closed" | "sold-out",
  itemName: string,
  left = 0,
): string {
  switch (reason) {
    case "limit":
      return `You can order up to ${MAX_UNITS_PER_ORDER} items at a time.`;
    case "stock":
      return `Only ${left} ${itemName} left.`;
    case "unavailable":
      return `${itemName} is not available today.`;
    case "morning-closed":
      return `${itemName} is a morning item. Morning items stop at ${MORNING_CUTOFF.hour}:${String(MORNING_CUTOFF.minute).padStart(2, "0")}.`;
    case "sold-out":
      return `${itemName} is sold out.`;
  }
}
