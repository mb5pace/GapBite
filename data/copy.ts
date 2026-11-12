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
    placeholderHome: "Ordering opens in the next phase.",
    logout: "Log out",
  },

  cafe: {
    title: "QuickX · UC Cafe Desk",
    placeholder: "The order queue is not built yet.",
  },

  admin: {
    title: "QuickX Admin",
    codeNotUnused: "That code has already been used or removed. The list is up to date now.",
    sessionAlreadyEnded: "That session has already ended.",
    slotEmpty: "There is no permanent code in that slot.",
    nav: { codes: "Codes", staff: "Staff" },
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
