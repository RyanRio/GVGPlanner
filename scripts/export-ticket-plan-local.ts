import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx-js-style";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const envPath = path.resolve(projectRoot, ".env.local");

type ChallengeLeader = {
  slotNumber: number;
  leaderName: string;
  weaknessType: string;
};

type ImportedMember = {
  id: string;
  displayName: string;
  pairCount: number;
};

function parseDotEnv(text: string) {
  const env: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim().replace(/^"(.*)"$/, "$1");
    env[key] = value;
  }
  return env;
}

async function loadEnv() {
  try {
    return parseDotEnv(await readFile(envPath, "utf8"));
  } catch {
    return {};
  }
}

function parseArgs(argv: string[]) {
  const options = { out: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--out" || arg === "-o") {
      options.out = argv[index + 1] ?? "";
      index += 1;
    }
  }
  return options;
}

function defaultOutputPath(challengeName: string) {
  const safeName = challengeName
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return path.resolve(projectRoot, "exports", `${safeName || "gvg"}_ticket_plan.xlsx`);
}

function encodeCell(row: number, col: number) {
  return XLSX.utils.encode_cell({ r: row, c: col });
}

function encodeRange(rowStart: number, colStart: number, rowEnd: number, colEnd: number) {
  return XLSX.utils.encode_range({
    s: { r: rowStart, c: colStart },
    e: { r: rowEnd, c: colEnd }
  });
}

function setCell(
  ws: XLSX.WorkSheet,
  row: number,
  col: number,
  value: string | number | { f: string } | null | undefined
) {
  const ref = encodeCell(row, col);

  if (value && typeof value === "object" && "f" in value) {
    ws[ref] = { t: "n", f: value.f };
    return;
  }

  if (typeof value === "number") {
    ws[ref] = { t: "n", v: value };
    return;
  }

  ws[ref] = { t: "s", v: value == null ? "" : String(value) };
}

function buildBorder() {
  return {
    top: { style: "thin", color: { rgb: "333333" } },
    bottom: { style: "thin", color: { rgb: "333333" } },
    left: { style: "thin", color: { rgb: "333333" } },
    right: { style: "thin", color: { rgb: "333333" } }
  };
}

function getLeaderFill(type: string) {
  const fills: Record<string, string> = {
    Ice: "DCEEFF",
    Electric: "FFF7A8",
    Fighting: "F9D2B4",
    Dark: "D0D0D0",
    Fairy: "F9D5E6",
    Fire: "FFB7B7",
    Steel: "D8D8D8",
    Dragon: "B7D3FF"
  };
  return fills[type] ?? "E7EEF6";
}

function styleCell(
  ws: XLSX.WorkSheet,
  row: number,
  col: number,
  options?: {
    bold?: boolean;
    fill?: string;
    align?: "left" | "center";
    wrap?: boolean;
    fontSize?: number;
  }
) {
  const ref = encodeCell(row, col);
  if (!ws[ref]) return;
  ws[ref].s = {
    font: {
      name: "Calibri",
      sz: options?.fontSize ?? 11,
      bold: options?.bold ?? false,
      color: { rgb: "000000" }
    },
    fill: {
      fgColor: { rgb: options?.fill ?? "FFFFFF" }
    },
    alignment: {
      vertical: "center",
      horizontal: options?.align ?? "left",
      wrapText: options?.wrap ?? true
    },
    border: buildBorder()
  };
}

async function fetchCurrentChallengeAndMembers(client: ReturnType<typeof createClient>) {
  const [challengeResult, membersResult] = await Promise.all([
    client
      .from("gym_challenges")
      .select(`
        id,
        name,
        gym_challenge_leaders (
          slot_number,
          leader_name,
          weakness_type
        ),
        gym_challenge_setup_duty_members (
          member_slug
        )
      `)
      .eq("is_current", true)
      .limit(1)
      .maybeSingle(),
    client
      .from("gym_roster_members")
      .select(`
        member_slug,
        display_name,
        member_current_roster ( pair_id )
      `)
      .eq("is_active", true)
      .order("display_name")
  ]);

  if (challengeResult.error) throw challengeResult.error;
  if (membersResult.error) throw membersResult.error;
  if (!challengeResult.data) throw new Error("No current challenge found.");

  const leaders: ChallengeLeader[] = (challengeResult.data.gym_challenge_leaders ?? [])
    .map((leader) => ({
      slotNumber: leader.slot_number,
      leaderName: leader.leader_name,
      weaknessType: leader.weakness_type
    }))
    .sort((a, b) => a.slotNumber - b.slotNumber);

  const members: ImportedMember[] = (membersResult.data ?? []).map((member) => ({
    id: member.member_slug,
    displayName: member.display_name,
    pairCount: (member.member_current_roster ?? []).length
  }));

  const setupDutyIds = (challengeResult.data.gym_challenge_setup_duty_members ?? [])
    .map((entry) => entry.member_slug)
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  return {
    challengeName: challengeResult.data.name,
    leaders,
    members,
    setupDutyNames: setupDutyIds
      .map((slug) => members.find((member) => member.id === slug)?.displayName ?? slug)
      .sort((a, b) => a.localeCompare(b))
  };
}

