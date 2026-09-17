import amuletsRaw from './imports/amulets.json';
import beltsRaw from './imports/belts.json';
import bodyArmoursDexRaw from './imports/body-armours-dex.json';
import bodyArmoursDexIntRaw from './imports/body-armours-dex-int.json';
import bodyArmoursIntRaw from './imports/body-armours-int.json';
import bodyArmoursStrRaw from './imports/body-armours-str.json';
import bodyArmoursStrDexRaw from './imports/body-armours-str-dex.json';
import bodyArmoursStrDexIntRaw from './imports/body-armours-str-dex-int.json';
import bodyArmoursStrIntRaw from './imports/body-armours-str-int.json';
import bootsStrRaw from './imports/boots-str.json';
import bootsDexRaw from './imports/boots-dex.json';
import bootsIntRaw from './imports/boots-int.json';
import bootsStrDexRaw from './imports/boots-str-dex.json';
import bootsStrIntRaw from './imports/boots-str-int.json';
import bootsDexIntRaw from './imports/boots-dex-int.json';
import bootsRunicRaw from './imports/boots-runic.json';
import bowsRaw from './imports/bows.json';
import clawsRaw from './imports/claws.json';
import cobaltJewelRaw from './imports/cobalt-jewel.json';
import crimsonJewelRaw from './imports/crimson-jewel.json';
import daggersRaw from './imports/daggers.json';
import fishingRodsRaw from './imports/fishing-rods.json';
import ghastlyEyeJewelRaw from './imports/ghastly-eye-jewel.json';
import glovesStrRaw from './imports/gloves-str.json';
import glovesDexRaw from './imports/gloves-dex.json';
import glovesIntRaw from './imports/gloves-int.json';
import glovesStrDexRaw from './imports/gloves-str-dex.json';
import glovesStrIntRaw from './imports/gloves-str-int.json';
import glovesDexIntRaw from './imports/gloves-dex-int.json';
import glovesRunicRaw from './imports/gloves-runic.json';
import helmetsStrRaw from './imports/helmets-str.json';
import helmetsDexRaw from './imports/helmets-dex.json';
import helmetsIntRaw from './imports/helmets-int.json';
import helmetsStrDexRaw from './imports/helmets-str-dex.json';
import helmetsStrIntRaw from './imports/helmets-str-int.json';
import helmetsDexIntRaw from './imports/helmets-dex-int.json';
import helmetsRunicRaw from './imports/helmets-runic.json';
import hybridFlasksRaw from './imports/hybrid-flasks.json';
import hypnoticEyeJewelRaw from './imports/hypnotic-eye-jewel.json';
import ironFlaskRaw from './imports/iron-flask.json';
import largeClusterJewelRaw from './imports/large-cluster-jewel.json';
import lifeFlasksRaw from './imports/life-flasks.json';
import manaFlasksRaw from './imports/mana-flasks.json';
import mediumClusterJewelRaw from './imports/medium-cluster-jewel.json';
import minionRingsRaw from './imports/minion-rings.json';
import minionShieldsRaw from './imports/minion-shields.json';
import minionWandsRaw from './imports/minion-wands.json';
import murderousEyeJewelRaw from './imports/murderous-eye-jewel.json';
import oneHandedAxesRaw from './imports/one-handed-axes.json';
import oneHandedMacesRaw from './imports/one-handed-maces.json';
import oneHandedSwordsRaw from './imports/one-handed-swords.json';
import prismaticJewelRaw from './imports/prismatic-jewel.json';
import quiversRaw from './imports/quivers.json';
import ringsRaw from './imports/rings.json';
import runeDaggersRaw from './imports/rune-daggers.json';
import sceptresRaw from './imports/sceptres.json';
import searchingEyeJewelRaw from './imports/searching-eye-jewel.json';
import shieldsDexIntRaw from './imports/shields-dex-int.json';
import shieldsDexRaw from './imports/shields-dex.json';
import shieldsIntRaw from './imports/shields-int.json';
import shieldsStrDexRaw from './imports/shields-str-dex.json';
import shieldsStrIntRaw from './imports/shields-str-int.json';
import shieldsStrRaw from './imports/shields-str.json';
import smallClusterJewelRaw from './imports/small-cluster-jewel.json';
import stavesRaw from './imports/staves.json';
import thrustingSwordsRaw from './imports/thrusting-swords.json';
import tincturesRaw from './imports/tinctures.json';
import twoHandedAxesRaw from './imports/two-handed-axes.json';
import twoHandedMacesRaw from './imports/two-handed-maces.json';
import twoHandedSwordsRaw from './imports/two-handed-swords.json';
import unsetRingRaw from './imports/unset-ring.json';
import utilityFlasksRaw from './imports/utility-flasks.json';
import viridianJewelRaw from './imports/viridian-jewel.json';
import wandsRaw from './imports/wands.json';
import warstaveRaw from './imports/warstaves.json';

