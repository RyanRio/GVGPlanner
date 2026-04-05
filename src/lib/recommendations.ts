import type {
  AssignedLeaderMember,
  CatalogPair,
  GreedyAssignmentPlan,
  GreedyLeaderAssignment,
  GymChallenge,
  GymChallengeLeader,
  ImportedMember,
  ImportedPair,
  LeaderRecommendation,
  LeaderRecommendationMember,
  ManualLeaderAssignments
} from "../types";

const COST_20_20 = 1.0;
const COST_EX = 1.5;
const COST_R = 2.0;
const COST_SA_PER_LEVEL = 1.0;

const MOVE_LEVEL_COST: Record<number, number> = {
  1: 0.0,
  2: 0.7,
  3: 1.5,
  4: 2.8,
  5: 4.2
};

function parseAdditionalInvestment(rawValue: string) {
  const text = rawValue ?? "";
  const lower = text.toLowerCase();
  let score = 0;

  const baseMatch = text.match(/^\s*(\d+)/);
  if (baseMatch) {
    const baseLevel = parseInt(baseMatch[1], 10);
    if (baseLevel >= 6) {
      const saLevel = Math.min(5, baseLevel - 5);
      score += saLevel * COST_SA_PER_LEVEL;
    }
  }

  if (lower.includes("20/20")) score += COST_20_20;
  if (/\br\b/i.test(text)) score += COST_R;

  const eMatch = text.match(/(\d+)\s*e/i);
  if (eMatch) {
    const eValue = parseInt(eMatch[1], 10);
    if (!Number.isNaN(eValue)) {
      const clamped = Math.min(10, Math.max(2, eValue));
      const eCost = COST_20_20 + ((clamped - 2) / 8) * (COST_R - COST_20_20);
      score += eCost;
    }
  }

  return score;
}

export function scoreImportedPairInvestment(pair: ImportedPair) {
  const moveLevel = Math.min(5, Math.max(1, pair.syncLevel));
  let score = MOVE_LEVEL_COST[moveLevel] ?? 0;

  if (pair.isEx || pair.rawValue.toLowerCase().includes("ex")) {
    score += COST_EX;
  }

  score += parseAdditionalInvestment(pair.rawValue);
  return score;
}

function importedPairToCatalogShape(pair: ImportedPair): CatalogPair {
  return {
    pairId: pair.pairId,
    label: pair.label,
    trainerName: "",
    trainerAlt: "",
    pokemonName: "",
    pokemonForm: "",
    roleCategory: pair.roleCategory,
    roleLabel: pair.roleLabel,
    exRoleCategory: pair.exRoleCategory,
    exRoleLabel: pair.exRoleLabel,
    type: pair.type,
    region: "",
    acquisition: "",
    premiumCategory: pair.premiumCategory
  };
}

function isFallbackCandidate(pair: ImportedPair, leader: GymChallengeLeader, importantPairIds: Set<string>) {
  if (importantPairIds.has(pair.pairId)) {
    return false;
  }

  const isPremium = pair.premiumCategory === "master_fair" || pair.premiumCategory === "arc_fair";
  const canStrike = pair.roleCategory === "strike" || pair.exRoleCategory === "strike";
  return isPremium && canStrike && pair.type.toLowerCase() === leader.weaknessType.toLowerCase();
}

function roundScore(value: number) {
  return Math.round(value * 10) / 10;
}

function assignmentPriority(score: number, coverageCount: number) {
  return score + Math.max(0, 6 - coverageCount) * 6 - Math.max(0, coverageCount - 1) * 1.5;
}

function toAssignedLeaderMember(
  memberId: string,
  members: ImportedMember[],
  recommendation?: LeaderRecommendation,
  manualRole?: "primary" | "secondary"
): AssignedLeaderMember | null {
  if (!memberId) return null;

  const recommendedMember = recommendation?.recommendationMembers.find((member) => member.memberId === memberId);
  if (recommendedMember) {
    return {
      memberId: recommendedMember.memberId,
      memberName: recommendedMember.memberName,
      score: recommendedMember.score,
      reasons: manualRole ? [`Manual ${manualRole}`, ...recommendedMember.reasons] : recommendedMember.reasons,
      coverageCount: 0,
      isFallbackReuse: false,
      isManual: Boolean(manualRole)
    };
  }

  const member = members.find((entry) => entry.id === memberId);
  if (!member) return null;

  return {
    memberId: member.id,
    memberName: member.displayName,
    score: 0,
    reasons: manualRole ? [`Manual ${manualRole}`] : [],
    coverageCount: 0,
    isFallbackReuse: false,
    isManual: Boolean(manualRole)
  };
}

