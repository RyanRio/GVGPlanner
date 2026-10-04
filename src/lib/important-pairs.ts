import type { CatalogPair, DamageCategory, ImportantPair } from "../types";

export const damageLabels: Record<DamageCategory, string> = {
  physical: "Physical", special: "Special", both: "Physical + Special", sub_dps: "Sub DPS", unclassified: "Unclassified"
};

export function importantPairLabel(pair: ImportantPair) {
  return `${pair.label} (${damageLabels[pair.damageCategory ?? "unclassified"]})`;
}

export function inDamageCategory(pair: ImportantPair, category: DamageCategory) {
  return (pair.damageCategory ?? "unclassified") === category
    || (pair.damageCategory === "both" && (category === "physical" || category === "special"));
}

export function addImportantPair(pairs: ImportantPair[], pair: CatalogPair, category: "physical" | "special" | "sub_dps"): ImportantPair[] {
  const previous = pairs.find((p) => p.pairId === pair.pairId)?.damageCategory;
  const damageCategory: DamageCategory = category !== "sub_dps"
    && (previous === "physical" || previous === "special" || previous === "both")
    && previous !== category ? "both" : category;
  return [...pairs.filter((p) => p.pairId !== pair.pairId), { ...pair, damageCategory }]
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function removeImportantPair(pairs: ImportantPair[], pairId: string, category: DamageCategory): ImportantPair[] {
  return pairs.flatMap((pair): ImportantPair[] => {
    if (pair.pairId !== pairId) return [pair];
    if (pair.damageCategory === "both" && (category === "physical" || category === "special")) {
      return [{ ...pair, damageCategory: category === "physical" ? "special" : "physical" }];
    }
    return [];
  });
}
