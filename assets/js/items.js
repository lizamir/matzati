// Item illustrations: one small SVG per item type, tinted with the item's color.
// Shared by the hero, the live board, the demo result card and the game.

/** Hebrew color names -> hex used to tint the illustration. */
export const COLORS = {
  כחול: "#2f6fe0",
  אדום: "#d63b3b",
  ירוק: "#3f9a5a",
  צהוב: "#f2c230",
  כתום: "#f08a2c",
  ורוד: "#f08cb4",
  סגול: "#8a63d2",
  שחור: "#3a3338",
  לבן: "#f2efe9",
  אפור: "#9a979b",
  חום: "#8d5f3d",
  תכלת: "#6fc3e8",
  טורקיז: "#2fb3a8",
  "בז׳": "#d9c3a3",
};

const FALLBACK_COLOR = "#c9b9c2";

/** Keywords in a title -> illustration type. First match wins. */
const TYPE_KEYWORDS = [
  ["bottle", ["בקבוק", "מימי", "תרמוס"]],
  ["lunchbox", ["קופס", "אוכל"]],
  ["cap", ["כובע", "מצחי"]],
  ["hoodie", ["קפוצ", "סווטש", "מעיל", "חולצ", "ז׳קט", "סוודר", "עליונית"]],
  ["pencilcase", ["קלמר", "עפרונ", "עט"]],
  ["bag", ["תיק", "ילקוט", "פאוץ"]],
  ["glasses", ["משקפ"]],
  ["umbrella", ["מטרי"]],
  ["ball", ["כדור"]],
  ["scarf", ["צעיף", "כפפ"]],
  ["keys", ["מפתח"]],
  ["headphones", ["אוזני"]],
];

const CATEGORY_TYPE = {
  בגדים: "hoodie",
  "בקבוקים וקופסאות אוכל": "bottle",
  "ציוד לימודי": "pencilcase",
  תיקים: "bag",
  "יקרי ערך": "keys",
  "צעצועים ומשחקים": "ball",
};

/** Picks an illustration type from a free-text title, falling back to the category. */
export function guessType(title = "", category = "") {
  for (const [type, words] of TYPE_KEYWORDS) {
    if (words.some((w) => title.includes(w))) return type;
  }
  return CATEGORY_TYPE[category] || "tag";
}

/** Hebrew color name (possibly inside a longer string) -> hex. */
export function colorHex(name = "") {
  const key = Object.keys(COLORS).find((c) => name.includes(c));
  return key ? COLORS[key] : FALLBACK_COLOR;
}

/** Small decorative marks used by the game ("with a star sticker"). */
const MARKS = {
  star: '<path d="M0 -9 2.6 -2.8 9 -2.8 3.8 1.4 5.6 8 0 4 -5.6 8 -3.8 1.4 -9 -2.8 -2.6 -2.8Z" fill="#fff" stroke="#2b1a24" stroke-width="1.4" stroke-linejoin="round"/>',
  heart: '<path d="M0 7C-9 0 -6 -8 0 -3 6 -8 9 0 0 7Z" fill="#fff" stroke="#2b1a24" stroke-width="1.4" stroke-linejoin="round"/>',
  stripes: '<path d="M-9 -5H9M-9 0H9M-9 5H9" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>',
  dots: '<g fill="#fff"><circle cx="-6" cy="-4" r="2.4"/><circle cx="5" cy="-5" r="2.4"/><circle cx="0" cy="3" r="2.4"/><circle cx="-7" cy="6" r="2.4"/><circle cx="7" cy="5" r="2.4"/></g>',
  dino: '<path d="M-8 4q-2-9 5-10 3-6 8-3 5 1 3 6 3 4-2 7l-1 4h-3l-1-3h-4l-1 3h-3z" fill="#3f9a5a" stroke="#2b1a24" stroke-width="1.2" stroke-linejoin="round"/>',
  unicorn: '<path d="M-6 6q-3-10 6-10l3-6 1 6q5 3 2 10z" fill="#fff" stroke="#2b1a24" stroke-width="1.3" stroke-linejoin="round"/>',
};

const OUTLINE = 'stroke="#2b1a24" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"';

