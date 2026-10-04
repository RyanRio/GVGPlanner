import { createHash } from 'node:crypto';

const requireValue = (condition, message) => { if (!condition) throw new Error(message); };
const number = (value) => Number(value.replace(/[,.]/g, ''));

export function parseGvgDatamine(text, source) {
  const name = source.path.match(/Pasio Gym Battle No\. \d+/)?.[0];
  requireValue(name, 'Source path must identify a Pasio Gym Battle number');
  const points = [...text.matchAll(/^  ((?:Circuit|Extra Battle) \d+(?: and onward)?) \| ([\d.]+) pts \| .+$/gm)]
    .map((m) => ({ label: m[1], points: number(m[2]) }));
  const sections = [...text.matchAll(/^  📋 (.+):\r?\n([\s\S]*?)(?=^  📋 |^🏅|$(?![\s\S]))/gm)];
  requireValue(points.length === 15 && sections.length === 15, 'Expected 15 circuit/extra-battle tiers');
  const tiers = sections.map((section, index) => {
    requireValue(section[1] === points[index].label, 'Circuit labels and points do not match');
    const leaders = [...section[2].matchAll(/^    🆔 (.+?) \| 🏷️ (.+?) \| (.+)\r?\n([\s\S]*?)(?=^    🆔 |$(?![\s\S]))/gm)].map((m, slot) => {
      const units = [...m[4].matchAll(/\[(Center|Left\/Right)\] Weakness: (\w+) \| HP: ([\d,]+) \| Attack: ([\d,]+) \| Defense: ([\d,]+) \| Sp.Attack: ([\d,]+) \| Sp.Def: ([\d,]+) \| Speed: ([\d,]+)\r?\n([\s\S]*?)(?=^       \[Left\/Right\]|$(?![\s\S]))/gm)].map((u) => ({
        position: u[1], weakness: u[2], hp: number(u[3]), attack: number(u[4]), defense: number(u[5]),
        specialAttack: number(u[6]), specialDefense: number(u[7]), speed: number(u[8]),
        passives: [...u[9].matchAll(/Passive (\d+): (.+)/g)].map((p) => ({ slot: Number(p[1]), name: p[2].trim() })),
        focus: u[9].match(/Focus: (.+)/)?.[1].trim() ?? '',
        damageReduction: u[9].match(/Passive Damage Reduction \(Enemy\): (.+)/)?.[1].trim() ?? '',
        adjustments: [...u[9].matchAll(/● (.+)/g)].map((p) => p[1].trim())
      }));
      requireValue(units.length === 2 && units[0].position === 'Center' && units[1].position === 'Left/Right', `Missing units: ${section[1]} ${m[1]}`);
      const rules = [...m[4].matchAll(/^\s*(Theme|Rules [123]): (.+)\r?$/gm)].map((r) => ({ label: r[1], text: r[2].trim() }));
      requireValue(rules.length === (index === 14 ? 3 : 1), `Missing rules: ${section[1]} ${m[1]}`);
      return { slot_number: slot + 1, leader_name: m[1], boss_type: m[2], battleName: m[3], rules,
        ruleDescriptions: [...m[4].matchAll(/^\s*Rule: (.+)/gm)].map((r) => r[1].trim()), units };
    });
    requireValue(leaders.length === 8, `Expected eight leaders in ${section[1]}`);
    return { ...points[index], leaders };
  });
  const leaders = tiers[2].leaders.map((leader, index) => {
    for (const tier of tiers) {
      const other = tier.leaders[index];
      requireValue(other.leader_name === leader.leader_name && other.boss_type === leader.boss_type && other.units.every((u) => u.weakness === leader.units[0].weakness), 'Leader identity/weakness varies between tiers');
    }
    const effects = [0, 1, 2].map((tier) => tiers[tier].leaders[index].units[0].passives.find((p) => p.slot === tier + 1)?.name);
    requireValue(effects.every(Boolean), `Missing battle effects for ${leader.leader_name}`);
    return { slot_number: leader.slot_number, leader_name: leader.leader_name, boss_type: leader.boss_type,
      weakness_type: leader.units[0].weakness, battle_1_effect: effects[0], battle_2_effect: effects[1], battle_3_effect: effects[2] };
  });
  let cumulative = 0;
  const rounds = Array.from({ length: 30 }, (_, i) => {
    const tier = tiers[Math.min(i, 14)];
    const row = { round_number: i + 1, points: tier.points, cumulative_points: cumulative += tier.points * 8 };
    for (const [unitIndex, prefix] of ['middle', 'side'].entries()) {
      const unit = tier.leaders[0].units[unitIndex];
      requireValue(tier.leaders.every((l) => ['hp', 'attack', 'specialAttack', 'defense', 'specialDefense', 'speed'].every((k) => l.units[unitIndex][k] === unit[k])), 'Planner cannot represent leader-specific stats');
      requireValue(unit.attack === unit.specialAttack && unit.defense === unit.specialDefense, 'Planner requires equal physical/special stats');
      Object.assign(row, { [`${prefix}_hp`]: unit.hp, [`${prefix}_offenses`]: unit.attack, [`${prefix}_defenses`]: unit.defense, [`${prefix}_speed`]: unit.speed });
    }
    return row;
  });
  const schedule = [...text.matchAll(/^(?:📢|⚔️|🏆|🎁) (\w+):\r?\n\s+Start: (.+)\r?\n\s+End: (.+)/gm)]
    .map((m) => ({ phase: m[1], start: m[2].trim(), end: m[3].trim() }));
  const tickets = [...text.matchAll(/🎟️ Ticket x(\d+) \| ⏱️ (\d+):(\d+) min \| 🔄 Sync Buff \+(\d+)/g)]
    .map((m) => ({ tickets: Number(m[1]), seconds: Number(m[2]) * 60 + Number(m[3]), syncBuff: Number(m[4]) }));
  requireValue(schedule.length === 4 && tickets.length === 3, 'Missing schedule or ticket effects');
  const restricted = tiers.filter((t) => t.leaders.some((l) => l.rules.some((r) => r.text.includes('zero damage when not super effective'))));
  const notes = 'Datamined rules vary by leader and extra battle. '
    + (restricted.length ? `Super-effective-only restrictions first appear at ${restricted[0].label}. ` : '')
    + 'See imported datamine for full rules.';
  return { name, source: { ...source, sha256: createHash('sha256').update(text).digest('hex') },
    notes,
    leaders, rounds, modifiers: tiers[3].leaders.slice(0, 3).map((l) => l.rules[0].text),
    schedule, tickets, tiers, rawText: text };
}
