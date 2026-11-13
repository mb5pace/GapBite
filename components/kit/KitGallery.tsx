"use client";

import {
  Bell,
  Check,
  CookingPot,
  House,
  PersonSimpleWalk,
  Plus,
  Receipt,
  ShoppingBag,
  Users,
} from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { ArchCard } from "@/components/ui/ArchCard";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { CodeBoxes } from "@/components/ui/CodeBoxes";
import { Countdown } from "@/components/ui/Countdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { ItemTile } from "@/components/ui/ItemTile";
import { Money } from "@/components/ui/Money";
import { PillButton } from "@/components/ui/PillButton";
import { Sheet } from "@/components/ui/Sheet";
import { Stepper, type StepperStep } from "@/components/ui/Stepper";
import { Toggle } from "@/components/ui/Toggle";
import { BottomBar } from "@/components/student/BottomBar";
import { Header } from "@/components/student/Header";
import { BREAK_SLOTS } from "@/data/breaks";
import { MENU_ITEMS, getItem, getSource } from "@/data/menu";
import { WALLET_SUGGESTED } from "@/lib/config";

const SWATCHES = [
  { token: "cream", bg: "bg-cream", use: "App background" },
  { token: "parchment", bg: "bg-parchment", use: "Cards, bottom bar, sheets" },
  { token: "sand", bg: "bg-sand", use: "Inputs, inactive chips, tiles" },
  { token: "blush", bg: "bg-blush", use: "Selected chip, highlights" },
  { token: "maroon", bg: "bg-maroon", use: "Primary, active tab, headings" },
  { token: "espresso", bg: "bg-espresso", use: "Body text, icons" },
  { token: "mocha", bg: "bg-mocha", use: "Secondary text" },
  { token: "taupe", bg: "bg-taupe", use: "Tertiary text 14 px and up, borders" },
  { token: "sun", bg: "bg-sun", use: "Gate panel, earn highlight" },
  { token: "olive", bg: "bg-olive", use: "Delivered, money in" },
  { token: "amber", bg: "bg-amber", use: "Due now, low balance" },
  { token: "brick", bg: "bg-brick", use: "Failed, money out, errors" },
] as const;

const ICON = { weight: "regular", size: 20, "aria-hidden": true } as const;