export function buildLeaderMemberRows(
  leader: GymChallengeLeader,
  members: ImportedMember[]
) {
  const importantPairIds = new Set(leader.importantPairs.map((pair) => pair.pairId));

  const explicitCoverageCount = members.filter((member) =>
    member.pairs.some((pair) => importantPairIds.has(pair.pairId))
  ).length;
  const useFallback = importantPairIds.size === 0 || explicitCoverageCount <= 2;

  return members
    .map((member) => {
      const matchedPairs = member.pairs.filter((pair) => importantPairIds.has(pair.pairId));
      const filteredFallbackPairs = member.pairs.filter((pair) => isFallbackCandidate(pair, leader, importantPairIds));
      const explicitInvestment = matchedPairs.reduce((sum, pair) => sum + scoreImportedPairInvestment(pair), 0);
      const fallbackInvestment = filteredFallbackPairs.reduce((sum, pair) => sum + scoreImportedPairInvestment(pair), 0);
      const scarcityBoost = explicitCoverageCount > 0 ? Math.max(0, (3 - explicitCoverageCount) * 8) : 0;
      const commonCoveragePenalty = explicitCoverageCount > 2 ? (explicitCoverageCount - 2) * 2.5 : 0;

      let score = 0;
      const reasons: string[] = [];

      if (matchedPairs.length > 0) {
        score += 100;
        score += matchedPairs.length * 26;
        score += explicitInvestment * 3.5;
        score += scarcityBoost;
        score -= commonCoveragePenalty;

        reasons.push(
          matchedPairs.length === 1 ? "owns 1 important pair" : `owns ${matchedPairs.length} important pairs`
        );

        if (explicitCoverageCount <= 2) {
          reasons.push("low-coverage owner");
        }

        if (explicitInvestment >= 6) {
          reasons.push("high investment");
        }
      }

      if (useFallback && filteredFallbackPairs.length > 0) {
        score += matchedPairs.length > 0 ? 12 : 48;
        score += filteredFallbackPairs.length * 8;
        score += fallbackInvestment * 2.2;

        if (matchedPairs.length === 0) {
          reasons.push("strong fallback typed striker");
        } else {
          reasons.push("also has fallback typed striker");
        }
      }

      const matchedImportantPairs = leader.importantPairs.filter((pair) =>
        matchedPairs.some((ownedPair) => ownedPair.pairId === pair.pairId)
      );

      return {
        memberId: member.id,
        memberName: member.displayName,
        score: roundScore(score),
        matchedImportantPairs,
        fallbackPairs: filteredFallbackPairs.map(importedPairToCatalogShape),
        reasons: Array.from(new Set(reasons))
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.memberName.localeCompare(b.memberName);
    });
}

export function buildLeaderRecommendations(
  challenge: GymChallenge | null,
  members: ImportedMember[]
) {
  if (!challenge) return new Map<number, LeaderRecommendation>();

  const recommendations = new Map<number, LeaderRecommendation>();

  challenge.leaders.forEach((leader) => {
    const allRows = buildLeaderMemberRows(leader, members);
    const recommendationMembers: LeaderRecommendationMember[] = allRows.filter(
      (member) => member.score > 0 || member.matchedImportantPairs.length > 0
    );
    const hasImportant = recommendationMembers.some((member) => member.matchedImportantPairs.length > 0);
    const hasFallback = recommendationMembers.some((member) => member.fallbackPairs.length > 0);

    let coverageMode: LeaderRecommendation["coverageMode"] = "uncovered";
    if (hasImportant) {
      coverageMode = hasFallback ? "mixed" : "important_pairs";
    } else if (hasFallback) {
      coverageMode = "fallback";
    }

    recommendations.set(leader.slotNumber, {
      leaderSlotNumber: leader.slotNumber,
      leaderName: leader.leaderName,
      recommendationMembers,
      coverageMode
    });
  });

  return recommendations;
}

export function buildGreedyLeaderAssignments(
  challenge: GymChallenge | null,
  recommendations: Map<number, LeaderRecommendation>,
  members: ImportedMember[],
  options?: { setupDutyMemberIds?: string[]; manualAssignments?: ManualLeaderAssignments }
) {
  const plan: GreedyAssignmentPlan = {
    leaderAssignments: new Map<number, GreedyLeaderAssignment>(),
    setupMembers: []
  };
  if (!challenge) return plan;
  const reservedSetupMembers = new Set(options?.setupDutyMemberIds ?? []);
  const manualAssignments = options?.manualAssignments ?? {};

  const memberCoverageCounts = new Map<string, number>();
  const memberScoreTotals = new Map<string, number>();
  recommendations.forEach((recommendation) => {
    recommendation.recommendationMembers.forEach((member) => {
      memberCoverageCounts.set(member.memberId, (memberCoverageCounts.get(member.memberId) ?? 0) + 1);
      memberScoreTotals.set(member.memberId, (memberScoreTotals.get(member.memberId) ?? 0) + member.score);
    });
  });

  const assignedMembers = new Set<string>();
  Object.values(manualAssignments).forEach((assignment) => {
    if (assignment.primaryMemberId) {
      assignedMembers.add(assignment.primaryMemberId);
    }
    if (assignment.secondaryMemberId) {
      assignedMembers.add(assignment.secondaryMemberId);
    }
  });
  const orderedLeaders = challenge.leaders
    .map((leader) => ({
      leader,
      recommendation: recommendations.get(leader.slotNumber)
    }))
    .sort((a, b) => {
      const aCount = a.recommendation?.recommendationMembers.length ?? 0;
      const bCount = b.recommendation?.recommendationMembers.length ?? 0;
      if (aCount !== bCount) return aCount - bCount;

      const aImportant = a.recommendation?.recommendationMembers.filter((member) => member.matchedImportantPairs.length > 0).length ?? 0;
      const bImportant = b.recommendation?.recommendationMembers.filter((member) => member.matchedImportantPairs.length > 0).length ?? 0;
      if (aImportant !== bImportant) return aImportant - bImportant;

      const aTop = a.recommendation?.recommendationMembers[0]?.score ?? -Infinity;
      const bTop = b.recommendation?.recommendationMembers[0]?.score ?? -Infinity;
      return bTop - aTop;
    });

  function pickCandidate(
    recommendation: LeaderRecommendation,
    alreadyUsed: Set<string>,
    excludedMemberIds: Set<string>,
    allowReuse: boolean
  ) {
    const unusedCandidates = recommendation.recommendationMembers.filter(
      (member) =>
        !alreadyUsed.has(member.memberId) &&
        !excludedMemberIds.has(member.memberId) &&
        !reservedSetupMembers.has(member.memberId)
    );
    const reusableCandidates = allowReuse
      ? recommendation.recommendationMembers.filter(
          (member) => !excludedMemberIds.has(member.memberId) && !reservedSetupMembers.has(member.memberId)
        )
      : [];
    const pool = unusedCandidates.length ? unusedCandidates : reusableCandidates;
    if (!pool.length) return null;

    return pool
      .slice()
      .sort((a, b) => {
        const aCoverage = memberCoverageCounts.get(a.memberId) ?? 99;
        const bCoverage = memberCoverageCounts.get(b.memberId) ?? 99;
        const aPriority = assignmentPriority(a.score, aCoverage);
        const bPriority = assignmentPriority(b.score, bCoverage);
        if (bPriority !== aPriority) return bPriority - aPriority;
        if (b.score !== a.score) return b.score - a.score;
        return a.memberName.localeCompare(b.memberName);
      })[0];
  }

  orderedLeaders.forEach(({ leader, recommendation }) => {
    const manualAssignment = manualAssignments[leader.slotNumber] ?? {
      primaryMemberId: "",
      secondaryMemberId: ""
    };

    const manualPrimary = toAssignedLeaderMember(manualAssignment.primaryMemberId, members, recommendation, "primary");
    const manualSecondary = toAssignedLeaderMember(
      manualAssignment.secondaryMemberId,
      members,
      recommendation,
      "secondary"
    );

    if (!recommendation || recommendation.recommendationMembers.length === 0) {
      plan.leaderAssignments.set(leader.slotNumber, {
        leaderSlotNumber: leader.slotNumber,
        leaderName: leader.leaderName,
        primary: manualPrimary,
        secondary: manualSecondary,
        coverageMode: "uncovered"
      });
      return;
    }

    const excludedMemberIds = new Set<string>([manualAssignment.primaryMemberId, manualAssignment.secondaryMemberId].filter(Boolean));
    let primaryCandidate = null;
    let secondaryCandidate = null;

    if (!manualPrimary) {
      primaryCandidate = pickCandidate(recommendation, assignedMembers, excludedMemberIds, false);
      if (primaryCandidate?.memberId) {
        assignedMembers.add(primaryCandidate.memberId);
      }
    }

    if (!manualSecondary) {
      secondaryCandidate = pickCandidate(
        recommendation,
        assignedMembers,
        new Set(
          [
            manualAssignment.primaryMemberId,
            manualAssignment.secondaryMemberId,
            primaryCandidate?.memberId,
            manualPrimary?.memberId
          ].filter(Boolean) as string[]
        ),
        false
      );
      if (secondaryCandidate?.memberId && !assignedMembers.has(secondaryCandidate.memberId)) {
        assignedMembers.add(secondaryCandidate.memberId);
      }
    }

    plan.leaderAssignments.set(leader.slotNumber, {
      leaderSlotNumber: leader.slotNumber,
      leaderName: leader.leaderName,
      primary: manualPrimary
        ? {
            ...manualPrimary,
            coverageCount: memberCoverageCounts.get(manualPrimary.memberId ?? "") ?? 0
          }
        : primaryCandidate
        ? {
            memberId: primaryCandidate.memberId,
            memberName: primaryCandidate.memberName,
            score: primaryCandidate.score,
            reasons: primaryCandidate.reasons,
            coverageCount: memberCoverageCounts.get(primaryCandidate.memberId) ?? 0,
            isFallbackReuse: false
          }
        : null,
      secondary: manualSecondary
        ? {
            ...manualSecondary,
            coverageCount: memberCoverageCounts.get(manualSecondary.memberId ?? "") ?? 0
          }
        : secondaryCandidate
        ? {
            memberId: secondaryCandidate.memberId,
            memberName: secondaryCandidate.memberName,
            score: secondaryCandidate.score,
            reasons: secondaryCandidate.reasons,
            coverageCount: memberCoverageCounts.get(secondaryCandidate.memberId) ?? 0,
            isFallbackReuse: false
          }
        : null,
      coverageMode: recommendation.coverageMode
    });
  });

  const coveredLeaderSlotsByMember = new Map<string, number[]>();
  challenge.leaders.forEach((leader) => {
    const rebuffPairIds = new Set(leader.rebuffPairs.map((pair) => pair.pairId));
    if (!rebuffPairIds.size) return;

    members.forEach((member) => {
      if (!member.pairs.some((pair) => rebuffPairIds.has(pair.pairId))) {
        return;
      }

      const slots = coveredLeaderSlotsByMember.get(member.id) ?? [];
      slots.push(leader.slotNumber);
      coveredLeaderSlotsByMember.set(member.id, slots);
    });
  });

  members.forEach((member) => {
    if (assignedMembers.has(member.id)) return;

    plan.setupMembers.push({
      memberId: member.id,
      memberName: member.displayName,
      flexibilityScore: roundScore((memberScoreTotals.get(member.id) ?? 0) + (memberCoverageCounts.get(member.id) ?? 0) * 12),
      totalScore: roundScore(memberScoreTotals.get(member.id) ?? 0),
      coveredLeaderSlots: (coveredLeaderSlotsByMember.get(member.id) ?? []).sort((a, b) => a - b),
      reservedForSetup: reservedSetupMembers.has(member.id)
    });
  });

  plan.setupMembers.sort((a, b) => {
    if (a.reservedForSetup !== b.reservedForSetup) return a.reservedForSetup ? -1 : 1;
    if (b.flexibilityScore !== a.flexibilityScore) return b.flexibilityScore - a.flexibilityScore;
    return a.memberName.localeCompare(b.memberName);
  });

  return plan;
}
