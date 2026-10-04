type Datamine = {
  tiers: Array<{ leaders: Array<{ slot_number: number; rules: Array<{ text: string }> }> }>;
};

export function roundParameter(datamine: unknown, modifiers: string[], round: number, slot: number): string {
  if (datamine != null) {
    const tiers = (datamine as Datamine).tiers;
    if (!Array.isArray(tiers) || !tiers.length) throw new Error("Datamine is missing battle tiers");
    const tierIndex = Math.min(round - 1, tiers.length - 1);
    const leader = tiers[tierIndex]?.leaders?.find((entry) => entry.slot_number === slot);
    const rules = leader?.rules;
    if (!rules?.length) throw new Error(`Missing rules for round ${round}, leader ${slot}`);
    const rule = rules[(round - 1 - tierIndex) % rules.length]?.text;
    if (!rule) throw new Error(`Missing parameter for round ${round}, leader ${slot}`);
    return rule;
  }
  if (round <= 3) return "No rules";
  const rule = modifiers[(round - 4 + slot - 1) % 3]?.trim();
  if (!rule) throw new Error("Configure all three challenge modifiers before exporting the ticket plan");
  return rule;
}

export function parameterLabel(rule: string) {
  return rule.replace(/Zero physical damage/gi, "Special damage only (zero physical damage)")
    .replace(/Zero special damage/gi, "Physical damage only (zero special damage)");
}

export function parameterColorKey(rule: string) {
  return rule.split(";").map((part) => part.trim())
    .filter((part) => !/^zero damage when not super effective$/i.test(part))
    .join("; ") || "No rules";
}

export function parameterLegend(rules: string[]) {
  const palette = ["DDEBF7", "FCE4D6", "E4DFEC", "D9EAD3", "FFF2CC", "F4CCCC", "D0E0E3", "EAD1DC"];
  const unique = [...new Set(rules.map(parameterColorKey))];
  let index = 0;
  return unique.map((rule) => ({ rule, label: parameterLabel(rule), fill: rule === "No rules" ? "F2F2F2" : palette[index++ % palette.length] }));
}
