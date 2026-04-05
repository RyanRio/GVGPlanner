import XLSX from "xlsx-js-style";
import { buildGymChallengeWorkbook, defaultWorkbookFileName } from "./workbook-core";
import type { GreedyAssignmentPlan, GymChallenge, ImportedMember, LeaderRecommendation } from "../types";

export function exportGymChallengeWorkbook(options: {
  challenge: GymChallenge;
  members: ImportedMember[];
  selectedRound: number;
  recommendations: Map<number, LeaderRecommendation>;
  assignmentPlan: GreedyAssignmentPlan;
  manualAssignments: Record<number, { primary: string; secondary: string }>;
}) {
  const workbook = buildGymChallengeWorkbook(options);
  XLSX.writeFile(workbook, defaultWorkbookFileName(options.challenge.name, options.selectedRound));
}