/** Body shapes per type. `c` is the fill color. Marks are drawn at each type's "mark spot". */
const SHAPES = {
  bottle: (c) => ({
    body: `<rect x="40" y="10" width="20" height="12" rx="3" fill="#e9eef8" ${OUTLINE}/><path d="M34 34q0-10 10-10h12q10 0 10 10v48q0 8-8 8H42q-8 0-8-8z" fill="${c}" ${OUTLINE}/><path d="M40 38v40" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>`,
    mark: [52, 58],
  }),
  lunchbox: (c) => ({
    body: `<rect x="16" y="34" width="68" height="46" rx="10" fill="${c}" ${OUTLINE}/><path d="M16 48h68" ${OUTLINE} fill="none"/><path d="M40 34v-6q0-6 6-6h8q6 0 6 6v6" fill="none" ${OUTLINE}/><rect x="44" y="44" width="12" height="8" rx="2" fill="#fff" ${OUTLINE}/>`,
    mark: [50, 66],
  }),
  cap: (c) => ({
    body: `<path d="M22 60q0-30 28-30t28 30z" fill="${c}" ${OUTLINE}/><path d="M22 60q-14 2-12 10 20-6 40-8" fill="${c}" ${OUTLINE}/><circle cx="50" cy="30" r="3.4" fill="#fff" ${OUTLINE}/>`,
    mark: [52, 47],
  }),
  hoodie: (c) => ({
    body: `<path d="M36 22q14-12 28 0l18 10-6 18-8-4v36H32V46l-8 4-6-18z" fill="${c}" ${OUTLINE}/><path d="M36 22q14 16 28 0" fill="none" ${OUTLINE}/><path d="M50 34v48" ${OUTLINE} fill="none"/><path d="M38 64h24v10H38z" fill="none" ${OUTLINE} opacity=".7"/>`,
    mark: [40, 50],
  }),
  pencilcase: (c) => ({
    body: `<rect x="12" y="38" width="76" height="34" rx="14" fill="${c}" ${OUTLINE}/><path d="M22 50h56" stroke="#2b1a24" stroke-width="2.4" stroke-dasharray="3 4" stroke-linecap="round"/><circle cx="80" cy="50" r="4" fill="#fff" ${OUTLINE}/>`,
    mark: [44, 62],
  }),
  bag: (c) => ({
    body: `<path d="M38 28v-6q0-8 12-8t12 8v6" fill="none" ${OUTLINE}/><rect x="24" y="28" width="52" height="60" rx="16" fill="${c}" ${OUTLINE}/><rect x="34" y="56" width="32" height="22" rx="6" fill="#fff" opacity=".35" ${OUTLINE}/>`,
    mark: [50, 44],
  }),
  glasses: (c) => ({
    body: `<circle cx="32" cy="54" r="15" fill="#fff" stroke="${c}" stroke-width="6"/><circle cx="68" cy="54" r="15" fill="#fff" stroke="${c}" stroke-width="6"/><path d="M47 52q3-4 6 0" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/><path d="M17 50 8 42M83 50l9-8" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`,
    mark: null,
  }),
  umbrella: (c) => ({
    body: `<path d="M10 52q4-34 40-34t40 34q-7-8-13 0-7-8-14 0-6-8-13 0-7-8-14 0-6-8-13 0-7-8-13 0z" fill="${c}" ${OUTLINE}/><path d="M50 50v30q0 8-8 8t-8-8" fill="none" ${OUTLINE}/>`,
    mark: [50, 34],
  }),
  ball: (c) => ({
    body: `<circle cx="50" cy="54" r="32" fill="${c}" ${OUTLINE}/><path d="M22 40q28 14 56 0M22 68q28-14 56 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`,
    mark: [50, 54],
  }),
  scarf: (c) => ({
    body: `<path d="M18 30q32-16 64 0l-4 16q-28-12-56 0z" fill="${c}" ${OUTLINE}/><path d="M56 40l14 4-6 44-14-4z" fill="${c}" ${OUTLINE}/><path d="M52 84l-3 8M58 86l-2 8M64 88l-1 8" ${OUTLINE} fill="none"/>`,
    mark: [62, 62],
  }),
  keys: (c) => ({
    body: `<circle cx="34" cy="40" r="16" fill="none" stroke="${c}" stroke-width="7"/><path d="M46 52l34 30M66 70l8-8M74 78l8-8" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`,
    mark: null,
  }),
  headphones: (c) => ({
    body: `<path d="M22 62V52q0-28 28-28t28 28v10" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/><rect x="14" y="56" width="18" height="28" rx="8" fill="${c}" ${OUTLINE}/><rect x="68" y="56" width="18" height="28" rx="8" fill="${c}" ${OUTLINE}/>`,
    mark: null,
  }),
  tag: (c) => ({
    body: `<path d="M26 22h34l22 26-22 30H26q-8 0-8-8V30q0-8 8-8z" fill="${c}" ${OUTLINE}/><circle cx="32" cy="50" r="5" fill="#fff" ${OUTLINE}/><path d="M44 42h18M44 54h24" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`,
    mark: null,
  }),
};

export const ITEM_TYPES = Object.keys(SHAPES);

/**
 * Returns an inline SVG string for an item.
 * @param {string} type one of ITEM_TYPES
 * @param {string} hex  fill color
 * @param {string} [mark] optional key of MARKS
 * @param {string} [label] accessible label; omitted = decorative
 */
export function itemSvg(type, hex = FALLBACK_COLOR, mark = "", label = "") {
  const shape = (SHAPES[type] || SHAPES.tag)(hex);
  const markSvg = mark && MARKS[mark] && shape.mark ? `<g transform="translate(${shape.mark[0]} ${shape.mark[1]})">${MARKS[mark]}</g>` : "";
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="item-svg" viewBox="0 0 100 100" ${a11y}>${shape.body}${markSvg}</svg>`;
}

/** Illustration for a board item coming from the server (title + category + Hebrew color). */
export function itemSvgFromRecord(item) {
  const type = guessType(item.title, item.category);
  const marks = [
    ["dino", "דינוז"],
    ["unicorn", "חד"],
    ["star", "כוכב"],
    ["heart", "לב"],
    ["stripes", "פסים"],
  ];
  const mark = (marks.find(([, w]) => (item.title || "").includes(w)) || [""])[0];
  return itemSvg(type, colorHex(item.color || item.title), mark);
}
