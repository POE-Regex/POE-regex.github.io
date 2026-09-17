import { useState, useCallback, useSyncExternalStore } from 'react';
import { categories, getItemData, type ItemType, type Modifier } from './data';
import Bases from './pages/Bases';
import Guide from './pages/Guide';

const MAX_REGEX_LEN = 250;

// ── simple hash router ──────────────────────────────────────────────────────

function getHash() {
  return window.location.hash.replace(/^#\/?/, '') || 'affixes';
}

function useHash() {
  return useSyncExternalStore(
    (cb) => { window.addEventListener('hashchange', cb); return () => window.removeEventListener('hashchange', cb); },
    getHash,
    getHash,
  );
}

function navigate(page: string) {
  window.location.hash = page;
}

// ── attribute dot ───────────────────────────────────────────────────────────

const STR_C = '#ef4444';
const DEX_C = '#22c55e';
const INT_C = '#3b82f6';

// Explicit attribute assignments for items that don't encode attrs in their ID.
// Items not listed here fall back to ID-parsing (armour, helmets, gloves, boots, shields).
// Items listed as 'none' render no dot.
const ITEM_ATTRS: Record<string, string> = {
  // 1H Weapons
  claws: 'dex-int',
  daggers: 'dex-int',
  'rune-daggers': 'dex-int',
  'one-handed-axes': 'str-dex',
  'one-handed-maces': 'str',
  'one-handed-swords': 'str-dex',
  'thrusting-swords': 'dex',
  sceptres: 'str-int',
  wands: 'int',
  'minion-wands': 'int',
  // 2H Weapons
  bows: 'dex',
  'fishing-rods': 'str-dex',
  staves: 'str-int',
  warstaves: 'str-int',
  'two-handed-axes': 'str-dex',
  'two-handed-maces': 'str',
  'two-handed-swords': 'str-dex',
  // Off-hands
  quivers: 'dex',
  'minion-shields': 'int',
  'boots-runic': 'str-dex-int', 'gloves-runic': 'str-dex-int', 'helmets-runic': 'str-dex-int',
  // Jewelry, Jewels, Flasks — no dot
  amulets: 'none', belts: 'none', rings: 'none', 'unset-ring': 'none', 'minion-rings': 'none',
  'cobalt-jewel': 'int', 'crimson-jewel': 'str', 'viridian-jewel': 'dex', 'prismatic-jewel': 'str-dex-int',
  'large-cluster-jewel': 'none', 'medium-cluster-jewel': 'none', 'small-cluster-jewel': 'none',
  'ghastly-eye-jewel': 'none', 'hypnotic-eye-jewel': 'none', 'murderous-eye-jewel': 'none', 'searching-eye-jewel': 'none',
  'life-flasks': 'none', 'mana-flasks': 'none', 'hybrid-flasks': 'none',
  'iron-flask': 'none', tinctures: 'none', 'utility-flasks': 'none',
};

function AttributeDot({ id }: { id: string }) {
  // Check explicit override first; fall back to ID-parsing for armour items
  const override = ITEM_ATTRS[id];
  const key = override ?? id;
  if (key === 'none') return <span className="flex-shrink-0 w-5 h-5" />;

  const str = key.includes('str');
  const dex = key.includes('dex');
  const int = key.includes('int');
  const count = [str, dex, int].filter(Boolean).length;

  if (count === 0) {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" className="flex-shrink-0">
        <circle cx="10" cy="10" r="7" fill="rgba(51,65,85,0.7)" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
      </svg>
    );
  }

  if (count === 1) {
    const c = str ? STR_C : dex ? DEX_C : INT_C;
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" className="flex-shrink-0">
        <circle cx="10" cy="10" r="7" fill={c + '45'} stroke={c + '99'} strokeWidth="1.5"/>
      </svg>
    );
  }

  if (count === 2) {
    const colors: string[] = [];
    if (str) colors.push(STR_C);
    if (dex) colors.push(DEX_C);
    if (int) colors.push(INT_C);
    const uid = id.replace(/[^a-z0-9]/g, '-');
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" className="flex-shrink-0">
        <defs>
          <clipPath id={`cl-${uid}`}><rect x="0" y="0" width="10" height="20"/></clipPath>
          <clipPath id={`cr-${uid}`}><rect x="10" y="0" width="10" height="20"/></clipPath>
        </defs>
        <circle cx="10" cy="10" r="7" fill={colors[0] + '50'} stroke={colors[0] + 'aa'} strokeWidth="1.5" clipPath={`url(#cl-${uid})`}/>
        <circle cx="10" cy="10" r="7" fill={colors[1] + '50'} stroke={colors[1] + 'aa'} strokeWidth="1.5" clipPath={`url(#cr-${uid})`}/>
      </svg>
    );
  }

  // Triple: conic gradient div
  return (
    <span className="flex-shrink-0 inline-block rounded-full" style={{
      width: 20, height: 20,
      background: `conic-gradient(${STR_C}70 0deg 120deg, ${DEX_C}70 120deg 240deg, ${INT_C}70 240deg 360deg)`,
      outline: '1.5px solid rgba(255,255,255,0.18)',
      outlineOffset: '-1px',
    }}/>
  );
}

// ── search filter ───────────────────────────────────────────────────────────

function modMatchesSearch(mod: Modifier, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (mod.groupName.toLowerCase().includes(q)) return true;
  if (mod.sectionName.toLowerCase().includes(q)) return true;
  if (mod.tags.some((t) => t.toLowerCase().includes(q))) return true;
  if (mod.tiers.some((t) => t.modifier.toLowerCase().includes(q) || t.stats.toLowerCase().includes(q))) return true;
  return false;
}

// ── modifier card ───────────────────────────────────────────────────────────