const STEPS: StepperStep[] = [
  { label: "Placed", state: "done", time: "11:32", icon: <Receipt {...ICON} /> },
  { label: "Accepted", state: "done", time: "11:33", icon: <Check {...ICON} /> },
  { label: "Preparing", state: "done", time: "11:34", icon: <CookingPot {...ICON} /> },
  { label: "Ready", state: "current", time: "11:39", icon: <ShoppingBag {...ICON} /> },
  { label: "Picked up", state: "upcoming", icon: <PersonSimpleWalk {...ICON} /> },
  { label: "Delivered", state: "upcoming", icon: <House {...ICON} /> },
];

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4" aria-labelledby={`kit-${title}`}>
      <div>
        <h2 id={`kit-${title}`} className="font-display text-title font-extrabold text-maroon">
          {title}
        </h2>
        {note ? <p className="mt-1 max-w-3xl text-secondary text-mocha">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** A 390 px wide frame, the student design width, on a parchment mat so its edge is visible. */
function Phone({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-card bg-parchment p-3">
      <div className="w-[390px] max-w-full overflow-hidden rounded-tile bg-cream">{children}</div>
    </div>
  );
}

/** Admin-only gallery of every component (docs/BUILD_PLAN.md Phase 2). */
export function KitGallery() {
  const [chip, setChip] = useState("asap");
  const [slot, setSlot] = useState("11:50");
  const [sheet, setSheet] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [available, setAvailable] = useState(true);
  const [code, setCode] = useState("48");
  const [entered, setEntered] = useState("");
  const [added, setAdded] = useState(0);

  const popular = MENU_ITEMS.filter((i) => i.tags.includes("bestseller")).slice(0, 5);
  const coffee = getItem("cd-cold-coffee");
  const poha = getItem("ti-poha");

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-12 px-6 py-8">
      <header>
        <h1 className="font-display text-greeting font-extrabold text-maroon">QuickX UI kit</h1>
        <p className="mt-1 max-w-3xl text-body text-mocha">
          Every component from the bible, in one place. Admin only. If something here looks wrong, it looks wrong
          everywhere.
        </p>
      </header>

      <Section title="Colour" note="Twelve tokens, defined once in globals.css. Status colours are for text, borders and small dots only.">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {SWATCHES.map((s) => (
            <li key={s.token} className="flex flex-col gap-2">
              <span className={`h-16 rounded-card ${s.bg}`} aria-hidden="true" />
              <span className="font-display text-section font-bold text-espresso">{s.token}</span>
              <span className="text-caption text-mocha">{s.use}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Type" note="Grandstander for display, Figtree for text. 72 is for the gate wordmark and the show-code screen only.">
        <div className="flex flex-col gap-2 rounded-card bg-parchment p-5">
          <p className="font-display text-display font-extrabold text-maroon">QuickX</p>
          <p className="font-display text-greeting font-extrabold text-maroon">Riya, 32 greeting</p>
          <p className="font-display text-title font-extrabold text-maroon">Screen title, 24</p>
          <p className="font-display text-section font-bold text-maroon">Section title, 18</p>
          <p className="text-body text-espresso">Body text, 16. Food from UC, in your break.</p>
          <p className="text-secondary text-mocha">Secondary text, 14. Ready by 11:42 at the Cafe Delice counter.</p>
          <p className="text-caption text-mocha">Caption, 12</p>
        </div>
      </Section>

      <Section title="Buttons" note="Pill buttons: 56 px primary with the arrow circle, 44 px secondary and outline.">
        <div className="flex flex-wrap items-center gap-3">
          <PillButton arrow>Pay ₹235 from wallet</PillButton>
          <PillButton arrow disabled>Pay ₹235 from wallet</PillButton>
          <PillButton variant="secondary">Add more items</PillButton>
          <PillButton variant="outline">Cancel order</PillButton>
          <PillButton variant="secondary" size="md">Top up</PillButton>
          <PillButton variant="outline" size="md">Log out</PillButton>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <IconButton label="Scan a bag"><Plus weight="bold" size={22} aria-hidden="true" /></IconButton>
          <IconButton label="Notifications" variant="secondary"><Bell weight="regular" size={22} aria-hidden="true" /></IconButton>
          <IconButton label="Add" size="lg"><Plus weight="bold" size={22} aria-hidden="true" /></IconButton>
          <IconButton label="Disabled" disabled><Plus weight="bold" size={22} aria-hidden="true" /></IconButton>
          <span className="text-secondary text-mocha">Icon buttons: 44 px (48 px large), always labelled.</span>
        </div>
      </Section>

      <Section title="Chips" note="Pills for options. The tall capsule is for break slots; the selected capsule is filled maroon.">
        <div className="flex flex-wrap gap-2">
          {[["asap", "As soon as possible"], ["pickup", "Pick up at UC"], ["deliver", "Deliver to my building"]].map(([id, label]) => (
            <Chip key={id} selected={chip === id} onClick={() => setChip(id)}>{label}</Chip>
          ))}
          <Chip disabled>Not today</Chip>
        </div>
        <div className="flex flex-wrap gap-2">
          {BREAK_SLOTS.map((time, i) => (
            <Chip key={time} variant="capsule" selected={slot === time} disabled={i === 0} onClick={() => setSlot(time)}>
              <span className="font-display font-bold">{time}</span>
              <span className="text-caption">{i === 0 ? "Too late" : "Break"}</span>
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Cards, tiles and arch cards" note="No photos yet, so every item shows its initials and a tiny source glyph. A real photo at public/food/<item-id>.jpg covers the tile.">
        <div className="flex flex-wrap items-end gap-4">
          {coffee ? <ItemTile itemId={coffee.id} name={coffee.name} sourceId={coffee.sourceId} size="sm" /> : null}
          {coffee ? <ItemTile itemId={coffee.id} name={coffee.name} sourceId={coffee.sourceId} size="md" /> : null}
          {coffee ? <ItemTile itemId={coffee.id} name={coffee.name} sourceId={coffee.sourceId} size="lg" /> : null}
          {poha ? <ItemTile itemId={poha.id} name={poha.name} sourceId={poha.sourceId} size="lg" /> : null}
          {MENU_ITEMS.filter((i) => i.sourceId === "vending").slice(0, 2).map((i) => (
            <ItemTile key={i.id} itemId={i.id} name={i.name} sourceId={i.sourceId} size="lg" />
          ))}
        </div>
        <Card className="max-w-sm">
          <p className="text-body font-medium text-espresso">A card is parchment on cream, radius 24.</p>
          <p className="mt-1 text-secondary text-mocha">Depth comes from colour, never from a shadow.</p>
        </Card>
        <div className="flex gap-4 overflow-x-auto pb-2" aria-label="Popular at UC">
          {popular.map((item) => (
            <ArchCard
              key={item.id}
              title={item.name}
              tag="Bestseller"
              price={item.price}
              media={<ItemTile fill itemId={item.id} name={item.name} sourceId={item.sourceId} />}
              onAdd={() => setAdded((n) => n + 1)}
            />
          ))}
        </div>
        <p className="text-secondary text-mocha" role="status">
          {added === 0 ? "Tap a + to try it." : `Added ${added} time${added === 1 ? "" : "s"}. From ${getSource("cafe-delice").name} and friends.`}
        </p>
      </Section>

      <Section title="Stepper" note="Vertical order tracker. Done is filled maroon, current has a sun ring, upcoming is sand.">
        <Phone>
          <div className="p-5">
            <Stepper steps={STEPS} />
          </div>
        </Phone>
      </Section>

      <Section title="Code boxes" note="Four separate boxes. The first shows a code. The second is the entry field: type, Backspace, paste.">
        <div className="flex flex-wrap items-start gap-8">
          <div className="flex flex-col gap-2">
            <p className="text-secondary text-mocha">Show this code to your runner</p>
            <CodeBoxes value="4821" label="Handover code" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-secondary text-mocha">Typing (value: {code || "empty"})</p>
            <CodeBoxes value={code} onChange={setCode} label="Handover code entry" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-secondary font-medium text-brick">Code does not match</p>
            <CodeBoxes value={entered} onChange={setEntered} label="Wrong code entry" invalid />
          </div>
        </div>
      </Section>

      <Section title="Banners, money, badges" note="One sentence per banner. A warning is an amber icon, never a coloured stripe.">
        <div className="grid max-w-xl gap-3">
          <Banner tone="warning" action={<PillButton variant="secondary" size="md">Top up</PillButton>}>
            Keep at least ₹{WALLET_SUGGESTED} in your wallet so orders never get stuck.
          </Banner>
          <Banner>Next break 11:50. Order by 11:38 for GICT.</Banner>
          <Banner tone="error">Top up ₹40 more to place this order.</Banner>
        </div>
        <div className="flex flex-wrap items-center gap-6 rounded-card bg-parchment p-5">
          <Money amount={240} className="font-display text-title font-bold text-maroon" />
          <Money amount={1250} className="font-display text-title font-bold text-maroon" />
          <Money amount={100000} className="font-display text-title font-bold text-maroon" />
          <Money amount={40} tone="signed" className="font-display text-title font-bold" />
          <Money amount={-40} tone="signed" className="font-display text-title font-bold" />
          <Money amount={-30} className="font-display text-title font-bold text-maroon" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="olive">Unused</Badge>
          <Badge tone="amber">Active, <Countdown msLeft={754000} /> left</Badge>
          <Badge tone="brick">Revoked</Badge>
          <Badge tone="taupe">Burned</Badge>
        </div>
      </Section>

      <Section title="Fields and empty states" note="Pill inputs on sand. The empty state is one icon in a sand circle, one sentence, one action, until the Open Peeps drawings arrive.">
        <div className="grid max-w-3xl gap-6 md:grid-cols-2">
          <Input label="Your AU number" placeholder="AU2340101" hint="AU followed by 7 digits, like AU2340101." />
          <Input label="Your first name" defaultValue="Z" error="Enter your first name: 2 to 20 characters." />
          <Input variant="code" label="Enter your QuickX access code" placeholder="K7Q-M2X" />
        </div>
        <Card className="max-w-md">
          <EmptyState icon={<Users weight="regular" size={40} />} action={<PillButton variant="secondary">Add staff</PillButton>}>
            No staff yet. Add the first person above.
          </EmptyState>
        </Card>
      </Section>

      <Section title="Switch" note="On/off, for the Cafe portal's Available today. The tap area is 44 px; the track is maroon when on.">
        <div className="flex items-center gap-4 rounded-card bg-parchment p-4">
          <Toggle checked={available} onChange={setAvailable} label="Tea, available today" />
          <span className="text-body text-espresso">{available ? "Available today" : "Off today"}</span>
          <Toggle checked={false} onChange={() => undefined} label="Disabled example" disabled />
        </div>
      </Section>

      <Section title="Sheet" note="Slides up in 200 ms. Close with Esc, the dim area, or by dragging the handle down 80 px. On the laptop portals the same component opens as a centred dialog.">
        <div className="flex gap-3">
          <PillButton variant="secondary" onClick={() => setSheet(true)}>Open a sheet</PillButton>
          <PillButton variant="secondary" onClick={() => setDialog(true)}>Open a laptop dialog</PillButton>
        </div>
        <Sheet open={dialog} onClose={() => setDialog(false)} title="Why can you not make this order?" placement="center">
          <p className="text-body text-mocha">The buyer gets this reason and their money back.</p>
          <div className="mt-6">
            <PillButton size="md" variant="secondary" onClick={() => setDialog(false)}>Keep order</PillButton>
          </div>
        </Sheet>
        <Sheet open={sheet} onClose={() => setSheet(false)} title="Top up your wallet">
          <p className="text-body text-espresso">Pick an amount. This is only the kit, nothing is charged.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[50, 100, 200, 500].map((amount) => (
              <Chip key={amount} selected={amount === 100}>
                <Money amount={amount} />
              </Chip>
            ))}
          </div>
          <div className="mt-6">
            <PillButton arrow full onClick={() => setSheet(false)}>Pay with UPI</PillButton>
          </div>
        </Sheet>
      </Section>

      <Section title="Student shell" note="The real header and floating bottom bar, in a 390 px frame. Dots on Orders and Updates are real states: an order in progress, unread updates.">
        <div className="flex flex-wrap items-start gap-6">
          <Phone>
            <Header greeting="Good morning" name="Riya" isStaff={false} balance={240} tempMsLeft={null} pathname="/home" />
            <div className="h-24 px-5 text-secondary text-mocha">Page content</div>
            <div className="px-5 pb-3"><BottomBar floating={false} unread activeOrder pathname="/home" /></div>
          </Phone>
          <Phone>
            <Header greeting="Good afternoon" name="Ramesh" isStaff balance={30} tempMsLeft={null} pathname="/home" />
            <div className="h-24 px-5 text-secondary text-mocha">Staff badge, low balance dot</div>
            <div className="px-5 pb-3"><BottomBar floating={false} unread={false} activeOrder={false} pathname="/updates" /></div>
          </Phone>
          <Phone>
            <Header greeting="" name="" isStaff={false} balance={1250} tempMsLeft={null} pathname="/orders" />
            <div className="h-24 px-5 text-secondary text-mocha">Page title instead of the greeting</div>
            <div className="px-5 pb-3"><BottomBar floating={false} unread={false} activeOrder pathname="/orders" /></div>
          </Phone>
        </div>
      </Section>
    </div>
  );
}