export interface Tier {
  modifier: string;
  ilvl: number;
  stats: string;
}

export interface Modifier {
  groupName: string;
  sectionName: string;
  tierCount: number;
  tags: string[];
  tiers: Tier[];
}

export interface ItemType {
  id: string;
  name: string;
  slug: string;
  category: string;
  prefixes: Modifier[];
  suffixes: Modifier[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  items: { id: string; name: string }[];
}

interface RawTier { modifier: string; ilvl: number; stats: string; }
interface RawGroup { group_name: string; type: 'Prefixes' | 'Suffixes'; tags: string[]; tiers: RawTier[]; }
interface RawSection { section_name: string; groups: RawGroup[]; }
interface RawItemData { modifier_sections: RawSection[]; }

function convertItem(id: string, name: string, slug: string, category: string, raw: RawItemData): ItemType {
  const prefixes: Modifier[] = [];
  const suffixes: Modifier[] = [];
  for (const section of raw.modifier_sections) {
    for (const group of section.groups) {
      if (!group.tiers.length) continue;
      const mod: Modifier = {
        groupName: group.group_name,
        sectionName: section.section_name,
        tierCount: group.tiers.length,
        tags: group.tags,
        tiers: group.tiers,
      };
      (group.type === 'Prefixes' ? prefixes : suffixes).push(mod);
    }
  }
  return { id, name, slug, category, prefixes, suffixes };
}

function item(id: string, name: string, slug: string, category: string, raw: unknown) {
  return convertItem(id, name, slug, category, raw as RawItemData);
}

// Category order: 1H Weapons → 2H Weapons → Off-hands → Body Armours →
//                 Helmets → Gloves → Boots → Accessories → Jewels → Flasks
export const categories: Category[] = [
  {
    id: 'weapons-1h',
    name: 'One-Handed Weapons',
    icon: '🗡️',
    items: [
      { id: 'claws', name: 'Claws' },
      { id: 'daggers', name: 'Daggers' },
      { id: 'one-handed-axes', name: 'One Hand Axes' },
      { id: 'one-handed-maces', name: 'One Hand Maces' },
      { id: 'one-handed-swords', name: 'One Hand Swords' },
      { id: 'thrusting-swords', name: 'Thrusting Swords' },
      { id: 'rune-daggers', name: 'Rune Daggers' },
      { id: 'sceptres', name: 'Sceptres' },
      { id: 'wands', name: 'Wands' },
      { id: 'minion-wands', name: 'Minion Wands' },
    ],
  },
  {
    id: 'weapons-2h',
    name: 'Two-Handed Weapons',
    icon: '⚔️',
    items: [
      { id: 'bows', name: 'Bows' },
      { id: 'fishing-rods', name: 'Fishing Rods' },
      { id: 'staves', name: 'Staves' },
      { id: 'two-handed-axes', name: 'Two Hand Axes' },
      { id: 'two-handed-maces', name: 'Two Hand Maces' },
      { id: 'two-handed-swords', name: 'Two Hand Swords' },
      { id: 'warstaves', name: 'Warstaves' },
    ],
  },
  {
    id: 'off-hands',
    name: 'Off-hands',
    icon: '🛡️',
    items: [
      { id: 'shields-dex', name: 'Evasion (Dexterity)' },
      { id: 'shields-dex-int', name: 'Evasion/Energy Shield (Dex/Int)' },
      { id: 'shields-str', name: 'Armour (Strength)' },
      { id: 'shields-int', name: 'Energy Shield (Intelligence)' },
      { id: 'shields-str-dex', name: 'Armour/Evasion (Str/Dex)' },
      { id: 'shields-str-int', name: 'Armour/Energy Shield (Str/Int)' },
      { id: 'minion-shields', name: 'Minion Shields' },
      { id: 'quivers', name: 'Quivers' },
    ],
  },
  {
    id: 'body-armours',
    name: 'Body Armours',
    icon: '🥋',
    items: [
      { id: 'body-armours-str', name: 'Armour (Strength)' },
      { id: 'body-armours-dex', name: 'Evasion (Dexterity)' },
      { id: 'body-armours-int', name: 'Energy Shield (Intelligence)' },
      { id: 'body-armours-str-dex', name: 'Armour/Evasion (Str/Dex)' },
      { id: 'body-armours-str-int', name: 'Armour/Energy Shield (Str/Int)' },
      { id: 'body-armours-dex-int', name: 'Evasion/Energy Shield (Dex/Int)' },
      { id: 'body-armours-str-dex-int', name: 'Armour/Evasion/ES (All)' },
    ],
  },
  {
    id: 'helmets',
    name: 'Helmets',
    icon: '⛑️',
    items: [
      { id: 'helmets-str', name: 'Armour (Strength)' },
      { id: 'helmets-dex', name: 'Evasion (Dexterity)' },
      { id: 'helmets-int', name: 'Energy Shield (Intelligence)' },
      { id: 'helmets-str-dex', name: 'Armour/Evasion (Str/Dex)' },
      { id: 'helmets-str-int', name: 'Armour/Energy Shield (Str/Int)' },
      { id: 'helmets-dex-int', name: 'Evasion/Energy Shield (Dex/Int)' },
      { id: 'helmets-runic', name: 'Runic (Recombinator)' },
    ],
  },
  {
    id: 'gloves',
    name: 'Gloves',
    icon: '🧤',
    items: [
      { id: 'gloves-str', name: 'Armour (Strength)' },
      { id: 'gloves-dex', name: 'Evasion (Dexterity)' },
      { id: 'gloves-int', name: 'Energy Shield (Intelligence)' },
      { id: 'gloves-str-dex', name: 'Armour/Evasion (Str/Dex)' },
      { id: 'gloves-str-int', name: 'Armour/Energy Shield (Str/Int)' },
      { id: 'gloves-dex-int', name: 'Evasion/Energy Shield (Dex/Int)' },
      { id: 'gloves-runic', name: 'Runic (Recombinator)' },
    ],
  },
  {
    id: 'boots',
    name: 'Boots',
    icon: '👢',
    items: [
      { id: 'boots-str', name: 'Armour (Strength)' },
      { id: 'boots-dex', name: 'Evasion (Dexterity)' },
      { id: 'boots-int', name: 'Energy Shield (Intelligence)' },
      { id: 'boots-str-dex', name: 'Armour/Evasion (Str/Dex)' },
      { id: 'boots-str-int', name: 'Armour/Energy Shield (Str/Int)' },
      { id: 'boots-dex-int', name: 'Evasion/Energy Shield (Dex/Int)' },
      { id: 'boots-runic', name: 'Runic (Recombinator)' },
    ],
  },
  {
    id: 'accessories',
    name: 'Jewelry',
    icon: '💍',
    items: [
      { id: 'amulets', name: 'Amulets' },
      { id: 'belts', name: 'Belts' },
      { id: 'rings', name: 'Rings' },
      { id: 'unset-ring', name: 'Unset Ring' },
      { id: 'minion-rings', name: 'Minion Rings' },
    ],
  },
  {
    id: 'jewels',
    name: 'Jewels',
    icon: '💎',
    items: [
      { id: 'cobalt-jewel', name: 'Cobalt Jewel' },
      { id: 'crimson-jewel', name: 'Crimson Jewel' },
      { id: 'viridian-jewel', name: 'Viridian Jewel' },
      { id: 'prismatic-jewel', name: 'Prismatic Jewel' },
      { id: 'large-cluster-jewel', name: 'Large Cluster Jewel' },
      { id: 'medium-cluster-jewel', name: 'Medium Cluster Jewel' },
      { id: 'small-cluster-jewel', name: 'Small Cluster Jewel' },
      { id: 'ghastly-eye-jewel', name: 'Ghastly Eye Jewel' },
      { id: 'hypnotic-eye-jewel', name: 'Hypnotic Eye Jewel' },
      { id: 'murderous-eye-jewel', name: 'Murderous Eye Jewel' },
      { id: 'searching-eye-jewel', name: 'Searching Eye Jewel' },
    ],
  },
  {
    id: 'flasks',
    name: 'Flasks',
    icon: '⚗️',
    items: [
      { id: 'life-flasks', name: 'Life Flasks' },
      { id: 'mana-flasks', name: 'Mana Flasks' },
      { id: 'hybrid-flasks', name: 'Hybrid Flasks' },
      { id: 'iron-flask', name: 'Iron Flask' },
      { id: 'tinctures', name: 'Tinctures' },
      { id: 'utility-flasks', name: 'Utility Flasks' },
    ],
  },
];

export const itemDatabase: Record<string, ItemType> = {
  // Accessories
  amulets:                    item('amulets', 'Amulets', 'amulets', 'accessories', amuletsRaw),
  belts:                      item('belts', 'Belts', 'belts', 'accessories', beltsRaw),
  // Body Armours
  'body-armours-str':         item('body-armours-str', 'Body Armours (Armour)', 'body-armours-str', 'body-armours', bodyArmoursStrRaw),
  'body-armours-dex':         item('body-armours-dex', 'Body Armours (Evasion)', 'body-armours-dex', 'body-armours', bodyArmoursDexRaw),
  'body-armours-int':         item('body-armours-int', 'Body Armours (Energy Shield)', 'body-armours-int', 'body-armours', bodyArmoursIntRaw),
  'body-armours-str-dex':     item('body-armours-str-dex', 'Body Armours (Armour+Eva)', 'body-armours-str-dex', 'body-armours', bodyArmoursStrDexRaw),
  'body-armours-str-int':     item('body-armours-str-int', 'Body Armours (Armour+ES)', 'body-armours-str-int', 'body-armours', bodyArmoursStrIntRaw),
  'body-armours-dex-int':     item('body-armours-dex-int', 'Body Armours (Eva+ES)', 'body-armours-dex-int', 'body-armours', bodyArmoursDexIntRaw),
  'body-armours-str-dex-int': item('body-armours-str-dex-int', 'Body Armours (All)', 'body-armours-str-dex-int', 'body-armours', bodyArmoursStrDexIntRaw),
  // Boots
  'boots-str':                item('boots-str', 'Boots (Armour)', 'boots-str', 'boots', bootsStrRaw),
  'boots-dex':                item('boots-dex', 'Boots (Evasion)', 'boots-dex', 'boots', bootsDexRaw),
  'boots-int':                item('boots-int', 'Boots (Energy Shield)', 'boots-int', 'boots', bootsIntRaw),
  'boots-str-dex':            item('boots-str-dex', 'Boots (Armour+Eva)', 'boots-str-dex', 'boots', bootsStrDexRaw),
  'boots-str-int':            item('boots-str-int', 'Boots (Armour+ES)', 'boots-str-int', 'boots', bootsStrIntRaw),
  'boots-dex-int':            item('boots-dex-int', 'Boots (Eva+ES)', 'boots-dex-int', 'boots', bootsDexIntRaw),
  'boots-runic':              item('boots-runic', 'Boots (Runic)', 'boots-runic', 'boots', bootsRunicRaw),
  // Weapons
  bows:                       item('bows', 'Bows', 'bows', 'weapons-2h', bowsRaw),
  claws:                      item('claws', 'Claws', 'claws', 'weapons-1h', clawsRaw),
  daggers:                    item('daggers', 'Daggers', 'daggers', 'weapons-1h', daggersRaw),
  'fishing-rods':             item('fishing-rods', 'Fishing Rods', 'fishing-rods', 'weapons-2h', fishingRodsRaw),
  // Jewels
  'cobalt-jewel':             item('cobalt-jewel', 'Cobalt Jewel', 'cobalt-jewel', 'jewels', cobaltJewelRaw),
  'crimson-jewel':            item('crimson-jewel', 'Crimson Jewel', 'crimson-jewel', 'jewels', crimsonJewelRaw),
  'ghastly-eye-jewel':        item('ghastly-eye-jewel', 'Ghastly Eye Jewel', 'ghastly-eye-jewel', 'jewels', ghastlyEyeJewelRaw),
  'hypnotic-eye-jewel':       item('hypnotic-eye-jewel', 'Hypnotic Eye Jewel', 'hypnotic-eye-jewel', 'jewels', hypnoticEyeJewelRaw),
  // Gloves
  'gloves-str':               item('gloves-str', 'Gloves (Armour)', 'gloves-str', 'gloves', glovesStrRaw),
  'gloves-dex':               item('gloves-dex', 'Gloves (Evasion)', 'gloves-dex', 'gloves', glovesDexRaw),
  'gloves-int':               item('gloves-int', 'Gloves (Energy Shield)', 'gloves-int', 'gloves', glovesIntRaw),
  'gloves-str-dex':           item('gloves-str-dex', 'Gloves (Armour+Eva)', 'gloves-str-dex', 'gloves', glovesStrDexRaw),
  'gloves-str-int':           item('gloves-str-int', 'Gloves (Armour+ES)', 'gloves-str-int', 'gloves', glovesStrIntRaw),
  'gloves-dex-int':           item('gloves-dex-int', 'Gloves (Eva+ES)', 'gloves-dex-int', 'gloves', glovesDexIntRaw),
  'gloves-runic':             item('gloves-runic', 'Gloves (Runic)', 'gloves-runic', 'gloves', glovesRunicRaw),
  // Helmets
  'helmets-str':              item('helmets-str', 'Helmets (Armour)', 'helmets-str', 'helmets', helmetsStrRaw),
  'helmets-dex':              item('helmets-dex', 'Helmets (Evasion)', 'helmets-dex', 'helmets', helmetsDexRaw),
  'helmets-int':              item('helmets-int', 'Helmets (Energy Shield)', 'helmets-int', 'helmets', helmetsIntRaw),
  'helmets-str-dex':          item('helmets-str-dex', 'Helmets (Armour+Eva)', 'helmets-str-dex', 'helmets', helmetsStrDexRaw),
  'helmets-str-int':          item('helmets-str-int', 'Helmets (Armour+ES)', 'helmets-str-int', 'helmets', helmetsStrIntRaw),
  'helmets-dex-int':          item('helmets-dex-int', 'Helmets (Eva+ES)', 'helmets-dex-int', 'helmets', helmetsDexIntRaw),
  'helmets-runic':            item('helmets-runic', 'Helmets (Runic)', 'helmets-runic', 'helmets', helmetsRunicRaw),
  // Flasks
  'hybrid-flasks':            item('hybrid-flasks', 'Hybrid Flasks', 'hybrid-flasks', 'flasks', hybridFlasksRaw),
  'iron-flask':               item('iron-flask', 'Iron Flask', 'iron-flask', 'flasks', ironFlaskRaw),
  'life-flasks':              item('life-flasks', 'Life Flasks', 'life-flasks', 'flasks', lifeFlasksRaw),
  'mana-flasks':              item('mana-flasks', 'Mana Flasks', 'mana-flasks', 'flasks', manaFlasksRaw),
  // Cluster Jewels
  'large-cluster-jewel':      item('large-cluster-jewel', 'Large Cluster Jewel', 'large-cluster-jewel', 'jewels', largeClusterJewelRaw),
  'medium-cluster-jewel':     item('medium-cluster-jewel', 'Medium Cluster Jewel', 'medium-cluster-jewel', 'jewels', mediumClusterJewelRaw),
  // Abyss Jewels
  'murderous-eye-jewel':      item('murderous-eye-jewel', 'Murderous Eye Jewel', 'murderous-eye-jewel', 'jewels', murderousEyeJewelRaw),
  // Accessories
  'minion-rings':             item('minion-rings', 'Minion Rings', 'minion-rings', 'accessories', minionRingsRaw),
  // Off-hands
  'minion-shields':           item('minion-shields', 'Minion Shields', 'minion-shields', 'off-hands', minionShieldsRaw),
  quivers:                    item('quivers', 'Quivers', 'quivers', 'off-hands', quiversRaw),
  'shields-dex':              item('shields-dex', 'Shields (Evasion)', 'shields-dex', 'off-hands', shieldsDexRaw),
  'shields-dex-int':          item('shields-dex-int', 'Shields (Eva+ES)', 'shields-dex-int', 'off-hands', shieldsDexIntRaw),
  // Weapons 1H
  'minion-wands':             item('minion-wands', 'Minion Wands', 'minion-wands', 'weapons-1h', minionWandsRaw),
  'one-handed-axes':          item('one-handed-axes', 'One Hand Axes', 'one-handed-axes', 'weapons-1h', oneHandedAxesRaw),
  'one-handed-maces':         item('one-handed-maces', 'One Hand Maces', 'one-handed-maces', 'weapons-1h', oneHandedMacesRaw),
  'one-handed-swords':        item('one-handed-swords', 'One Hand Swords', 'one-handed-swords', 'weapons-1h', oneHandedSwordsRaw),
  'rune-daggers':             item('rune-daggers', 'Rune Daggers', 'rune-daggers', 'weapons-1h', runeDaggersRaw),
  sceptres:                   item('sceptres', 'Sceptres', 'sceptres', 'weapons-1h', sceptresRaw),
  // Accessories
  rings:                      item('rings', 'Rings', 'rings', 'accessories', ringsRaw),
  // Jewels
  'prismatic-jewel':          item('prismatic-jewel', 'Prismatic Jewel', 'prismatic-jewel', 'jewels', prismaticJewelRaw),
  'searching-eye-jewel':      item('searching-eye-jewel', 'Searching Eye Jewel', 'searching-eye-jewel', 'jewels', searchingEyeJewelRaw),
  'small-cluster-jewel':      item('small-cluster-jewel', 'Small Cluster Jewel', 'small-cluster-jewel', 'jewels', smallClusterJewelRaw),
  // Off-hands: remaining shields
  'shields-int':              item('shields-int', 'Shields (ES)', 'shields-int', 'off-hands', shieldsIntRaw),
  'shields-str':              item('shields-str', 'Shields (Armour)', 'shields-str', 'off-hands', shieldsStrRaw),
  'shields-str-dex':          item('shields-str-dex', 'Shields (Armour+Eva)', 'shields-str-dex', 'off-hands', shieldsStrDexRaw),
  'shields-str-int':          item('shields-str-int', 'Shields (Armour+ES)', 'shields-str-int', 'off-hands', shieldsStrIntRaw),
  // Weapons 2H
  staves:                     item('staves', 'Staves', 'staves', 'weapons-2h', stavesRaw),
  'thrusting-swords':         item('thrusting-swords', 'Thrusting Swords', 'thrusting-swords', 'weapons-1h', thrustingSwordsRaw),
  'two-handed-axes':          item('two-handed-axes', 'Two Hand Axes', 'two-handed-axes', 'weapons-2h', twoHandedAxesRaw),
  'two-handed-maces':         item('two-handed-maces', 'Two Hand Maces', 'two-handed-maces', 'weapons-2h', twoHandedMacesRaw),
  // Flasks
  tinctures:                  item('tinctures', 'Tinctures', 'tinctures', 'flasks', tincturesRaw),
  'utility-flasks':           item('utility-flasks', 'Utility Flasks', 'utility-flasks', 'flasks', utilityFlasksRaw),
  // Weapons 2H (final)
  'two-handed-swords':        item('two-handed-swords', 'Two Hand Swords', 'two-handed-swords', 'weapons-2h', twoHandedSwordsRaw),
  warstaves:                  item('warstaves', 'Warstaves', 'warstaves', 'weapons-2h', warstaveRaw),
  // Weapons 1H (final)
  wands:                      item('wands', 'Wands', 'wands', 'weapons-1h', wandsRaw),
  // Accessories (final)
  'unset-ring':               item('unset-ring', 'Unset Ring', 'unset-ring', 'accessories', unsetRingRaw),
  // Jewels (final)
  'viridian-jewel':           item('viridian-jewel', 'Viridian Jewel', 'viridian-jewel', 'jewels', viridianJewelRaw),
};

export function getItemData(id: string): ItemType | null {
  return itemDatabase[id] ?? null;
}
