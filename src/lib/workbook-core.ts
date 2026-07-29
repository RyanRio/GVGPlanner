import XLSX from "xlsx-js-style";
import type { GreedyAssignmentPlan, GymChallenge, ImportedMember, LeaderRecommendation } from "../types";

type SheetStyle = Record<string, unknown>;

function safeSheetName(name: string) {
  return name.replace(/[\\/*?:[\]]/g, "").slice(0, 31) || "Sheet";
}

function encodeCell(columnIndex: number, rowIndex: number) {
  return XLSX.utils.encode_cell({ c: columnIndex, r: rowIndex });
}

function applySheetFormatting(
  sheet: XLSX.WorkSheet,
  columnWidths: number[],
  rowCount: number,
  tallRows: number[] = []
) {
  sheet["!cols"] = columnWidths.map((width) => ({ wch: width }));
  sheet["!rows"] = Array.from({ length: rowCount }, (_, index) => ({
    hpt: tallRows.includes(index) ? 46 : 24
  }));
}

function applyCellStyle(sheet: XLSX.WorkSheet, columnIndex: number, rowIndex: number, style: SheetStyle) {
  const cellRef = encodeCell(columnIndex, rowIndex);
  const cell = sheet[cellRef];
  if (!cell) return;

  cell.s = {
    ...(cell.s ?? {}),
    ...style
  };
}

function applyWrap(sheet: XLSX.WorkSheet, columnIndexes: number[], rowStart: number, rowEnd: number) {
  columnIndexes.forEach((columnIndex) => {
    for (let rowIndex = rowStart; rowIndex <= rowEnd; rowIndex += 1) {
      const cellRef = encodeCell(columnIndex, rowIndex);
      const cell = sheet[cellRef];
      if (!cell) continue;

      cell.s = {
        ...(cell.s ?? {}),
        alignment: {
          ...((cell.s as { alignment?: Record<string, unknown> } | undefined)?.alignment ?? {}),
          wrapText: true,
          vertical: "center"
        }
      };
    }
  });
}

const headerStyle: SheetStyle = {
  font: { bold: true, color: { rgb: "111111" } },
  fill: { patternType: "solid", fgColor: { rgb: "D9D9D9" } },
  alignment: { horizontal: "center", vertical: "center" },
  border: {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } }
  }
};

const sectionStyle: SheetStyle = {
  font: { bold: true, color: { rgb: "111111" } },
  fill: { patternType: "solid", fgColor: { rgb: "BFBFBF" } },
  alignment: { vertical: "center" },
  border: {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } }
  }
};

const assignedHeaderStyle: SheetStyle = {
  font: { bold: true, color: { rgb: "C00000" } },
  fill: { patternType: "solid", fgColor: { rgb: "D9D9D9" } },
  alignment: { horizontal: "center", vertical: "center" },
  border: {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } }
  }
};

const ownedStyle: SheetStyle = {
  fill: { patternType: "solid", fgColor: { rgb: "2E6A4F" } },
  font: { color: { rgb: "111111" }, bold: true },
  alignment: { horizontal: "center", vertical: "center" },
  border: {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } }
  }
};

const missingStyle: SheetStyle = {
  fill: { patternType: "solid", fgColor: { rgb: "6D2F3D" } },
  font: { color: { rgb: "111111" } },
  alignment: { horizontal: "center", vertical: "center" },
  border: {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } }
  }
};

function sortMembers(members: ImportedMember[]) {
  return members.slice().sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function memberOwnsPair(member: ImportedMember, pairId: string) {
  return member.pairs.some((pair) => pair.pairId === pairId);
}

function buildMatrixRows(
  members: ImportedMember[],
  sections: Array<{ title: string; pairs: Array<{ pairId: string; label: string }> }>
) {
  const rows: (string | number)[][] = [];
  const sectionRows: number[] = [];
  const ownedCells: Array<{ row: number; col: number }> = [];
  const missingCells: Array<{ row: number; col: number }> = [];
  const memberColumns = sortMembers(members);

  rows.push(["Pair", ...memberColumns.map((member) => member.displayName)]);

  sections.forEach((section) => {
    if (!section.pairs.length) {
      return;
    }

    rows.push([]);
    rows.push([section.title]);
    sectionRows.push(rows.length - 1);

    section.pairs.forEach((pair) => {
      const rowIndex = rows.length;
      const row: string[] = [pair.label];

      memberColumns.forEach((member, memberIndex) => {
        const owns = memberOwnsPair(member, pair.pairId);
        row.push("");
        if (owns) {
          ownedCells.push({ row: rowIndex, col: memberIndex + 1 });
        } else {
          missingCells.push({ row: rowIndex, col: memberIndex + 1 });
        }
      });

      rows.push(row);
    });
  });

  return { rows, sectionRows, memberColumns, ownedCells, missingCells };
}

function appendLeaderMatrixSheet(
  workbook: XLSX.WorkBook,
  _challenge: GymChallenge,
  leader: GymChallenge["leaders"][number],
  members: ImportedMember[],
  options: {
    selectedRound: number;
    recommendations: Map<number, LeaderRecommendation>;
    assignmentPlan: GreedyAssignmentPlan;
    manualAssignments: Record<number, { primary: string; secondary: string }>;
  }
) {
  const autoAssignment = options.assignmentPlan.leaderAssignments.get(leader.slotNumber);
  const manualAssignment = options.manualAssignments[leader.slotNumber] || { primary: "", secondary: "" };
  const recommendation = options.recommendations.get(leader.slotNumber);
  const detailRows: (string | number)[][] = [
    ["Field", "Value"],
    ["Leader", leader.leaderName],
    ["Weakness", leader.weaknessType],
    ["Round", options.selectedRound],
    ["Auto Primary", autoAssignment?.primary?.memberName ?? "Uncovered"],
    ["Auto Secondary", autoAssignment?.secondary?.memberName ?? "Uncovered"],
    ["Manual Primary", manualAssignment.primary || "None"],
    ["Manual Secondary", manualAssignment.secondary || "None"],
    ["Important Pairs", leader.importantPairs.map((pair) => pair.label).join(", ") || "None"],
    [
      "Top Recommendations",
      recommendation?.recommendationMembers
        .slice(0, 5)
        .map((member) => `${member.memberName} (${member.score.toFixed(1)})`)
        .join("; ") || "None"
    ],
    [],
    ["Pair", ...sortMembers(members).map((member) => member.displayName)]
  ];

  const sections = [{ title: "Important pairs", pairs: leader.importantPairs }];
  const rebuffSections = [{ title: "Rebuff", pairs: leader.rebuffPairs }];
  const { rows, sectionRows, memberColumns, ownedCells, missingCells } = buildMatrixRows(members, sections);
  const {
    rows: rebuffRows,
    sectionRows: rebuffSectionRows,
    ownedCells: rebuffOwnedCells,
    missingCells: rebuffMissingCells
  } = buildMatrixRows(members, rebuffSections);
  const adjustedOwnedCells = ownedCells.map(({ row, col }) => ({ row: row + detailRows.length - 1, col }));
  const adjustedMissingCells = missingCells.map(({ row, col }) => ({ row: row + detailRows.length - 1, col }));
  const adjustedSectionRows = sectionRows.map((row) => row + detailRows.length - 1);
  const rebuffStartRow = detailRows.length + rows.length;
  const adjustedRebuffOwnedCells = rebuffOwnedCells.map(({ row, col }) => ({ row: row + rebuffStartRow, col }));
  const adjustedRebuffMissingCells = rebuffMissingCells.map(({ row, col }) => ({ row: row + rebuffStartRow, col }));
  const adjustedRebuffSectionRows = rebuffSectionRows.map((row) => row + rebuffStartRow);
  const sheet = XLSX.utils.aoa_to_sheet([...detailRows, ...rows.slice(1), [], ...rebuffRows]);
  const importantPairRows = Array.from(
    { length: Math.max(0, rows.length - 3) },
    (_, index) => detailRows.length + 2 + index
  );
  const rebuffPairRows = Array.from(
    { length: Math.max(0, rebuffRows.length - 3) },
    (_, index) => rebuffStartRow + 3 + index
  );
  applySheetFormatting(
    sheet,
    [28, 56, ...Array.from({ length: memberColumns.length - 1 }, () => 14)],
    detailRows.length + rows.length + rebuffRows.length,
    [8, 9, ...adjustedSectionRows, ...adjustedRebuffSectionRows, ...importantPairRows, ...rebuffPairRows]
  );
  applyWrap(sheet, [1], 0, 9);
  applyWrap(sheet, [0], detailRows.length, detailRows.length + rows.length + rebuffRows.length - 2);
  applyCellStyle(sheet, 0, 0, headerStyle);
  applyCellStyle(sheet, 1, 0, headerStyle);
  applyCellStyle(sheet, 0, detailRows.length - 1, headerStyle);
  for (let columnIndex = 1; columnIndex <= memberColumns.length; columnIndex += 1) {
    applyCellStyle(sheet, columnIndex, detailRows.length - 1, headerStyle);
  }
  const rebuffHeaderRow = rebuffStartRow;
  for (let columnIndex = 0; columnIndex <= memberColumns.length; columnIndex += 1) {
    applyCellStyle(sheet, columnIndex, rebuffHeaderRow, headerStyle);
  }
  adjustedSectionRows.forEach((rowIndex) => {
    for (let columnIndex = 0; columnIndex <= memberColumns.length; columnIndex += 1) {
      applyCellStyle(sheet, columnIndex, rowIndex, sectionStyle);
    }
  });
  adjustedRebuffSectionRows.forEach((rowIndex) => {
    for (let columnIndex = 0; columnIndex <= memberColumns.length; columnIndex += 1) {
      applyCellStyle(sheet, columnIndex, rowIndex, sectionStyle);
    }
  });
  adjustedOwnedCells.forEach(({ row, col }) => applyCellStyle(sheet, col, row, ownedStyle));
  adjustedMissingCells.forEach(({ row, col }) => applyCellStyle(sheet, col, row, missingStyle));
  adjustedRebuffOwnedCells.forEach(({ row, col }) => applyCellStyle(sheet, col, row, ownedStyle));
  adjustedRebuffMissingCells.forEach(({ row, col }) => applyCellStyle(sheet, col, row, missingStyle));
  XLSX.utils.book_append_sheet(workbook, sheet, safeSheetName(`${leader.slotNumber}-${leader.leaderName}`));
}

function buildSingleSectionMatrix(
  title: string,
  pairs: Array<{ pairId: string; label: string }>,
  members: ImportedMember[],
  leadingColumns: string[] = []
) {
  const memberColumns = sortMembers(members);
  const rows: (string | number)[][] = [
    [...leadingColumns, "Pair", ...memberColumns.map((member) => member.displayName)]
  ];
  const ownedCells: Array<{ row: number; col: number }> = [];
  const missingCells: Array<{ row: number; col: number }> = [];

  pairs.forEach((pair) => {
    const rowIndex = rows.length;
    const row = [...Array.from({ length: leadingColumns.length }, () => ""), pair.label];
    memberColumns.forEach((member, memberIndex) => {
      const owns = memberOwnsPair(member, pair.pairId);
      row.push("");
      const columnOffset = leadingColumns.length + 1 + memberIndex;
      (owns ? ownedCells : missingCells).push({ row: rowIndex, col: columnOffset });
    });
    rows.push(row);
  });

  return { title, rows, memberColumns, ownedCells, missingCells };
}

function buildOverviewSheet(options: {
  challenge: GymChallenge;
  members: ImportedMember[];
  selectedRound: number;
  recommendations: Map<number, LeaderRecommendation>;
  assignmentPlan: GreedyAssignmentPlan;
  manualAssignments: Record<number, { primary: string; secondary: string }>;
}) {
  const memberColumns = sortMembers(options.members);
  const rows: (string | number)[][] = [
    ["Challenge", options.challenge.name],
    ["Round", options.selectedRound],
    ["Notes", options.challenge.notes],
    [],
    [
      "LeaderSlot",
      "Leader",
      "Weakness",
      "AutoPrimary",
      "AutoSecondary",
      "ManualPrimary",
      "ManualSecondary",
      "CoverageMode",
      "TopRecommendations"
    ]
  ];
  const ownedCells: Array<{ row: number; col: number }> = [];
  const missingCells: Array<{ row: number; col: number }> = [];
  const sectionRows: number[] = [];
  const headerRows: number[] = [4];

  options.challenge.leaders.forEach((leader) => {
    const recommendation = options.recommendations.get(leader.slotNumber);
    const autoAssignment = options.assignmentPlan.leaderAssignments.get(leader.slotNumber);
    const manualAssignment = options.manualAssignments[leader.slotNumber] || { primary: "", secondary: "" };

    rows.push([
      leader.slotNumber,
      leader.leaderName,
      leader.weaknessType,
      autoAssignment?.primary?.memberName ?? "",
      autoAssignment?.secondary?.memberName ?? "",
      manualAssignment.primary,
      manualAssignment.secondary,
      recommendation?.coverageMode ?? "uncovered",
      recommendation?.recommendationMembers
        .slice(0, 5)
        .map((member) => `${member.memberName} (${member.score.toFixed(1)})`)
        .join("; ") ?? ""
    ]);
  });

  options.challenge.leaders.forEach((leader) => {
    rows.push([]);
    rows.push([leader.leaderName, `${leader.weaknessType} weak`, ...memberColumns.map((member) => member.displayName)]);
    const leaderHeaderRowIndex = rows.length - 1;
    sectionRows.push(leaderHeaderRowIndex);

    const assignment = options.assignmentPlan.leaderAssignments.get(leader.slotNumber);
    const assignedMemberIds = new Set(
      [assignment?.primary?.memberId, assignment?.secondary?.memberId].filter(Boolean) as string[]
    );

    memberColumns.forEach((member, memberIndex) => {
      if (!assignedMemberIds.has(member.id)) return;
      ownedCells.push({ row: leaderHeaderRowIndex, col: memberIndex + 2 });
    });

    if (leader.importantPairs.length) {
      leader.importantPairs.forEach((pair) => {
        const rowIndex = rows.length;
        const row: string[] = ["", pair.label];
        memberColumns.forEach((member, memberIndex) => {
          const owns = memberOwnsPair(member, pair.pairId);
          row.push("");
          (owns ? ownedCells : missingCells).push({ row: rowIndex, col: memberIndex + 2 });
        });
        rows.push(row);
      });
    }

    if (leader.rebuffPairs.length) {
      leader.rebuffPairs.forEach((pair) => {
        const rowIndex = rows.length;
        const row: string[] = ["", pair.label];
        memberColumns.forEach((member, memberIndex) => {
          const owns = memberOwnsPair(member, pair.pairId);
          row.push("");
          (owns ? ownedCells : missingCells).push({ row: rowIndex, col: memberIndex + 2 });
        });
        rows.push(row);
      });
    }
  });

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  applySheetFormatting(
    sheet,
    [18, 28, ...Array.from({ length: memberColumns.length }, () => 14)],
    rows.length,
    rows
      .map((row, index) => ({ row, index }))
      .filter(({ row, index }) => index <= 2 || (typeof row[0] === "string" && row.some((cell) => typeof cell === "string" && String(cell).length > 18)))
      .map(({ index }) => index)
  );
  applyWrap(sheet, [0, 1, 8], 0, rows.length - 1);

  applyCellStyle(sheet, 0, 0, headerStyle);
  applyCellStyle(sheet, 0, 1, headerStyle);
  applyCellStyle(sheet, 0, 2, headerStyle);

  headerRows.forEach((rowIndex) => {
    const rowLength = rows[rowIndex]?.length ?? 0;
    for (let columnIndex = 0; columnIndex < rowLength; columnIndex += 1) {
      applyCellStyle(sheet, columnIndex, rowIndex, headerStyle);
    }
  });

  sectionRows.forEach((rowIndex) => {
    const rowLength = rows[rowIndex]?.length ?? 0;
    for (let columnIndex = 0; columnIndex < rowLength; columnIndex += 1) {
      applyCellStyle(sheet, columnIndex, rowIndex, sectionStyle);
    }
  });

  ownedCells.forEach(({ row, col }) => {
    const isLeaderHeaderAssignment = sectionRows.includes(row) && col >= 2;
    applyCellStyle(sheet, col, row, isLeaderHeaderAssignment ? assignedHeaderStyle : ownedStyle);
  });
  missingCells.forEach(({ row, col }) => applyCellStyle(sheet, col, row, missingStyle));

  return sheet;
}

function appendSetupSheet(workbook: XLSX.WorkBook, challenge: GymChallenge, members: ImportedMember[], assignmentPlan: GreedyAssignmentPlan) {
  const memberColumns = sortMembers(members);
  const assignedMemberIds = new Set<string>();
  assignmentPlan.leaderAssignments.forEach((assignment) => {
    if (assignment.primary?.memberId) assignedMemberIds.add(assignment.primary.memberId);
    if (assignment.secondary?.memberId) assignedMemberIds.add(assignment.secondary.memberId);
  });
  const setupMembers = assignmentPlan.setupMembers.filter((member) => !assignedMemberIds.has(member.memberId));

  const rows: (string | number)[][] = [["Member", "ReservedForSetup", "FlexibilityScore", "TotalScore", "CoveredLeaders"]];
  rows.push(
    ...setupMembers.map((member) => [
      member.memberName,
      member.reservedForSetup ? "Reserved" : "Flex",
      member.flexibilityScore,
      member.totalScore,
      member.coveredLeaderSlots.join(", ")
    ])
  );
  rows.push([]);
  rows.push(["Rebuff Overview"]);

  const sectionRows: number[] = [];
  const ownedCells: Array<{ row: number; col: number }> = [];
  const missingCells: Array<{ row: number; col: number }> = [];

  challenge.leaders.forEach((leader) => {
    if (!leader.rebuffPairs.length) return;
    rows.push([]);
    rows.push([leader.leaderName, `${leader.weaknessType} weak`, ...memberColumns.map((member) => member.displayName)]);
    sectionRows.push(rows.length - 1);
    leader.rebuffPairs.forEach((pair) => {
      const rowIndex = rows.length;
      const row: string[] = [leader.leaderName, pair.label];
      memberColumns.forEach((member, memberIndex) => {
        const owns = memberOwnsPair(member, pair.pairId);
        row.push("");
        (owns ? ownedCells : missingCells).push({ row: rowIndex, col: memberIndex + 2 });
      });
      rows.push(row);
    });
  });

  const globalSections = [
    buildSingleSectionMatrix("Physical breaks", challenge.setupPairs.physicalBreakPairs, members),
    buildSingleSectionMatrix("Special breaks", challenge.setupPairs.specialBreakPairs, members),
    buildSingleSectionMatrix("Debuffs / chip", challenge.setupPairs.debuffChipPairs, members),
    buildSingleSectionMatrix("Off-type", challenge.setupPairs.offTypePairs, members)
  ].filter((section) => section.rows.length > 1);

  globalSections.forEach((section) => {
    rows.push([]);
    rows.push([section.title, ...section.rows[0]]);
    const sectionHeaderRow = rows.length - 1;
    sectionRows.push(sectionHeaderRow);
    section.rows.forEach((row, rowIndex) => {
      if (rowIndex === 0) return;
      const targetRow = rows.length;
      rows.push(["", ...row]);
      section.ownedCells
        .filter((cell) => cell.row === rowIndex)
        .forEach((cell) => ownedCells.push({ row: targetRow, col: cell.col + 1 }));
      section.missingCells
        .filter((cell) => cell.row === rowIndex)
        .forEach((cell) => missingCells.push({ row: targetRow, col: cell.col + 1 }));
    });
  });

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const tallRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => typeof row[1] === "string" || typeof row[0] === "string")
    .map(({ index }) => index)
    .filter((index) => index > setupMembers.length + 1);
  applySheetFormatting(
    sheet,
    [22, 18, 16, 16, 18, ...Array.from({ length: memberColumns.length }, () => 14)],
    rows.length,
    [...sectionRows, ...tallRows]
  );
  applyWrap(sheet, [0, 1, 4], 0, rows.length - 1);
  for (let columnIndex = 0; columnIndex <= 4; columnIndex += 1) {
    applyCellStyle(sheet, columnIndex, 0, headerStyle);
  }
  const rebuffHeaderRow = setupMembers.length + 3;
  for (let columnIndex = 0; columnIndex < memberColumns.length + 2; columnIndex += 1) {
    applyCellStyle(sheet, columnIndex, rebuffHeaderRow, headerStyle);
  }
  sectionRows.forEach((rowIndex) => {
    for (let columnIndex = 0; columnIndex < memberColumns.length + 5; columnIndex += 1) {
      applyCellStyle(sheet, columnIndex, rowIndex, sectionStyle);
    }
  });
  challenge.leaders.forEach((leader) => {
    if (!leader.rebuffPairs.length) return;

    const sectionRowIndex = rows.findIndex(
      (row) => row[0] === leader.leaderName && row[1] === `${leader.weaknessType} weak`
    );
    if (sectionRowIndex === -1) return;

    const assignment = assignmentPlan.leaderAssignments.get(leader.slotNumber);
    const assignedMemberIds = new Set(
      [assignment?.primary?.memberId, assignment?.secondary?.memberId].filter(Boolean) as string[]
    );

    memberColumns.forEach((member, memberIndex) => {
      if (!assignedMemberIds.has(member.id)) return;
      applyCellStyle(sheet, memberIndex + 2, sectionRowIndex, assignedHeaderStyle);
    });
  });
  ownedCells.forEach(({ row, col }) => applyCellStyle(sheet, col, row, ownedStyle));
  missingCells.forEach(({ row, col }) => applyCellStyle(sheet, col, row, missingStyle));

  XLSX.utils.book_append_sheet(workbook, sheet, "Setup");
}

export function defaultWorkbookFileName(challengeName: string, selectedRound: number) {
  return `${challengeName.replace(/\s+/g, "_")}_round_${selectedRound}.xlsx`;
}

export function buildGymChallengeWorkbook(options: {
  challenge: GymChallenge;
  members: ImportedMember[];
  selectedRound: number;
  recommendations: Map<number, LeaderRecommendation>;
  assignmentPlan: GreedyAssignmentPlan;
  manualAssignments: Record<number, { primary: string; secondary: string }>;
}) {
  const workbook = XLSX.utils.book_new();
  const overviewSheet = buildOverviewSheet(options);
  XLSX.utils.book_append_sheet(workbook, overviewSheet, "Overview");

  appendSetupSheet(workbook, options.challenge, options.members, options.assignmentPlan);
  options.challenge.leaders.forEach((leader) =>
    appendLeaderMatrixSheet(workbook, options.challenge, leader, options.members, {
      selectedRound: options.selectedRound,
      recommendations: options.recommendations,
      assignmentPlan: options.assignmentPlan,
      manualAssignments: options.manualAssignments
    })
  );

  return workbook;
}
