import type { ImportedMember, ImportedPair, PairCatalog, PremiumCategory } from "../types";
import { normalizeMemberSlug } from "./gvg-data";

const SYNC_LEVELS = [1, 2, 3, 4, 5, 5, 5, 5, 5, 5];

function deriveIsEx(rawValue: string, imagePaths: string[] = []) {
  const values = rawValue.split("|");
  const imageIndex = Number.parseInt(values[1] ?? "0", 10);
  if (Number.isNaN(imageIndex) || imageIndex < 0) return false;

  const selectedImagePath = imagePaths[imageIndex] ?? "";
  return selectedImagePath.includes("_EX");
}

function buildPremiumCounts(pairs: ImportedPair[]) {
  return pairs.reduce<Record<PremiumCategory | "all", number>>(
    (counts, pair) => {
      if (pair.premiumCategory !== "general") {
        counts.all += 1;
      }
      counts[pair.premiumCategory] += 1;
      return counts;
    },
    {
      all: 0,
      general: 0,
      master_fair: 0,
      arc_fair: 0,
      poke_fair: 0,
      seasonal: 0,
      variety: 0,
      special_costume: 0
    }
  );
}

export function parseSyncPairsTrackerExport(
  displayName: string,
  payload: Record<string, string>,
  catalog: PairCatalog
) {
  const importedPairs: ImportedPair[] = [];
  const unmatchedKeys: string[] = [];

  Object.entries(payload).forEach(([rawKey, rawValue]) => {
    const pair = catalog.byId.get(rawKey);
    if (!pair) {
      unmatchedKeys.push(rawKey);
      return;
    }

    const values = rawValue.split("|");
    const syncLevelIndex = Number.parseInt(values[0] ?? "0", 10);

    importedPairs.push({
      pairId: pair.pairId,
      label: pair.label,
      syncLevel: Number.isNaN(syncLevelIndex) ? 1 : SYNC_LEVELS[syncLevelIndex] ?? 1,
      isEx: deriveIsEx(rawValue, pair.imagePaths),
      rawValue,
      roleCategory: pair.roleCategory,
      roleLabel: pair.roleLabel,
      exRoleCategory: pair.exRoleCategory,
      exRoleLabel: pair.exRoleLabel,
      type: pair.type,
      premiumCategory: pair.premiumCategory
    });
  });

  importedPairs.sort((a, b) => a.label.localeCompare(b.label));

  const member: ImportedMember = {
    id: normalizeMemberSlug(displayName),
    displayName,
    pairs: importedPairs,
    unmatchedKeys: unmatchedKeys.sort((a, b) => a.localeCompare(b)),
    premiumCounts: buildPremiumCounts(importedPairs)
  };

  return { member };
}