function ModifierCard({
  modifier,
  isPrefix,
  selectedModifiers,
  onToggleTier,
}: {
  modifier: Modifier;
  isPrefix: boolean;
  selectedModifiers: string[];
  onToggleTier: (mod: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const tagClass = isPrefix
    ? 'border-cyan-300/15 bg-cyan-300/10 text-cyan-100'
    : 'border-amber-300/15 bg-amber-300/10 text-amber-100';
  const tierSelectedClass = isPrefix
    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
    : 'border-amber-400 bg-amber-500/20 text-amber-100';
  const tierCheckClass = isPrefix ? 'text-cyan-400' : 'text-amber-400';
  const tierHeaderClass = isPrefix ? 'text-cyan-300' : 'text-amber-300';
  const hoverBorder = isPrefix ? 'hover:border-cyan-500/40' : 'hover:border-amber-500/40';
  const anySelected = modifier.tiers.some((t) => selectedModifiers.includes(t.modifier));

  return (
    <article
      className={`rounded-2xl border p-4 transition ${hoverBorder} cursor-pointer select-none ${
        anySelected ? 'border-white/20 bg-slate-950/80' : 'border-white/10 bg-slate-950/60'
      }`}
      onClick={() => setExpanded((v) => !v)}
      tabIndex={0}
      role="button"
      onKeyPress={(e) => e.key === 'Enter' && setExpanded((v) => !v)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold text-slate-50 leading-snug">{modifier.groupName}</p>
          <p className="mt-0.5 text-xs text-slate-500">{modifier.sectionName}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {anySelected && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isPrefix ? 'bg-cyan-500/20 text-cyan-300' : 'bg-amber-500/20 text-amber-300'}`}>
              active
            </span>
          )}
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            {modifier.tierCount}t
          </span>
          <span
            className="text-slate-500 text-xs flex-shrink-0"
            style={{ display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}
          >
            ▾
          </span>
        </div>
      </div>

      {modifier.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {modifier.tags.map((tag) => (
            <span key={tag} className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] ${tagClass}`}>
              {tag.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {expanded && modifier.tiers.length > 0 && (
        <div className="mt-4 border-t border-white/10 pt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${tierHeaderClass}`}>
            Select Tiers for Regex:
          </p>
          <div className="grid gap-1.5">
            {modifier.tiers.map((tier) => {
              const isSelected = selectedModifiers.includes(tier.modifier);
              return (
                <button
                  key={tier.modifier}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onToggleTier(tier.modifier); }}
                  className={`w-full rounded-xl border p-2.5 text-left text-xs transition flex items-start justify-between gap-2 ${
                    isSelected ? tierSelectedClass : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {tier.modifier}
                      </span>
                      <span className="text-slate-500 text-[10px]">iLvl {tier.ilvl}</span>
                    </div>
                    <div className="text-slate-400 mt-0.5 text-[11px] leading-relaxed" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {tier.stats}
                    </div>
                  </div>
                  {isSelected && <span className={`${tierCheckClass} font-bold text-sm flex-shrink-0 mt-0.5`}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}

// ── affix section ───────────────────────────────────────────────────────────

function AffixSection({ item, selectedModifiers, onToggleTier, searchQuery }: {
  item: ItemType;
  selectedModifiers: string[];
  onToggleTier: (mod: string) => void;
  searchQuery: string;
}) {
  const filteredPrefixes = item.prefixes.filter((m) => modMatchesSearch(m, searchQuery));
  const filteredSuffixes = item.suffixes.filter((m) => modMatchesSearch(m, searchQuery));
  const isFiltering = searchQuery.trim().length > 0;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-5 shadow-lg shadow-cyan-950/10">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Prefixes</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-50">Prefix mod groups</h2>
          </div>
          <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold tabular-nums tracking-[0.2em] text-cyan-100">
            {isFiltering ? `${filteredPrefixes.length} / ${item.prefixes.length}` : item.prefixes.length}
          </span>
        </div>
        <div className="grid gap-2">
          {filteredPrefixes.length ? (
            filteredPrefixes.map((mod, i) => (
              <ModifierCard
                key={`${mod.sectionName}::${mod.groupName}::${i}`}
                modifier={mod} isPrefix selectedModifiers={selectedModifiers} onToggleTier={onToggleTier}
              />
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
              {isFiltering ? `No prefixes match "${searchQuery}".` : 'No prefix mod groups available.'}
            </p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-amber-300/20 bg-amber-300/5 p-5 shadow-lg shadow-amber-950/10">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">Suffixes</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-50">Suffix mod groups</h2>
          </div>
          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold tabular-nums tracking-[0.2em] text-amber-100">
            {isFiltering ? `${filteredSuffixes.length} / ${item.suffixes.length}` : item.suffixes.length}
          </span>
        </div>
        <div className="grid gap-2">
          {filteredSuffixes.length ? (
            filteredSuffixes.map((mod, i) => (
              <ModifierCard
                key={`${mod.sectionName}::${mod.groupName}::${i}`}
                modifier={mod} isPrefix={false} selectedModifiers={selectedModifiers} onToggleTier={onToggleTier}
              />
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
              {isFiltering ? `No suffixes match "${searchQuery}".` : 'No suffix mod groups available.'}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

// ── base item data (populate per item type when available) ──────────────────

// Maps item type ID → array of [baseName, imageUrl] pairs.
// imageUrl can be left as '' until assets are provided.
export const BASE_ITEMS: Record<string, string[]> = {
  // ── Jewels (single base → auto-selects, no popup) ─────────────────────────
  'cobalt-jewel':          ['Cobalt Jewel'],
  'crimson-jewel':         ['Crimson Jewel'],
  'viridian-jewel':        ['Viridian Jewel'],
  'prismatic-jewel':       ['Prismatic Jewel'],
  'large-cluster-jewel':   ['Large Cluster Jewel'],
  'medium-cluster-jewel':  ['Medium Cluster Jewel'],
  'small-cluster-jewel':   ['Small Cluster Jewel'],
  'ghastly-eye-jewel':     ['Ghastly Eye Jewel'],
  'hypnotic-eye-jewel':    ['Hypnotic Eye Jewel'],
  'murderous-eye-jewel':   ['Murderous Eye Jewel'],
  'searching-eye-jewel':   ['Searching Eye Jewel'],

  // ── Jewelry ────────────────────────────────────────────────────────────────
  amulets: [
    'Coral Amulet','Paua Amulet','Amber Amulet','Jade Amulet','Lapis Amulet',
    'Unset Amulet','Gold Amulet','Pearlescent Amulet','Agate Amulet','Citrine Amulet',
    'Turquoise Amulet','Onyx Amulet','Focused Amulet','Simplex Amulet','Astrolabe Amulet',
    'Marble Amulet','Seaglass Amulet','Blue Pearl Amulet',
    'Black Maw Talisman','Chieftain Talisman','Chimeral Talisman','Devourer Talisman',
    'Gargantuan Talisman','Goatman Talisman','Goliath Talisman','Greatwolf Talisman',
    'Plagued Arachnid Talisman','Rhoa Talisman','Sand Spitter Talisman','Savage Crab Talisman',
    'Shield Crab Talisman','Squid Talisman','Watcher Talisman','Wolf Alpha Talisman',
    'Ape Talisman','Black Widow Talisman','Blood Viper Talisman','Carrion Queen Talisman',
    'Cobra Talisman','Flame Hellion Talisman','Frost Hellion Talisman','Lynx Talisman',
    'Magma Hound Talisman','Pitbull Talisman','Retch Talisman','Scorpion Talisman',
    'Scrabbler Talisman','Taurus Talisman','Ursa Talisman','Croaker Talisman',
    'Great Maw Talisman','Hybrid Arachnid Talisman','Octopus Talisman','Rhex Talisman',
    'Spider Crab Talisman','Tiger Talisman','Vulture Talisman',
    'Craicic Talisman','Farric Talisman','Fenumal Talisman','Saqawine Talisman',
  ],
  belts: [
    'Chain Belt','Cord Belt','Rustic Sash','Stygian Vise','Heavy Belt',
    'Leather Belt','Cloth Belt','Studded Belt','Micro-Distillery Belt',
    'Mechanical Belt','Vanguard Belt','Crystal Belt',
  ],
  rings: [
    'Coral Ring','Iron Ring','Paua Ring','Unset Ring','Sapphire Ring','Topaz Ring',
    'Ruby Ring','Diamond Ring','Gold Ring','Moonstone Ring',
    'Two-Stone Ring (Fire+Cold)','Two-Stone Ring (Cold+Lightning)','Two-Stone Ring (Fire+Lightning)',
    'Cogwork Ring','Composite Ring','Dusk Ring','Geodesic Ring','Gloam Ring',
    'Helical Ring','Manifold Ring','Nameless Ring','Penumbra Ring','Ratcheting Ring',
    'Shadowed Ring (Fire)','Shadowed Ring (Cold)','Shadowed Ring (Lightning)',
    'Tenebrous Ring','Bone Ring','Amethyst Ring','Prismatic Ring','Cryonic Ring',
    'Enthalpic Ring','Fugitive Ring','Organic Ring','Synaptic Ring','Formless Ring',
    'Cerulean Ring','Iolite Ring','Opal Ring','Steel Ring','Vermillion Ring',
  ],
  'unset-ring': ['Unset Ring'],
  'minion-rings': ['Bone Ring','Gloam Ring'],

  // ── Body Armours ───────────────────────────────────────────────────────────
  'body-armours-str': [
    'Plate Vest','Chestplate','Copper Plate','War Plate','Full Plate','Arena Plate',
    'Lordly Plate','Bronze Plate','Battle Plate','Sun Plate','Colosseum Plate',
    'Majestic Plate','Golden Plate','Crusader Plate','Astral Plate','Gladiator Plate',
    'Glorious Plate','Titan Plate','Legion Plate','Royal Plate',
  ],
  'body-armours-dex': [
    'Shabby Jerkin','Strapped Leather','Buckskin Tunic','Wild Leather','Full Leather',
    'Sun Leather','Thief\'s Garb','Eelskin Tunic','Frontier Leather','Glorious Leather',
    'Coronal Leather','Cutthroat\'s Garb','Sharkskin Tunic','Destiny Leather',
    'Exquisite Leather','Zodiac Leather','Assassin\'s Garb','Supreme Leather',
    'Astral Leather','Syndicate\'s Garb',
  ],
  'body-armours-int': [
    'Simple Robe','Silken Vest','Scholar\'s Robe','Silken Garb','Mage\'s Vestment',
    'Silk Robe','Cabalist Regalia','Sage\'s Robe','Silken Wrap','Conjurer\'s Vestment',
    'Spidersilk Robe','Destroyer Regalia','Savant\'s Robe','Necromancer Silks',
    'Occultist\'s Vestment','Widowsilk Robe','Vaal Regalia','Arcane Vestment',
    'Nightweave Robe','Twilight Regalia',
  ],
  'body-armours-str-dex': [
    'Scale Vest','Light Brigandine','Scale Doublet','Infantry Brigandine','Full Scale Armour',
    'Soldier\'s Brigandine','Field Lamellar','Wyrmscale Doublet','Hussar Brigandine',
    'Full Wyrmscale','Commander\'s Brigandine','Battle Lamellar','Dragonscale Doublet',
    'Desert Brigandine','Full Dragonscale','General\'s Brigandine','Triumphant Lamellar',
    'Full Wyvernscale','Marshall\'s Brigandine','Conquest Lamellar',
  ],
  'body-armours-str-int': [
    'Chainmail Vest','Chainmail Tunic','Ringmail Coat','Chainmail Doublet','Full Ringmail',
    'Full Chainmail','Holy Chainmail','Latticed Ringmail','Crusader Chainmail','Ornate Ringmail',
    'Chain Hauberk','Devout Chainmail','Loricated Ringmail','Conquest Chainmail',
    'Elegant Ringmail','Saint\'s Hauberk','Saintly Chainmail','Grand Ringmail',
    'Paladin\'s Hauberk','Sacred Chainmail',
  ],
  'body-armours-dex-int': [
    'Padded Vest','Oiled Vest','Padded Jacket','Oiled Coat','Scarlet Raiment',
    'Waxed Garb','Bone Armour','Quilted Jacket','Sleek Coat','Crimson Raiment',
    'Lacquered Garb','Crypt Armour','Sentinel Jacket','Varnished Coat','Blood Raiment',
    'Sadist Garb','Carnal Armour','Sanguine Raiment','Torturer Garb','Necrotic Armour',
  ],
  'body-armours-str-dex-int': ['Grasping Mail','Sacrificial Garb'],

  // ── Boots ──────────────────────────────────────────────────────────────────
  'boots-str': [
    'Iron Greaves','Steel Greaves','Basemetal Treads','Plated Greaves','Reinforced Greaves',
    'Antique Greaves','Ancient Greaves','Darksteel Treads','Goliath Greaves','Vaal Greaves',
    'Titan Greaves','Precursor Greaves','Brimstone Treads','Leviathan Greaves',
  ],
  'boots-dex': [
    'Rawhide Boots','Goathide Boots','Cloudwhisper Boots','Deerskin Boots','Nubuck Boots',
    'Eelskin Boots','Sharkskin Boots','Windbreak Boots','Shagreen Boots','Stealth Boots',
    'Slink Boots','Harpyskin Boots','Stormrider Boots','Velour Boots',
  ],
  'boots-int': [
    'Wool Shoes','Velvet Slippers','Duskwalk Slippers','Silk Slippers','Scholar Boots',
    'Satin Slippers','Samite Slippers','Nightwind Slippers','Conjurer Boots',
    'Arcanist Slippers','Sorcerer Boots','Sage Slippers','Dreamquest Slippers','Warlock Boots',
  ],
  'boots-str-dex': [
    'Leatherscale Boots','Ironscale Boots','Bronzescale Boots','Steelscale Boots',
    'Serpentscale Boots','Wyrmscale Boots','Hydrascale Boots','Dragonscale Boots',
    'Two-Toned Boots (Str/Dex)','Chimerascale Boots','Wyvernscale Boots',
  ],
  'boots-str-int': [
    'Chain Boots','Ringmail Boots','Mesh Boots','Riveted Boots','Zealot Boots',
    'Soldier Boots','Legion Boots','Crusader Boots','Two-Toned Boots (Str/Int)',
    'Martyr Boots','Paladin Boots',
  ],
  'boots-dex-int': [
    'Wrapped Boots','Strapped Boots','Clasped Boots','Shackled Boots','Trapper Boots',
    'Ambush Boots','Carnal Boots','Assassin\'s Boots','Murder Boots','Fugitive Boots',
    'Two-Toned Boots (Dex/Int)','Infiltrator Boots','Phantom Boots',
  ],
  'boots-runic': ['Runic Greaves','Runic Sollerets','Runic Sabatons'],

  // ── Gloves ─────────────────────────────────────────────────────────────────
  'gloves-str': [
    'Iron Gauntlets','Plated Gauntlets','Preserving Gauntlets','Bronze Gauntlets',
    'Steel Gauntlets','Antique Gauntlets','Guarding Gauntlets','Ancient Gauntlets',
    'Goliath Gauntlets','Vaal Gauntlets','Titan Gauntlets','Spiked Gloves',
    'Thwarting Gauntlets','Precursor Gauntlets','Leviathan Gauntlets',
  ],
  'gloves-dex': [
    'Rawhide Gloves','Goathide Gloves','Tinker Gloves','Deerskin Gloves','Nubuck Gloves',
    'Eelskin Gloves','Apprentice Gloves','Sharkskin Gloves','Shagreen Gloves','Stealth Gloves',
    'Gripped Gloves','Slink Gloves','Trapsetter Gloves','Harpyskin Gloves','Velour Gloves',
  ],
  'gloves-int': [
    'Wool Gloves','Leyline Gloves','Velvet Gloves','Silk Gloves','Embroidered Gloves',
    'Aetherwind Gloves','Satin Gloves','Samite Gloves','Conjurer Gloves','Arcanist Gloves',
    'Sorcerer Gloves','Fingerless Silk Gloves','Nexus Gloves','Sage Gloves','Warlock Gloves',
  ],
  'gloves-str-dex': [
    'Fishscale Gauntlets','Ironscale Gauntlets','Bronzescale Gauntlets','Steelscale Gauntlets',
    'Serpentscale Gauntlets','Wyrmscale Gauntlets','Hydrascale Gauntlets',
    'Dragonscale Gauntlets','Chimerascale Gauntlets','Wyvernscale Gauntlets',
  ],
  'gloves-str-int': [
    'Chain Gloves','Ringmail Gloves','Mesh Gloves','Riveted Gloves','Zealot Gloves',
    'Soldier Gloves','Legion Gloves','Crusader Gloves','Apothecary\'s Gloves',
    'Martyr Gloves','Paladin Gloves',
  ],
  'gloves-dex-int': [
    'Wrapped Mitts','Strapped Mitts','Clasped Mitts','Trapper Mitts','Ambush Mitts',
    'Carnal Mitts','Assassin\'s Mitts','Murder Mitts','Infiltrator Mitts','Phantom Mitts',
  ],
  'gloves-runic': ['Runic Gloves','Runic Gages','Runic Gauntlets'],

  // ── Helmets ────────────────────────────────────────────────────────────────
  'helmets-str': [
    'Iron Hat','Cone Helmet','Barbute Helmet','Close Helmet','Gladiator Helmet',
    'Reaver Helmet','Siege Helmet','Samnite Helmet','Ezomyte Burgonet','Royal Burgonet',
    'Eternal Burgonet','General\'s Helmet','Conqueror\'s Helmet','Giantslayer Helmet',
  ],
  'helmets-dex': [
    'Leather Cap','Tricorne','Leather Hood','Wolf Pelt','Hunter Hood','Noble Tricorne',
    'Ursine Pelt','Silken Hood','Sinner Tricorne','Lion Pelt','Dire Pelt',
    'Grizzly Pelt','Majestic Pelt',
  ],
  'helmets-int': [
    'Vine Circlet','Iron Circlet','Torture Cage','Tribal Circlet','Bone Circlet',
    'Lunaris Circlet','Steel Circlet','Necromancer Circlet','Solaris Circlet','Mind Cage',
    'Hubris Circlet','Moonlit Circlet','Sunfire Circlet','Lich\'s Circlet',
  ],
  'helmets-str-dex': [
    'Battered Helm','Sallet','Sorrow Mask','Visored Sallet','Gilded Sallet','Secutor Helm',
    'Fencer Helm','Atonement Mask','Lacquered Helmet','Fluted Bascinet','Pig-Faced Bascinet',
    'Nightmare Bascinet','Knight Helm','Penitent Mask','Conquest Helmet','Haunted Bascinet',
  ],
  'helmets-str-int': [
    'Rusted Coif','Soldier Helmet','Imp Crown','Great Helmet','Crusader Helmet',
    'Aventail Helmet','Zealot Helmet','Demon Crown','Great Crown','Magistrate Crown',
    'Prophet Crown','Praetor Crown','Bone Helmet','Faithful Helmet','Archdemon Crown',
    'Paladin Crown','Divine Crown',
  ],
  'helmets-dex-int': [
    'Scare Mask','Plague Mask','Gale Crown','Iron Mask','Festival Mask','Golden Mask',
    'Raven Mask','Callous Mask','Winter Crown','Regicide Mask','Harlequin Mask',
    'Vaal Mask','Deicide Mask','Jester Mask','Blizzard Crown','Ancient Mask','Torturer\'s Mask',
  ],
  'helmets-runic': ['Runic Helm','Runic Crest','Runic Crown'],

  // ── Shields ────────────────────────────────────────────────────────────────
  'shields-str': [
    'Splintered Tower Shield','Corroded Tower Shield','Rawhide Tower Shield','Cedar Tower Shield',
    'Copper Tower Shield','Reinforced Tower Shield','Painted Tower Shield','Buckskin Tower Shield',
    'Mahogany Tower Shield','Bronze Tower Shield','Magmatic Tower Shield','Girded Tower Shield',
    'Crested Tower Shield','Shagreen Tower Shield','Ebony Tower Shield','Ezomyte Tower Shield',
    'Colossal Tower Shield','Heat-attuned Tower Shield','Pinnacle Tower Shield',
  ],
  'shields-dex': [
    'Goathide Buckler','Pine Buckler','Painted Buckler','Hammered Buckler','War Buckler',
    'Gilded Buckler','Oak Buckler','Enameled Buckler','Corrugated Buckler','Battle Buckler',
    'Polar Buckler','Golden Buckler','Ironwood Buckler','Lacquered Buckler','Vaal Buckler',
    'Crusader Buckler','Imperial Buckler','Cold-attuned Buckler',
  ],
  'shields-int': [
    'Twig Spirit Shield','Yew Spirit Shield','Tarnished Spirit Shield','Jingling Spirit Shield',
    'Brass Spirit Shield','Walnut Spirit Shield','Ancient Spirit Shield','Chiming Spirit Shield',
    'Subsuming Spirit Shield','Thorium Spirit Shield','Lacewood Spirit Shield','Vaal Spirit Shield',
    'Harmonic Spirit Shield','Titanium Spirit Shield','Transfer-attuned Spirit Shield',
  ],
  'minion-shields': ['Bone Spirit Shield','Ivory Spirit Shield','Fossilised Spirit Shield'],
  'shields-str-dex': [
    'Rotted Round Shield','Fir Round Shield','Studded Round Shield','Scarlet Round Shield',
    'Splendid Round Shield','Maple Round Shield','Spiked Round Shield','Crimson Round Shield',
    'Baroque Round Shield','Teak Round Shield','Spiny Round Shield','Cardinal Round Shield',
    'Elegant Round Shield',
  ],
  'shields-str-int': [
    'Plank Kite Shield','Linden Kite Shield','Reinforced Kite Shield','Layered Kite Shield',
    'Ceremonial Kite Shield','Etched Kite Shield','Steel Kite Shield','Laminated Kite Shield',
    'Angelic Kite Shield','Branded Kite Shield','Champion Kite Shield','Mosaic Kite Shield',
    'Archon Kite Shield',
  ],
  'shields-dex-int': [
    'Spiked Bundle','Driftwood Spiked Shield','Alloyed Spiked Shield','Burnished Spiked Shield',
    'Ornate Spiked Shield','Redwood Spiked Shield','Compound Spiked Shield','Polished Spiked Shield',
    'Sovereign Spiked Shield','Alder Spiked Shield','Ezomyte Spiked Shield',
    'Mirrored Spiked Shield','Supreme Spiked Shield',
  ],

  // ── 1H Weapons ─────────────────────────────────────────────────────────────
  claws: [
    'Nailed Fist','Sharktooth Claw','Awl','Cat\'s Paw','Blinder','Timeworn Claw',
    'Sparkling Claw','Fright Claw','Double Claw','Thresher Claw','Gouger','Tiger\'s Paw',
    'Gut Ripper','Prehistoric Claw','Malign Fangs','Noble Claw','Eagle Claw','Twin Claw',
    'Great White Claw','Throat Stabber','Hellion\'s Paw','Eye Gouger','Vaal Claw',
    'Imperial Claw','Terror Claw','Void Fangs','Gemini Claw',
  ],
  daggers: [
    'Glass Shank','Skinning Knife','Stiletto','Flaying Knife','Prong Dagger',
    'Poignard','Pressurised Dagger','Trisula','Gutting Knife','Ambusher',
    'Pneumatic Dagger','Sai',
  ],
  'rune-daggers': [
    'Carving Knife','Boot Knife','Copper Kris','Skean','Imp Dagger','Butcher Knife',
    'Boot Blade','Golden Kris','Flashfire Blade','Royal Skean','Fiend Dagger',
    'Slaughter Knife','Ezomyte Dagger','Platinum Kris','Imperial Skean',
    'Demon Dagger','Infernal Blade',
  ],
  'one-handed-axes': [
    'Rusted Hatchet','Jade Hatchet','Boarding Axe','Cleaver','Broad Axe','Arming Axe',
    'Decorative Axe','Spectral Axe','Etched Hatchet','Jasper Axe','Tomahawk',
    'Wrist Chopper','War Axe','Chest Splitter','Disapprobation Axe','Ceremonial Axe',
    'Wraith Axe','Engraved Hatchet','Karui Axe','Siege Axe','Reaver Axe','Butcher Axe',
    'Vaal Hatchet','Royal Axe','Infernal Axe','Psychotic Axe','Runic Hatchet',
  ],
  'one-handed-maces': [
    'Driftwood Club','Tribal Club','Spiked Club','Stone Hammer','War Hammer','Bladed Mace',
    'Ceremonial Mace','Dream Mace','Wyrm Mace','Petrified Club','Barbed Club','Rock Breaker',
    'Battle Hammer','Flanged Mace','Crack Mace','Ornate Mace','Phantom Mace','Dragon Mace',
    'Ancestral Club','Tenderizer','Gavel','Legion Hammer','Pernach','Auric Mace',
    'Nightmare Mace','Behemoth Mace','Boom Mace',
  ],
  'one-handed-swords': [
    'Charan\'s Sword','Rusted Sword','Copper Sword','Sabre','Broad Sword','War Sword',
    'Ancient Sword','Elegant Sword','Dusk Blade','Hook Sword','Variscite Blade','Cutlass',
    'Baselard','Battle Sword','Elder Sword','Capricious Spiritblade','Graceful Sword',
    'Twilight Blade','Grappler','Gemstone Sword','Corsair Sword','Gladius','Legion Sword',
    'Vaal Blade','Eternal Sword','Midnight Blade','Anarchic Spiritblade','Tiger Hook',
  ],
  'thrusting-swords': [
    'Rusted Spike','Whalebone Rapier','Battered Foil','Basket Rapier','Jagged Foil',
    'Antique Rapier','Elegant Foil','Thorn Rapier','Smallsword','Wyrmbone Rapier',
    'Burnished Foil','Estoc','Serrated Foil','Primeval Rapier','Fancy Foil','Apex Rapier',
    'Courtesan Sword','Dragonbone Rapier','Tempered Foil','Pecoraro','Spiraled Foil',
    'Vaal Rapier','Jewelled Foil','Harpy Rapier','Dragoon Sword',
  ],
  sceptres: [
    'Driftwood Sceptre','Darkwood Sceptre','Bronze Sceptre','Quartz Sceptre','Iron Sceptre',
    'Ochre Sceptre','Ritual Sceptre','Oscillating Sceptre','Shadow Sceptre','Grinning Fetish',
    'Horned Sceptre','Sekhem','Crystal Sceptre','Lead Sceptre','Blood Sceptre','Royal Sceptre',
    'Stabilising Sceptre','Abyssal Sceptre','Stag Sceptre','Karui Sceptre','Tyrant\'s Sekhem',
    'Opal Sceptre','Platinum Sceptre','Vaal Sceptre','Carnal Sceptre','Void Sceptre',
    'Alternating Sceptre','Sambar Sceptre',
  ],
  wands: [
    'Driftwood Wand','Goat\'s Horn','Somatic Wand','Quartz Wand','Spiraled Wand',
    'Sage Wand','Pagan Wand','Faun\'s Horn','Blasting Wand','Crystal Wand','Coiled Wand',
    'Congregator Wand','Omen Wand','Heathen Wand','Demon\'s Horn','Kinetic Wand',
    'Opal Wand','Tornado Wand','Prophecy Wand','Accumulator Wand','Profane Wand',
  ],
  'minion-wands': ['Calling Wand','Convening Wand','Convoking Wand'],

  // ── 2H Weapons ─────────────────────────────────────────────────────────────
  bows: [
    'Crude Bow','Short Bow','Long Bow','Composite Bow','Recurve Bow','Bone Bow','Royal Bow',
    'Death Bow','Grove Bow','Reflex Bow','Decurve Bow','Compound Bow','Sniper Bow','Ivory Bow',
    'Foundry Bow','Highborn Bow','Decimation Bow','Thicket Bow','Steelwood Bow','Citadel Bow',
    'Ranger Bow','Assassin Bow','Spine Bow','Imperial Bow','Harbinger Bow','Solarine Bow',
    'Maraketh Bow',
  ],
  'fishing-rods': ['Fishing Rod'],
  staves: [
    'Gnarled Branch','Primitive Staff','Long Staff','Royal Staff','Crescent Staff',
    'Woodful Staff','Quarterstaff','Reciprocation Staff','Highborn Staff','Moon Staff',
    'Primordial Staff','Lathi','Imperial Staff','Battery Staff','Eclipse Staff',
  ],
  warstaves: [
    'Iron Staff','Coiled Staff','Vile Staff','Military Staff','Serpentine Staff',
    'Potentiality Rod','Foul Staff','Ezomyte Staff','Maelström Staff','Judgement Staff',
    'Eventuality Rod',
  ],
  'two-handed-axes': [
    'Stone Axe','Jade Chopper','Woodsplitter','Poleaxe','Double Axe','Gilded Axe',
    'Shadow Axe','Dagger Axe','Jasper Chopper','Timber Axe','Headsman Axe','Labrys',
    'Honed Cleaver','Noble Axe','Abyssal Axe','Karui Chopper','Talon Axe','Sundering Axe',
    'Ezomyte Axe','Vaal Axe','Despot Axe','Void Axe','Apex Cleaver','Fleshripper',
  ],
  'two-handed-maces': [
    'Driftwood Maul','Tribal Maul','Mallet','Sledgehammer','Jagged Maul','Brass Maul',
    'Fright Maul','Morning Star','Totemic Maul','Great Mallet','Steelhead','Spiny Maul',
    'Crushing Force Magnifier','Plated Maul','Dread Maul','Solar Maul','Karui Maul',
    'Colossus Mallet','Piledriver','Meatgrinder','Imperial Maul','Terror Maul',
    'Coronal Maul','Impact Force Propagator',
  ],
  'two-handed-swords': [
    'Corroded Blade','Longsword','Bastard Sword','Two-Handed Sword','Etched Greatsword',
    'Ornate Sword','Spectral Sword','Curved Blade','Butcher Sword','Footman Sword',
    'Highland Blade','Engraved Greatsword','Blasting Blade','Tiger Sword','Wraith Sword',
    'Lithe Blade','Headman\'s Sword','Reaver Sword','Ezomyte Blade','Vaal Greatsword',
    'Lion Sword','Infernal Sword','Banishing Blade','Exquisite Blade',
  ],

  // ── Flasks ─────────────────────────────────────────────────────────────────
  'life-flasks': [
    'Small Life Flask','Medium Life Flask','Large Life Flask','Greater Life Flask',
    'Grand Life Flask','Giant Life Flask','Colossal Life Flask','Sacred Life Flask',
    'Hallowed Life Flask','Sanctified Life Flask','Divine Life Flask','Eternal Life Flask',
  ],
  'mana-flasks': [
    'Small Mana Flask','Medium Mana Flask','Large Mana Flask','Greater Mana Flask',
    'Grand Mana Flask','Giant Mana Flask','Colossal Mana Flask','Sacred Mana Flask',
    'Hallowed Mana Flask','Sanctified Mana Flask','Divine Mana Flask','Eternal Mana Flask',
  ],
  'hybrid-flasks': [
    'Small Hybrid Flask','Medium Hybrid Flask','Large Hybrid Flask',
    'Colossal Hybrid Flask','Sacred Hybrid Flask','Hallowed Hybrid Flask',
  ],
  'iron-flask': ['Iron Flask'],
  quivers: [
    'Serrated Arrow Quiver','Fire Arrow Quiver','Sharktooth Arrow Quiver','Feathered Arrow Quiver',
    'Penetrating Arrow Quiver','Blunt Arrow Quiver','Two-Point Arrow Quiver','Spike-Point Arrow Quiver',
    'Blazing Arrow Quiver','Ornate Quiver','Broadhead Arrow Quiver','Vile Arrow Quiver',
    'Heavy Arrow Quiver','Primal Arrow Quiver','Artillery Quiver',
  ],
  tinctures: [
    'Ironwood Tincture','Prismatic Tincture','Rosethorn Tincture','Ashbark Tincture',
    'Borealwood Tincture','Fulgurite Tincture','Blood Sap Tincture','Poisonberry Tincture',
    'Sporebloom Tincture','Oakbranch Tincture',
  ],
  'utility-flasks': [
    'Quicksilver Flask','Bismuth Flask','Amethyst Flask','Ruby Flask','Sapphire Flask',
    'Topaz Flask','Aquamarine Flask','Basalt Flask','Corundum Flask','Diamond Flask',
    'Gold Flask','Granite Flask','Iron Flask','Jade Flask','Quartz Flask','Silver Flask',
    'Stibnite Flask','Sulphur Flask',
  ],
};

// ── base picker modal ────────────────────────────────────────────────────────

function BasePickerModal({ itemId, onSelect, onClose }: {
  itemId: string;
  onSelect: (base: string) => void;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState('');
  const bases = BASE_ITEMS[itemId] ?? [];
  const filtered = bases.filter((b) => b.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" style={{ backdropFilter: 'blur(6px)' }} />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 shadow-2xl flex flex-col"
        style={{ maxHeight: '60vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 p-5 border-b border-white/10 flex-shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Select Base Item</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-100">Choose which base to filter for</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
          >✕</button>
        </div>

        {bases.length > 8 && (
          <div className="p-3 border-b border-white/10 flex-shrink-0">
            <input
              type="text"
              placeholder="Filter bases…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-cyan-500/40"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3">
          {bases.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-400 font-medium">Base item data not yet loaded</p>
              <p className="mt-1 text-xs text-slate-600">Provide a base item list for this item type to enable this feature.</p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No bases match "{filter}".</p>
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map((name) => (
                <button
                  key={name}
                  onClick={() => onSelect(name)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-left text-sm text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-950/30 active:scale-[0.99]"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── affixes page ────────────────────────────────────────────────────────────

function AffixesPage() {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'weapons-1h': true,
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Open prefix / suffix state
  const [selectedBase, setSelectedBase] = useState<string | null>(null);
  const [openPrefixActive, setOpenPrefixActive] = useState(false);
  const [openSuffixActive, setOpenSuffixActive] = useState(false);
  const [basePopupFor, setBasePopupFor] = useState<'prefix' | 'suffix' | null>(null);

  const selectedItem = selectedItemId ? getItemData(selectedItemId) : null;

  // Build regex including open-slot terms
  const openTerms: string[] = [];
  if (openPrefixActive && selectedBase) openTerms.push(`^\\s*${selectedBase}`);
  if (openSuffixActive && selectedBase) openTerms.push(`${selectedBase}\\s*$`);
  const allTerms = [...selectedModifiers, ...openTerms];
  const regexString = allTerms.length ? `"${allTerms.join('|')}"` : '';
  const regexLen = regexString.length;
  const overWarn = regexLen > 220;

  const toggleTier = useCallback((modifier: string) => {
    setErrorMessage(null);
    setSelectedModifiers((prev) => {
      if (prev.includes(modifier)) return prev.filter((m) => m !== modifier);
      const next = [...prev, modifier];
      // account for open-slot terms already in the string
      const openLen = openTerms.join('|').length + (openTerms.length ? 1 : 0);
      const testStr = `"${next.join('|')}${openLen ? '|' + openTerms.join('|') : ''}"`;
      if (testStr.length > MAX_REGEX_LEN) {
        setErrorMessage('Cannot add: Reached the 250 character limit for PoE regex!');
        setTimeout(() => setErrorMessage(null), 3500);
        return prev;
      }
      return next;
    });
  }, [openTerms]);

  const handleReset = () => {
    setSelectedModifiers([]); setCopied(false); setErrorMessage(null);
    setSelectedBase(null); setOpenPrefixActive(false); setOpenSuffixActive(false); setBasePopupFor(null);
  };

  const copyToClipboard = async () => {
    if (!regexString) return;
    try { await navigator.clipboard.writeText(regexString); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* */ }
  };

  const selectItem = (id: string) => {
    if (id === selectedItemId) return;
    setSelectedItemId(id); setSelectedModifiers([]); setCopied(false); setErrorMessage(null); setSearchQuery('');
    setSelectedBase(null); setOpenPrefixActive(false); setOpenSuffixActive(false); setBasePopupFor(null);
  };

  function handleOpenPrefixClick() {
    if (openPrefixActive) { setOpenPrefixActive(false); return; }
    if (selectedBase !== null) { setOpenPrefixActive(true); return; }
    const bases = selectedItemId ? (BASE_ITEMS[selectedItemId] ?? []) : [];
    if (bases.length === 1) { setSelectedBase(bases[0]); setOpenPrefixActive(true); return; }
    setBasePopupFor('prefix');
  }

  function handleOpenSuffixClick() {
    if (openSuffixActive) { setOpenSuffixActive(false); return; }
    if (selectedBase !== null) { setOpenSuffixActive(true); return; }
    const bases = selectedItemId ? (BASE_ITEMS[selectedItemId] ?? []) : [];
    if (bases.length === 1) { setSelectedBase(bases[0]); setOpenSuffixActive(true); return; }
    setBasePopupFor('suffix');
  }

  function handleBaseSelect(base: string) {
    setSelectedBase(base);
    if (basePopupFor === 'prefix') setOpenPrefixActive(true);
    if (basePopupFor === 'suffix') setOpenSuffixActive(true);
    setBasePopupFor(null);
  }

  return (
    <>
    {basePopupFor && selectedItemId && (
      <BasePickerModal
        itemId={selectedItemId}
        onSelect={handleBaseSelect}
        onClose={() => setBasePopupFor(null)}
      />
    )}
    <div className="flex flex-1 min-h-0">
      {/* Sidebar */}
      <aside
        className="flex-shrink-0 flex flex-col border-r border-white/10 overflow-hidden transition-all duration-300 ease-out sticky top-[49px] self-start h-[calc(100vh-49px)]"
        style={{ width: sidebarExpanded ? '22rem' : '3.75rem', background: 'rgb(255 255 255 / 0.03)' }}
      >
        <div className="flex items-center gap-2 border-b border-white/10 p-3 flex-shrink-0">
          {sidebarExpanded && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 overflow-hidden whitespace-nowrap flex-1">
              Item Types
            </p>
          )}
          <div className={`flex items-center gap-1.5 ${sidebarExpanded ? '' : 'mx-auto'}`}>
            {sidebarExpanded && (selectedModifiers.length > 0 || openPrefixActive || openSuffixActive) && (
              <button
                onClick={handleReset}
                title="Clear selection"
                className="grid h-8 w-8 place-items-center rounded-xl border border-red-400/30 bg-slate-900/70 text-red-300 text-sm transition hover:border-red-400/60 hover:bg-red-950/40"
              >↺</button>
            )}
            <button
              onClick={() => setSidebarExpanded((v) => !v)}
              title={sidebarExpanded ? 'Collapse' : 'Expand'}
              className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-slate-900/70 text-slate-400 text-sm transition hover:border-cyan-400/40 hover:bg-slate-900 hover:text-slate-200"
            >
              {sidebarExpanded ? '◂' : '▸'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain flex flex-col gap-1 p-2">
          {categories.map((cat) => (
            <div key={cat.id}>
              <button
                onClick={() => sidebarExpanded && setExpandedCategories((p) => ({ ...p, [cat.id]: !p[cat.id] }))}
                className={`flex w-full items-center gap-2.5 rounded-xl border border-white/8 bg-slate-900/50 p-3 text-left transition hover:border-cyan-400/25 hover:bg-slate-900/80 ${!sidebarExpanded ? 'justify-center px-2' : ''}`}
              >
                <span className="text-base flex-shrink-0">{cat.icon}</span>
                {sidebarExpanded && (
                  <>
                    <span className="flex-1 min-w-0 truncate text-xs font-semibold uppercase tracking-wider text-slate-300">{cat.name}</span>
                    <span className="text-slate-600 text-[10px]">{expandedCategories[cat.id] ? '▾' : '▸'}</span>
                  </>
                )}
              </button>

              {sidebarExpanded && expandedCategories[cat.id] && (
                <div className="ml-3 mt-1 mb-1 flex flex-col gap-0.5 border-l border-white/8 pl-2">
                  {cat.items.map((it) => {
                    const hasData = !!getItemData(it.id);
                    const isActive = selectedItemId === it.id;
                    return (
                      <button
                        key={it.id}
                        onClick={() => hasData && selectItem(it.id)}
                        disabled={!hasData}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition border ${
                          isActive
                            ? 'border-cyan-400/50 bg-cyan-950/60 text-cyan-100 shadow-[inset_0_0_0_1px_rgb(34_211_238_/_0.15)]'
                            : hasData
                            ? 'border-transparent text-slate-400 hover:border-white/10 hover:bg-slate-900/50 hover:text-slate-200'
                            : 'border-transparent text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        <AttributeDot id={it.id} />
                        <span className="truncate">{it.name}</span>
                        {!hasData && <span className="ml-auto text-[9px] text-slate-700 uppercase tracking-wider flex-shrink-0">soon</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-screen-xl grid gap-4">

          {/* Search bar */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder={selectedItem ? `Search mods for ${selectedItem.name}…` : 'Select an item type, then search mods…'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!selectedItem}
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 pl-9 pr-9 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition text-sm"
                title="Clear search"
              >✕</button>
            )}
          </div>

          {/* Regex box */}
          <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-4 shadow-xl" style={{ backdropFilter: 'blur(8px)' }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-[240px]">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Stash Search Regex — click to copy</p>
                  <span className={`text-[10px] font-semibold tabular-nums ${overWarn ? 'text-amber-400' : 'text-slate-600'}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {regexLen}/{MAX_REGEX_LEN}
                  </span>
                </div>
                <div
                  role="textbox" tabIndex={0}
                  onClick={copyToClipboard}
                  onKeyPress={(e) => e.key === 'Enter' && copyToClipboard()}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 outline-none cursor-pointer overflow-x-auto whitespace-nowrap transition hover:border-cyan-500/40"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  title="Click to copy"
                >
                  {regexString || <span className="text-slate-600">Select mod tiers below to build your regex…</span>}
                </div>
                {errorMessage && <p className="mt-2 text-xs font-semibold text-rose-400 animate-bounce">{errorMessage}</p>}
              </div>
              <div className="flex items-center gap-3 self-end">
                {copied && <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest animate-pulse">Copied!</span>}
                {(selectedModifiers.length > 0 || openPrefixActive || openSuffixActive) && (
                  <button onClick={handleReset} className="rounded-xl border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/15 active:scale-95">
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Open prefix / suffix buttons */}
          {selectedItem && (
            <div className="grid grid-cols-2 gap-6">
              <button
                onClick={handleOpenPrefixClick}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 px-4 text-sm font-semibold transition active:scale-[0.98] ${
                  openPrefixActive
                    ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200 shadow-[0_0_12px_rgb(34_211_238_/_0.15)]'
                    : 'border-cyan-400/25 bg-cyan-400/5 text-cyan-400 hover:border-cyan-400/50 hover:bg-cyan-400/10'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">↤</span>
                Open Prefix
                {openPrefixActive && selectedBase && (
                  <span className="ml-1 text-[10px] font-normal text-cyan-300/70 truncate max-w-[8rem]">{selectedBase}</span>
                )}
              </button>
              <button
                onClick={handleOpenSuffixClick}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 px-4 text-sm font-semibold transition active:scale-[0.98] ${
                  openSuffixActive
                    ? 'border-amber-300/60 bg-amber-400/20 text-amber-200 shadow-[0_0_12px_rgb(251_191_36_/_0.15)]'
                    : 'border-amber-300/25 bg-amber-300/5 text-amber-400 hover:border-amber-300/50 hover:bg-amber-300/10'
                }`}
              >
                Open Suffix
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">↦</span>
                {openSuffixActive && selectedBase && (
                  <span className="ml-1 text-[10px] font-normal text-amber-200/70 truncate max-w-[8rem]">{selectedBase}</span>
                )}
              </button>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Affixes</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {selectedItem ? selectedItem.name : 'Select an item type'}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-500">
              {selectedItem
                ? `Modifier groups for ${selectedItem.name}. Prefixes on the left, suffixes on the right. Expand a group to select individual tiers.`
                : 'Pick an item type from the sidebar to browse its modifier groups.'}
            </p>
          </div>

          {selectedItem ? (
            <AffixSection
              item={selectedItem}
              selectedModifiers={selectedModifiers}
              onToggleTier={toggleTier}
              searchQuery={searchQuery}
            />
          ) : (
            <section className="rounded-3xl border border-dashed border-white/10 bg-slate-950/30 p-12 text-center">
              <div className="text-5xl mb-4 opacity-30">⚗️</div>
              <p className="font-medium text-slate-400">No item selected</p>
              <p className="mt-1 text-sm text-slate-600">Select a category in the sidebar, then pick an item type.</p>
            </section>
          )}
        </div>
      </main>
    </div>
    </>
  );
}

// ── app shell ───────────────────────────────────────────────────────────────

export default function App() {
  const page = useHash();

  const navLinks = [
    { id: 'affixes', label: 'Affixes' },
    { id: 'bases', label: 'Bases' },
    { id: 'guide', label: 'Guide' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-slate-200">
      <header
        className="sticky top-0 z-30 border-b border-white/10 flex-shrink-0"
        style={{ background: 'rgb(2 6 23 / 0.92)', backdropFilter: 'blur(24px)' }}
      >
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-slate-100 text-base tracking-tight">PoE Regex</span>
            <span className="text-xs text-slate-600 hidden sm:inline">/ Affix Browser</span>
          </div>

          <nav className="flex items-center gap-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => navigate(link.id)}
                className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  page === link.id
                    ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200'
                    : 'border-white/10 bg-slate-900 text-slate-300 hover:border-white/20 hover:bg-slate-800'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="flex flex-col flex-1 min-h-0">
        {page === 'affixes' && <AffixesPage />}
        {page === 'bases' && <Bases />}
        {page === 'guide' && <Guide />}
        {page !== 'affixes' && page !== 'bases' && page !== 'guide' && <AffixesPage />}
      </div>
    </div>
  );
}
