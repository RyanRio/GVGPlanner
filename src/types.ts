export type AppRole = "admin" | "member";

export type PremiumCategory =
  | "general"
  | "master_fair"
  | "arc_fair"
  | "poke_fair"
  | "seasonal"
  | "variety"
  | "special_costume";

export interface CatalogPair {
  pairId: string;
  label: string;
  trainerName: string;
  trainerAlt: string;
  pokemonName: string;
  pokemonForm: string;
  roleCategory: string;
  roleLabel: string;
  exRoleCategory: string;
  exRoleLabel: string;
  type: string;
  region: string;
  acquisition: string;
  premiumCategory: PremiumCategory;
  imagePaths?: string[];
}

export interface ImportedPair {
  pairId: string;
  label: string;
  syncLevel: number;
  isEx: boolean;
  rawValue: string;
  roleCategory: string;
  roleLabel: string;
  exRoleCategory: string;
  exRoleLabel: string;
  type: string;
  premiumCategory: PremiumCategory;
}

export interface ImportedMember {
  id: string;
  displayName: string;
  pairs: ImportedPair[];
  unmatchedKeys: string[];
  premiumCounts: Record<PremiumCategory | "all", number>;
}

export interface PairCatalog {
  byId: Map<string, CatalogPair>;
  totalPairs: number;
}

export interface OverlapEntry {
  pairId: string;
  label: string;
  premiumCategory: PremiumCategory;
  owners: string[];
}

export interface AuthProfile {
  id: string;
  displayName: string;
  appRole: AppRole;
}

export interface GymChallengeLeader {
  id?: string;
  slotNumber: number;
  leaderName: string;
  bossType: string;
  weaknessType: string;
  battle1Effect: string;
  battle2Effect: string;
  battle3Effect: string;
  importantPairs: CatalogPair[];
  rebuffPairs: CatalogPair[];
}

export interface GymChallengeModifiers {
  modifier1: string;
  modifier2: string;
  modifier3: string;
}

export interface ManualLeaderAssignment {
  primaryMemberId: string;
  secondaryMemberId: string;
}

export type ManualLeaderAssignments = Record<number, ManualLeaderAssignment>;

export interface GymChallenge {
  id: string;
  name: string;
  notes: string;
  isCurrent: boolean;
  leaders: GymChallengeLeader[];
  modifiers: GymChallengeModifiers;
  roundStats: GymChallengeRoundStat[];
  setupPairs: {
    physicalBreakPairs: CatalogPair[];
    specialBreakPairs: CatalogPair[];
    debuffChipPairs: CatalogPair[];
    offTypePairs: CatalogPair[];
  };
  setupDutyMemberIds: string[];
  manualAssignments: ManualLeaderAssignments;
  createdAt: string;
  updatedAt: string;
}

export interface GymChallengeRoundStat {
  roundNumber: number;
  points: number;
  cumulativePoints: number;
  middleHp: number;
  middleOffenses: number;
  middleDefenses: number;
  middleSpeed: number;
  sideHp: number;
  sideOffenses: number;
  sideDefenses: number;
  sideSpeed: number;
}

export interface ChallengeRoundPreview {
  roundNumber: number;
  activeModifiers: [string, string, string];
}

export interface LeaderRecommendationMember {
  memberId: string;
  memberName: string;
  score: number;
  matchedImportantPairs: CatalogPair[];
  fallbackPairs: CatalogPair[];
  reasons: string[];
}

export interface LeaderRecommendation {
  leaderSlotNumber: number;
  leaderName: string;
  recommendationMembers: LeaderRecommendationMember[];
  coverageMode: "important_pairs" | "fallback" | "mixed" | "uncovered";
}

export interface AssignedLeaderMember {
  memberId: string | null;
  memberName: string;
  score: number;
  reasons: string[];
  coverageCount: number;
  isFallbackReuse: boolean;
  isManual?: boolean;
}

export interface GreedyLeaderAssignment {
  leaderSlotNumber: number;
  leaderName: string;
  primary: AssignedLeaderMember | null;
  secondary: AssignedLeaderMember | null;
  coverageMode: LeaderRecommendation["coverageMode"];
}

export interface SetupMemberRecommendation {
  memberId: string;
  memberName: string;
  flexibilityScore: number;
  totalScore: number;
  coveredLeaderSlots: number[];
  reservedForSetup: boolean;
}

export interface GreedyAssignmentPlan {
  leaderAssignments: Map<number, GreedyLeaderAssignment>;
  setupMembers: SetupMemberRecommendation[];
}