function buildWorkbook(challengeName: string, leaders: ChallengeLeader[], members: ImportedMember[], setupDutyNames: string[]) {
  const wb = XLSX.utils.book_new();

  const ws = XLSX.utils.aoa_to_sheet([]);
  ws["!cols"] = [
    { wch: 8 },
    { wch: 16 },
    { wch: 16 },
    ...leaders.flatMap(() => [
      { wch: 18 },
      { wch: 8 },
      { wch: 18 },
      { wch: 8 },
      { wch: 18 },
      { wch: 8 },
      { wch: 9 }
    ])
  ];

  const merges: XLSX.Range[] = [];

  setCell(ws, 0, 0, `${challengeName} Ticket Planning Sheet`);
  setCell(ws, 1, 0, "Core assignments are pooled. Round rows are for actual member usage and ticket tracking by leader.");
  merges.push(XLSX.utils.decode_range(encodeRange(0, 0, 0, 12)));
  merges.push(XLSX.utils.decode_range(encodeRange(1, 0, 1, 20)));
  styleCell(ws, 0, 0, { bold: true, fontSize: 16, fill: "D9EAF7" });
  styleCell(ws, 1, 0, { fill: "F7F7F7" });

  const summaryStartRow = 3;
  const summaryRows = [
    ["Members imported", members.length],
    ["Starting tickets / member", 15],
    ["Daily tickets / member", 3],
    ["Days", 7],
    ["Total tickets available", { f: "B4*(B5+B6*B7)" }],
    ["Projected tickets used", { f: "B9" }],
    ["Projected tickets remaining", { f: "B8-B9" }],
    ["Projected rounds fully planned", { f: 'COUNTIF(A30:A44,">0")' }]
  ];

  summaryRows.forEach((row, index) => {
    const targetRow = summaryStartRow + index;
    setCell(ws, targetRow, 0, row[0]);
    setCell(ws, targetRow, 1, row[1] as string | number | { f: string });
    styleCell(ws, targetRow, 0, { bold: true, fill: "EAF3F8" });
    styleCell(ws, targetRow, 1, { fill: "FFFFFF", align: "center" });
  });

  const setupRow = summaryStartRow + summaryRows.length + 1;
  setCell(ws, setupRow, 0, "Suggested setup pool");
  setCell(ws, setupRow, 1, setupDutyNames.join(", ") || "Fill manually");
  merges.push(XLSX.utils.decode_range(encodeRange(setupRow, 1, setupRow, 8)));
  styleCell(ws, setupRow, 0, { bold: true, fill: "EAF3F8" });
  styleCell(ws, setupRow, 1, { fill: "FFF9E8" });

  const coreStartRow = 13;
  const coreHeaders = ["Leader", "Weakness", "Core A", "Core B", "Setup pool / preference order", "Notes"];
  coreHeaders.forEach((header, index) => {
    setCell(ws, coreStartRow, index, header);
    styleCell(ws, coreStartRow, index, { bold: true, fill: "D9EAF7", align: "center" });
  });

  leaders.forEach((leader, index) => {
    const row = coreStartRow + 1 + index;
    setCell(ws, row, 0, leader.leaderName);
    setCell(ws, row, 1, leader.weaknessType);
    setCell(ws, row, 2, "");
    setCell(ws, row, 3, "");
    setCell(ws, row, 4, "");
    setCell(ws, row, 5, "");

    for (let col = 0; col <= 5; col += 1) {
      styleCell(ws, row, col, {
        fill: col <= 1 ? getLeaderFill(leader.weaknessType) : "FFFFFF",
        bold: col === 0
      });
    }
  });

  const plannerHeaderRow = 24;
  const plannerSubHeaderRow = 25;
  const plannerDataStartRow = 29;
  const roundCount = 15;
  const finalDataRow = plannerDataStartRow + roundCount - 1;

  setCell(ws, plannerHeaderRow, 0, "Round");
  setCell(ws, plannerHeaderRow, 1, "Round Total");
  setCell(ws, plannerHeaderRow, 2, "Cumulative Used");
  merges.push(XLSX.utils.decode_range(encodeRange(plannerHeaderRow, 0, plannerSubHeaderRow, 0)));
  merges.push(XLSX.utils.decode_range(encodeRange(plannerHeaderRow, 1, plannerSubHeaderRow, 1)));
  merges.push(XLSX.utils.decode_range(encodeRange(plannerHeaderRow, 2, plannerSubHeaderRow, 2)));
  styleCell(ws, plannerHeaderRow, 0, { bold: true, fill: "D9EAF7", align: "center" });
  styleCell(ws, plannerHeaderRow, 1, { bold: true, fill: "D9EAF7", align: "center" });
  styleCell(ws, plannerHeaderRow, 2, { bold: true, fill: "D9EAF7", align: "center" });

  let groupStartCol = 3;
  const leaderTotalCols: number[] = [];

  leaders.forEach((leader) => {
    const fill = getLeaderFill(leader.weaknessType);
    setCell(ws, plannerHeaderRow, groupStartCol, `${leader.leaderName} (${leader.weaknessType})`);
    merges.push(XLSX.utils.decode_range(encodeRange(plannerHeaderRow, groupStartCol, plannerHeaderRow, groupStartCol + 6)));
    styleCell(ws, plannerHeaderRow, groupStartCol, { bold: true, fill, align: "center" });

    ["Setup member", "Setup tix", "Clear member", "Clear tix", "Extra member", "Extra tix", "Leader total"].forEach(
      (header, offset) => {
        setCell(ws, plannerSubHeaderRow, groupStartCol + offset, header);
        styleCell(ws, plannerSubHeaderRow, groupStartCol + offset, {
          bold: true,
          fill,
          align: "center"
        });
      }
    );

    leaderTotalCols.push(groupStartCol + 6);
    groupStartCol += 7;
  });

  for (let index = 0; index < roundCount; index += 1) {
    const row = plannerDataStartRow + index;
    const roundNumber = index + 1;
    setCell(ws, row, 0, roundNumber);
    styleCell(ws, row, 0, { bold: true, fill: "F2F2F2", align: "center" });

    let col = 3;
    leaders.forEach((leader) => {
      setCell(ws, row, col, "");
      setCell(ws, row, col + 1, "");
      setCell(ws, row, col + 2, "");
      setCell(ws, row, col + 3, "");
      setCell(ws, row, col + 4, "");
      setCell(ws, row, col + 5, "");
      setCell(ws, row, col + 6, {
        f: `SUM(${encodeCell(row, col + 1)}:${encodeCell(row, col + 5)})`
      });

      for (let offset = 0; offset <= 6; offset += 1) {
        styleCell(ws, row, col + offset, {
          fill: offset === 6 ? getLeaderFill(leader.weaknessType) : "FFFFFF",
          align: offset === 1 || offset === 3 || offset === 5 || offset === 6 ? "center" : "left"
        });
      }

      col += 7;
    });

    setCell(ws, row, 1, {
      f: leaderTotalCols.map((totalCol) => encodeCell(row, totalCol)).join("+")
    });
    setCell(ws, row, 2, {
      f: index === 0 ? encodeCell(row, 1) : `${encodeCell(row - 1, 2)}+${encodeCell(row, 1)}`
    });
    styleCell(ws, row, 1, { bold: true, fill: "EAF3F8", align: "center" });
    styleCell(ws, row, 2, { bold: true, fill: "EAF3F8", align: "center" });
  }

  setCell(ws, 8, 1, { f: `SUM(${encodeCell(plannerDataStartRow, 1)}:${encodeCell(plannerDataStartRow + roundCount - 1, 1)})` });
  styleCell(ws, 8, 1, { fill: "FFF9E8", bold: true, align: "center" });

  ws["!merges"] = merges;
  ws["!ref"] = encodeRange(0, 0, finalDataRow, groupStartCol - 1);
  ws["!freeze"] = { xSplit: 3, ySplit: plannerSubHeaderRow + 1, topLeftCell: "D30", activePane: "bottomRight", state: "frozen" };
  ws["!rows"] = Array.from({ length: finalDataRow + 2 }, (_, index) => ({
    hpt: index === 0 ? 24 : index === 1 ? 22 : index === plannerHeaderRow || index === plannerSubHeaderRow ? 24 : 20
  }));

  XLSX.utils.book_append_sheet(wb, ws, "Master Plan");

  const membersSheetRows = [
    ["Member", "Pair Count"],
    ...members.map((member) => [member.displayName, member.pairCount])
  ];
  const membersWs = XLSX.utils.aoa_to_sheet(membersSheetRows);
  membersWs["!cols"] = [{ wch: 22 }, { wch: 12 }];
  membersSheetRows.forEach((row, rowIndex) => {
    row.forEach((_value, colIndex) => {
      styleCell(membersWs, rowIndex, colIndex, {
        bold: rowIndex === 0,
        fill: rowIndex === 0 ? "D9EAF7" : "FFFFFF",
        align: colIndex === 1 ? "center" : "left"
      });
    });
  });
  XLSX.utils.book_append_sheet(wb, membersWs, "Members");

  return wb;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = await loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321";
  const publishableKey = env.VITE_SUPABASE_ANON_KEY ?? "";
  const memberEmail = env.LOCAL_MEMBER_EMAIL ?? "member@gvgplanner.local";
  const memberPassword = env.LOCAL_MEMBER_PASSWORD ?? "GauntletMember123!";

  const client = createClient(supabaseUrl, publishableKey);
  const { error: signInError } = await client.auth.signInWithPassword({
    email: memberEmail,
    password: memberPassword
  });
  if (signInError) throw signInError;

  const { challengeName, leaders, members, setupDutyNames } = await fetchCurrentChallengeAndMembers(client);
  const workbook = buildWorkbook(challengeName, leaders, members, setupDutyNames);
  const outputPath = args.out ? path.resolve(projectRoot, args.out) : defaultOutputPath(challengeName);
  await mkdir(path.dirname(outputPath), { recursive: true });
  XLSX.writeFile(workbook, outputPath);
  console.log(`Exported ticket planning workbook to ${outputPath}`);
}

await main();
