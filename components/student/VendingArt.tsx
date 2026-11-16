/**
 * Flat vector scene for the vending tile on Home: a yellow (amber) vending machine with shelves of snacks and a keypad, a student
 * ordering from a phone, a small plant and a soft blob behind them. Inline SVG drawn only with palette tokens, toned for
 * the dark espresso tile. Decorative.
 */
export function VendingArt({ className = "" }: { className?: string }) {
  const c = (name: string) => `var(--color-${name})`;
  const snacks = ["brick", "olive", "blush", "amber", "sand", "brick", "olive", "blush", "amber"];
  return (
    <svg viewBox="0 0 220 150" className={className} aria-hidden="true" focusable="false">
      {/* soft blob */}
      <path d="M30 120 C10 80 40 30 95 28 C150 26 205 45 208 92 C211 135 160 146 110 144 C65 142 45 140 30 120 Z" fill={c("mocha")} />
      {/* machine */}
      <rect x="62" y="22" width="78" height="118" rx="8" fill={c("amber")} />
      <rect x="62" y="22" width="78" height="10" rx="5" fill={c("sun")} />
      <rect x="70" y="38" width="44" height="78" rx="4" fill={c("cream")} />
      {[0, 1, 2].map((row) => (
        <g key={row}>
          <rect x="72" y={60 + row * 24} width="40" height="2.5" fill={c("taupe")} />
          {[0, 1, 2].map((col) => (
            <rect key={col} x={75 + col * 12.5} y={45 + row * 24} width="9" height="14" rx="2" fill={c(snacks[row * 3 + col])} />
          ))}
        </g>
      ))}
      <rect x="119" y="38" width="15" height="36" rx="3" fill={c("espresso")} />
      {[0, 1, 2, 3].map((r) => [0, 1].map((k) => <rect key={`${r}${k}`} x={122 + k * 5.5} y={42 + r * 7} width="4" height="4" rx="1" fill={c("sand")} />))}
      <rect x="121" y="80" width="11" height="4" rx="2" fill={c("espresso")} />
      <rect x="70" y="122" width="64" height="11" rx="3" fill={c("mocha")} />
      {/* plant */}
      <rect x="22" y="118" width="18" height="20" rx="3" fill={c("blush")} />
      <path d="M31 118 C24 104 18 100 14 92 C24 96 29 104 31 112 C32 100 36 92 44 86 C42 98 37 108 31 118 Z" fill={c("olive")} />
      {/* student with phone */}
      <circle cx="170" cy="58" r="10" fill={c("blush")} />
      <path d="M160 55 C160 44 180 44 180 54 C175 50 166 50 160 55 Z" fill={c("espresso")} />
      <path d="M156 74 C156 68 184 68 184 74 L186 108 L154 108 Z" fill={c("olive")} />
      <rect x="158" y="106" width="9" height="34" rx="3" fill={c("maroon")} />
      <rect x="173" y="106" width="9" height="34" rx="3" fill={c("maroon")} />
      <path d="M158 78 L146 92 L150 95 L161 84 Z" fill={c("olive")} />
      <rect x="141" y="84" width="9" height="15" rx="2" fill={c("espresso")} transform="rotate(-12 145 91)" />
      <rect x="143" y="86" width="5" height="9" rx="1" fill={c("sun")} transform="rotate(-12 145 91)" />
      <circle cx="148" cy="94" r="3" fill={c("blush")} />
    </svg>
  );
}
