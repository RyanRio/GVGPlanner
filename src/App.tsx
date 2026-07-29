import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { fetchCurrentProfile, getSession, onAuthStateChange, signIn, signOut } from "./lib/auth";
import {
  deleteRosterMember,
  fetchCatalog,
  fetchChallengeList,
  fetchCurrentChallenge,
  fetchImportedMembers,
  importMemberRoster,
  saveChallengeManualAssignment,
  saveChallengeSetupDutyMembers,
  saveGymChallenge,
  setCurrentChallenge
} from "./lib/gvg-data";
import { exportGymChallengeWorkbook } from "./lib/export-workbook";
import { buildGreedyLeaderAssignments, buildLeaderRecommendations } from "./lib/recommendations";
import { parseSyncPairsTrackerExport } from "./lib/sync-pairs";
import type {
  AuthProfile,
  GreedyLeaderAssignment,
  GymChallenge,
  GymChallengeLeader,
  GymChallengeModifiers,
  ImportedMember,
  LeaderRecommendation,
  ManualLeaderAssignments,
  PairCatalog
} from "./types";

type AppView = "roster" | "gym-challenge" | "challenge-admin";
type SetupPairBucket = "physicalBreakPairs" | "specialBreakPairs" | "debuffChipPairs" | "offTypePairs";

interface ChallengeDraft {
  id: string;
  name: string;
  notes: string;
  leaders: GymChallengeLeader[];
  modifiers: GymChallengeModifiers;
  roundStats: GymChallenge["roundStats"];
  setupPairs: {
    physicalBreakPairs: GymChallengeLeader["importantPairs"];
    specialBreakPairs: GymChallengeLeader["importantPairs"];
    debuffChipPairs: GymChallengeLeader["importantPairs"];
    offTypePairs: GymChallengeLeader["importantPairs"];
  };
}

type LeaderPairInputs = Record<number, string>;
type LeaderRebuffInputs = Record<number, string>;
type SetupPairInputs = Record<SetupPairBucket, string>;
type LeaderNotesMap = Record<number, string>;

const weaknessTypes = [
  "Bug",
  "Dark",
  "Dragon",
  "Electric",
  "Fairy",
  "Fighting",
  "Fire",
  "Flying",
  "Ghost",
  "Grass",
  "Ground",
  "Ice",
  "Normal",
  "Poison",
  "Psychic",
  "Rock",
  "Steel",
  "Water"
];

function createEmptyChallengeDraft(): ChallengeDraft {
  return {
    id: "",
    name: "",
    notes: "",
    leaders: Array.from({ length: 8 }, (_, index) => ({
      slotNumber: index + 1,
      leaderName: "",
      bossType: "",
      weaknessType: "",
      battle1Effect: "",
      battle2Effect: "",
      battle3Effect: "",
      importantPairs: [],
      rebuffPairs: []
    })),
    modifiers: {
      modifier1: "",
      modifier2: "",
      modifier3: ""
    },
    roundStats: [],
    setupPairs: {
      physicalBreakPairs: [],
      specialBreakPairs: [],
      debuffChipPairs: [],
      offTypePairs: []
    }
  };
}

function challengeToDraft(challenge: GymChallenge): ChallengeDraft {
  return {
    id: challenge.id,
    name: challenge.name,
    notes: challenge.notes,
    leaders: challenge.leaders.map((leader) => ({
      ...leader,
      importantPairs: [...leader.importantPairs],
      rebuffPairs: [...leader.rebuffPairs]
    })),
    modifiers: { ...challenge.modifiers },
    roundStats: challenge.roundStats.map((round) => ({ ...round })),
    setupPairs: {
      physicalBreakPairs: [...challenge.setupPairs.physicalBreakPairs],
      specialBreakPairs: [...challenge.setupPairs.specialBreakPairs],
      debuffChipPairs: [...challenge.setupPairs.debuffChipPairs],
      offTypePairs: [...challenge.setupPairs.offTypePairs]
    }
  };
}

function getLeaderModifier(modifiers: GymChallengeModifiers, roundNumber: number, slotNumber: number) {
  const cycle = [modifiers.modifier1, modifiers.modifier2, modifiers.modifier3];

  if (cycle.some((value) => !value.trim())) {
    return "";
  }

  if (roundNumber < 4) {
    return "";
  }

  const baseOffset = (roundNumber - 4) % 3;
  const modifierIndex = (baseOffset + slotNumber - 1) % 3;
  return cycle[modifierIndex];
}

function getLeaderRoundEffect(leader: GymChallengeLeader, modifiers: GymChallengeModifiers, roundNumber: number) {
  if (roundNumber === 1) return leader.battle1Effect.trim();
  if (roundNumber === 2) return leader.battle2Effect.trim();
  if (roundNumber === 3) return leader.battle3Effect.trim();
  return getLeaderModifier(modifiers, roundNumber, leader.slotNumber).trim();
}

function getRoundStats(challenge: GymChallenge | null, roundNumber: number) {
  if (!challenge?.roundStats.length) return null;
  const exact = challenge.roundStats.find((round) => round.roundNumber === roundNumber);
  if (exact) return exact;
  const eligible = challenge.roundStats
    .filter((round) => round.roundNumber <= roundNumber)
    .sort((a, b) => b.roundNumber - a.roundNumber)[0];
  return eligible ?? challenge.roundStats[challenge.roundStats.length - 1] ?? null;
}

function formatNumber(value: number) {
  return value.toLocaleString();
}

function buildLeaderPairInputs() {
  return Array.from({ length: 8 }, (_, index) => index + 1).reduce<LeaderPairInputs>((inputs, slotNumber) => {
    inputs[slotNumber] = "";
    return inputs;
  }, {});
}

function buildLeaderRebuffInputs() {
  return Array.from({ length: 8 }, (_, index) => index + 1).reduce<LeaderRebuffInputs>((inputs, slotNumber) => {
    inputs[slotNumber] = "";
    return inputs;
  }, {});
}

function buildSetupPairInputs(): SetupPairInputs {
  return {
    physicalBreakPairs: "",
    specialBreakPairs: "",
    debuffChipPairs: "",
    offTypePairs: ""
  };
}

function buildEmptyLeaderNotes() {
  return Array.from({ length: 8 }, (_, index) => index + 1).reduce<LeaderNotesMap>((notes, slotNumber) => {
    notes[slotNumber] = "";
    return notes;
  }, {});
}

function findMemberDisplayName(members: ImportedMember[], memberId: string) {
  return members.find((member) => member.id === memberId)?.displayName ?? "";
}

function buildWorkbookManualAssignments(members: ImportedMember[], manualAssignments: ManualLeaderAssignments) {
  return Object.fromEntries(
    Object.entries(manualAssignments).map(([slotNumber, assignment]) => [
      Number(slotNumber),
      {
        primary: findMemberDisplayName(members, assignment.primaryMemberId),
        secondary: findMemberDisplayName(members, assignment.secondaryMemberId)
      }
    ])
  );
}

function ChallengeReadOnly({
  challenge,
  recommendations,
  selectedRound,
  onRoundChange
}: {
  challenge: GymChallenge | null;
  recommendations: Map<number, LeaderRecommendation>;
  selectedRound: number;
  onRoundChange: (roundNumber: number) => void;
}) {
  if (!challenge) {
    return (
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-kicker">Current challenge</p>
            <h2>No challenge selected</h2>
          </div>
        </div>
        <div className="empty-state">An admin has not selected the current gym challenge yet.</div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="section-kicker">Current challenge</p>
          <h2>{challenge.name}</h2>
        </div>
        <span className="status-pill ready">Active</span>
      </div>

      {challenge.notes ? <p className="helper challenge-notes">{challenge.notes}</p> : null}

      <div className="round-control">
        <div className="round-control-header">
          <div>
            <p className="section-kicker">Challenge round</p>
            <h3>Round {selectedRound}</h3>
          </div>
          <span className="helper round-helper">
            {selectedRound < 4 ? "No special modifiers before round 4." : "Leader cards show this round's modifier."}
          </span>
        </div>

        <input
          type="range"
          min="1"
          max="30"
          step="1"
          value={selectedRound}
          onChange={(event) => onRoundChange(Number(event.target.value))}
        />
      </div>

      {(() => {
        const roundStats = getRoundStats(challenge, selectedRound);
        if (!roundStats) return null;

        return (
          <section className="subpanel compact-subpanel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">Round stats</p>
                <h3>Round {selectedRound}</h3>
              </div>
              <span className="badge recommendation-score">{formatNumber(roundStats.points)} pts</span>
            </div>
            <div className="badge-row">
              <span className="badge muted-badge">Total {formatNumber(roundStats.cumulativePoints)}</span>
              <span className="badge muted-badge">Middle HP {formatNumber(roundStats.middleHp)}</span>
              <span className="badge muted-badge">Sides HP {formatNumber(roundStats.sideHp)}</span>
              <span className="badge muted-badge">Middle Atk {formatNumber(roundStats.middleOffenses)}</span>
              <span className="badge muted-badge">Sides Atk {formatNumber(roundStats.sideOffenses)}</span>
            </div>
          </section>
        );
      })()}

      <div className="leaders-grid">
        {challenge.leaders.map((leader) => (
          <article className="leader-card" key={leader.slotNumber}>
            <p className="leader-slot">Leader {leader.slotNumber}</p>
            <h3>{leader.leaderName}</h3>
            <p>
              {leader.bossType ? `${leader.bossType} | ` : ""}
              {leader.weaknessType} weak
            </p>
            {getLeaderRoundEffect(leader, challenge.modifiers, selectedRound) ? (
              <span className="badge">{getLeaderRoundEffect(leader, challenge.modifiers, selectedRound)}</span>
            ) : (
              <span className="helper">No special modifier</span>
            )}
            {leader.importantPairs.length ? (
              <div className="important-pairs">
                <p className="section-kicker">Important pairs</p>
                <div className="badge-row">
                  {leader.importantPairs.map((pair) => (
                    <span className="badge muted-badge" key={pair.pairId}>
                      {pair.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="recommendation-block">
              <p className="section-kicker">Recommended members</p>
              {(() => {
                const recommendation = recommendations.get(leader.slotNumber);
                if (!recommendation || recommendation.recommendationMembers.length === 0) {
                  return <div className="empty-state compact-empty">No strong coverage found for this leader yet.</div>;
                }

                return (
                  <div className="recommendation-list">
                    {recommendation.recommendationMembers.map((member) => (
                      <article className="recommendation-item" key={`${leader.slotNumber}-${member.memberId}`}>
                        <div className="recommendation-header">
                          <strong>{member.memberName}</strong>
                          <span className="badge recommendation-score">{member.score.toFixed(1)}</span>
                        </div>
                        <p className="recommendation-reasons">{member.reasons.join(" | ")}</p>
                      </article>
                    ))}
                  </div>
                );
              })()}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function GymChallengeWorkspace({
  challenge,
  members,
  recommendations,
  selectedRound,
  onRoundChange,
  selectedLeaderSlot,
  onSelectLeader,
  assignmentPlan,
  setupDutyMemberIds,
  onToggleSetupDuty,
  manualAssignments,
  onManualAssignmentChange,
  leaderNotes,
  onLeaderNotesChange
}: {
  challenge: GymChallenge | null;
  members: ImportedMember[];
  recommendations: Map<number, LeaderRecommendation>;
  selectedRound: number;
  onRoundChange: (roundNumber: number) => void;
  selectedLeaderSlot: number;
  onSelectLeader: (slotNumber: number) => void;
  assignmentPlan: {
    leaderAssignments: Map<number, GreedyLeaderAssignment>;
    setupMembers: Array<{ memberId: string; memberName: string; flexibilityScore: number; coveredLeaderSlots: number[]; reservedForSetup: boolean }>;
  };
  setupDutyMemberIds: string[];
  onToggleSetupDuty: (memberId: string) => void;
  manualAssignments: ManualLeaderAssignments;
  onManualAssignmentChange: (slotNumber: number, role: "primary" | "secondary", memberId: string) => void;
  leaderNotes: LeaderNotesMap;
  onLeaderNotesChange: (slotNumber: number, value: string) => void;
}) {
  if (!challenge) {
    return (
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-kicker">Gym challenge</p>
            <h2>No challenge selected</h2>
          </div>
        </div>
        <div className="empty-state">Choose a current challenge in Challenge Admin before planning assignments.</div>
      </section>
    );
  }

  const selectedLeader =
    challenge.leaders.find((leader) => leader.slotNumber === selectedLeaderSlot) ?? challenge.leaders[0];

  const selectedRecommendation = recommendations.get(selectedLeader.slotNumber);
  const selectedAutoAssignment = assignmentPlan.leaderAssignments.get(selectedLeader.slotNumber);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="section-kicker">Gym challenge</p>
          <h2>{challenge.name}</h2>
        </div>
        <span className="status-pill ready">Leader planning</span>
      </div>

      {challenge.notes ? <p className="helper challenge-notes">{challenge.notes}</p> : null}

      <div className="round-control">
        <div className="round-control-header">
          <div>
            <p className="section-kicker">Challenge round</p>
            <h3>Round {selectedRound}</h3>
          </div>
          <span className="helper round-helper">
            {selectedRound < 4 ? "No special modifiers before round 4." : "Assignments reflect this round's modifier."}
          </span>
        </div>

        <input
          type="range"
          min="1"
          max="30"
          step="1"
          value={selectedRound}
          onChange={(event) => onRoundChange(Number(event.target.value))}
        />
      </div>

      {(() => {
        const roundStats = getRoundStats(challenge, selectedRound);
        if (!roundStats) return null;

        return (
          <section className="subpanel compact-subpanel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">Round stats</p>
                <h3>Round {selectedRound}</h3>
              </div>
              <span className="badge recommendation-score">{formatNumber(roundStats.points)} pts</span>
            </div>
            <div className="badge-row">
              <span className="badge muted-badge">Total {formatNumber(roundStats.cumulativePoints)}</span>
              <span className="badge muted-badge">Middle HP {formatNumber(roundStats.middleHp)}</span>
              <span className="badge muted-badge">Sides HP {formatNumber(roundStats.sideHp)}</span>
              <span className="badge muted-badge">Middle Atk {formatNumber(roundStats.middleOffenses)}</span>
              <span className="badge muted-badge">Sides Atk {formatNumber(roundStats.sideOffenses)}</span>
            </div>
          </section>
        );
      })()}

      <div className="leader-tabs">
        {challenge.leaders.map((leader) => (
          <button
            className={`leader-tab ${leader.slotNumber === selectedLeader.slotNumber ? "active" : ""}`}
            key={leader.slotNumber}
            onClick={() => onSelectLeader(leader.slotNumber)}
            type="button"
          >
            <strong>{leader.leaderName}</strong>
            <span>{leader.weaknessType}</span>
          </button>
        ))}
      </div>

      <div className="workspace-grid">
        <section className="panel-subsection workspace-main">
          <div className="workspace-summary">
            <div>
              <p className="section-kicker">Selected leader</p>
              <h3>{selectedLeader.leaderName}</h3>
            </div>
            <div className="badge-row">
              <span className="badge muted-badge">{selectedLeader.weaknessType} weak</span>
              {selectedLeader.bossType ? <span className="badge muted-badge">{selectedLeader.bossType}</span> : null}
              {getLeaderRoundEffect(selectedLeader, challenge.modifiers, selectedRound) ? (
                <span className="badge">{getLeaderRoundEffect(selectedLeader, challenge.modifiers, selectedRound)}</span>
              ) : (
                <span className="badge muted-badge">No special modifier</span>
              )}
              <span className="badge recommendation-score">
                Primary: {selectedAutoAssignment?.primary?.memberName ?? "Uncovered"}
              </span>
              <span className="badge muted-badge">
                Secondary: {selectedAutoAssignment?.secondary?.memberName ?? "Uncovered"}
              </span>
            </div>
          </div>

          <div className="workspace-columns">
            <section className="subpanel">
              <p className="section-kicker">Important pairs</p>
              {selectedLeader.importantPairs.length ? (
                <div className="badge-row">
                  {selectedLeader.importantPairs.map((pair) => (
                    <span className="badge muted-badge" key={pair.pairId}>
                      {pair.label}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="empty-state compact-empty">No important pairs configured for this leader yet.</div>
              )}
            </section>

            <section className="subpanel">
              <p className="section-kicker">Setup pairs</p>
              <div className="setup-pair-groups">
                <div>
                  <strong>Rebuff</strong>
                  {selectedLeader.rebuffPairs.length ? (
                    <div className="badge-row">
                      {selectedLeader.rebuffPairs.map((pair) => (
                        <span className="badge muted-badge" key={`rebuff-${pair.pairId}`}>
                          {pair.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="helper">No rebuff setup pairs listed.</p>
                  )}
                </div>
                <div>
                  <strong>Breaks</strong>
                  <div className="badge-row">
                    {challenge.setupPairs.physicalBreakPairs.map((pair) => (
                      <span className="badge muted-badge" key={`phys-${pair.pairId}`}>
                        {pair.label}
                      </span>
                    ))}
                    {challenge.setupPairs.specialBreakPairs.map((pair) => (
                      <span className="badge muted-badge" key={`spec-${pair.pairId}`}>
                        {pair.label}
                      </span>
                    ))}
                    {!challenge.setupPairs.physicalBreakPairs.length && !challenge.setupPairs.specialBreakPairs.length ? (
                      <span className="helper">No break setup pairs listed.</span>
                    ) : null}
                  </div>
                </div>
                <div>
                  <strong>Debuffs / chip</strong>
                  {challenge.setupPairs.debuffChipPairs.length ? (
                    <div className="badge-row">
                      {challenge.setupPairs.debuffChipPairs.map((pair) => (
                        <span className="badge muted-badge" key={`chip-${pair.pairId}`}>
                          {pair.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="helper">No debuff or chip setup pairs listed.</p>
                  )}
                </div>
                <div>
                  <strong>Off-type</strong>
                  {challenge.setupPairs.offTypePairs.length ? (
                    <div className="badge-row">
                      {challenge.setupPairs.offTypePairs.map((pair) => (
                        <span className="badge muted-badge" key={`off-type-${pair.pairId}`}>
                          {pair.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="helper">No off-type pairs listed.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="subpanel">
              <div className="compact-assignments">
                <label className="field compact-field">
                  <span>Manual primary</span>
                  <select
                    value={manualAssignments[selectedLeader.slotNumber]?.primaryMemberId ?? ""}
                    onChange={(event) => onManualAssignmentChange(selectedLeader.slotNumber, "primary", event.target.value)}
                  >
                    <option value="">Use auto primary</option>
                    {members
                      .slice()
                      .sort((a, b) => a.displayName.localeCompare(b.displayName))
                      .map((member) => (
                        <option key={`primary-${member.id}`} value={member.id}>
                          {member.displayName}
                        </option>
                      ))}
                  </select>
                </label>

                <label className="field compact-field">
                  <span>Manual secondary</span>
                  <select
                    value={manualAssignments[selectedLeader.slotNumber]?.secondaryMemberId ?? ""}
                    onChange={(event) => onManualAssignmentChange(selectedLeader.slotNumber, "secondary", event.target.value)}
                  >
                    <option value="">Use auto secondary</option>
                    {members
                      .slice()
                      .sort((a, b) => a.displayName.localeCompare(b.displayName))
                      .map((member) => (
                        <option key={`secondary-${member.id}`} value={member.id}>
                          {member.displayName}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
            </section>
          </div>

          <section className="subpanel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">Assignments</p>
                <h3>Recommended members</h3>
              </div>
              <span className="helper">{selectedRecommendation?.coverageMode ?? "uncovered"}</span>
            </div>

            {selectedRecommendation && selectedRecommendation.recommendationMembers.length ? (
              <div className="assignment-list">
                {selectedRecommendation.recommendationMembers.slice(0, 5).map((recommendation) => (
                  <article className="assignment-card" key={`${selectedLeader.slotNumber}-${recommendation.memberId}`}>
                    <div className="assignment-header">
                      <div>
                        <strong>{recommendation.memberName}</strong>
                        <p className="recommendation-reasons">{recommendation.reasons.join(" | ")}</p>
                      </div>
                      <span className="badge recommendation-score">{recommendation.score.toFixed(1)}</span>
                    </div>

                    {recommendation.matchedImportantPairs.length ? (
                      <div className="assignment-section">
                        <p className="section-kicker">Important coverage</p>
                        <div className="badge-row">
                          {recommendation.matchedImportantPairs.map((pair) => (
                            <span className="badge muted-badge" key={`${recommendation.memberId}-${pair.pairId}`}>
                              {pair.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {recommendation.fallbackPairs.length ? (
                      <div className="assignment-section">
                        <p className="section-kicker">Fallback options</p>
                        <div className="badge-row">
                          {recommendation.fallbackPairs.map((pair) => (
                            <span className="badge muted-badge" key={`${recommendation.memberId}-fallback-${pair.pairId}`}>
                              {pair.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="badge-row">
                      {selectedAutoAssignment?.primary?.memberId === recommendation.memberId ? (
                        <span className="badge recommendation-score">Auto primary</span>
                      ) : null}
                      {selectedAutoAssignment?.secondary?.memberId === recommendation.memberId ? (
                        <span className="badge recommendation-score">Auto secondary</span>
                      ) : null}
                      {manualAssignments[selectedLeader.slotNumber]?.primaryMemberId === recommendation.memberId ? (
                        <span className="badge muted-badge">Manual primary</span>
                      ) : null}
                      {manualAssignments[selectedLeader.slotNumber]?.secondaryMemberId === recommendation.memberId ? (
                        <span className="badge muted-badge">Manual secondary</span>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">No recommendations available for this leader yet.</div>
            )}
          </section>
        </section>

        <aside className="panel-subsection workspace-side">
          <section className="subpanel compact-subpanel">
            <p className="section-kicker">Setup duty</p>
            <div className="setup-duty-picker">
              {members
                .slice()
                .sort((a, b) => a.displayName.localeCompare(b.displayName))
                .map((member) => (
                  <label className="setup-duty-option" key={`setup-duty-${member.id}`}>
                    <input
                      type="checkbox"
                      checked={setupDutyMemberIds.includes(member.id)}
                      onChange={() => onToggleSetupDuty(member.id)}
                    />
                    <span>{member.displayName}</span>
                  </label>
                ))}
            </div>
          </section>

          <section className="subpanel compact-subpanel">
            <p className="section-kicker">Setup / flex</p>
            {assignmentPlan.setupMembers.length ? (
              <div className="bench-list">
                {assignmentPlan.setupMembers.map((member) => (
                  <article className="bench-item" key={member.memberName}>
                    <strong>{member.memberName}</strong>
                    <p>
                      {member.reservedForSetup ? "Reserved setup" : "Flex"} | Flex {member.flexibilityScore.toFixed(1)} | Leaders{" "}
                      {member.coveredLeaderSlots.join(", ") || "None"}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state compact-empty">No setup/flex members available.</div>
            )}
          </section>

          <section className="subpanel">
            <p className="section-kicker">Leader notes</p>
            <label className="field">
              <span>Notes</span>
              <textarea
                rows={4}
                value={leaderNotes[selectedLeader.slotNumber] ?? ""}
                onChange={(event) => onLeaderNotesChange(selectedLeader.slotNumber, event.target.value)}
                placeholder="Track plans, sequencing, assigned players, or caveats for this leader."
              />
            </label>
          </section>
        </aside>
      </div>
    </section>
  );
}

function App() {
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [catalog, setCatalog] = useState<PairCatalog | null>(null);
  const [members, setMembers] = useState<ImportedMember[]>([]);
  const [memberName, setMemberName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [status, setStatus] = useState("Checking session...");
  const [error, setError] = useState("");
  const [isBooting, setIsBooting] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [currentChallenge, setCurrentChallengeState] = useState<GymChallenge | null>(null);
  const [challengeList, setChallengeList] = useState<GymChallenge[]>([]);
  const [activeView, setActiveView] = useState<AppView>("roster");
  const [challengeDraft, setChallengeDraft] = useState<ChallengeDraft>(createEmptyChallengeDraft());
  const [selectedChallengeId, setSelectedChallengeId] = useState("");
  const [isSavingChallenge, setIsSavingChallenge] = useState(false);
  const [isSettingCurrentChallenge, setIsSettingCurrentChallenge] = useState(false);
  const [selectedRound, setSelectedRound] = useState(4);
  const [leaderPairInputs, setLeaderPairInputs] = useState<LeaderPairInputs>(buildLeaderPairInputs());
  const [leaderRebuffInputs, setLeaderRebuffInputs] = useState<LeaderRebuffInputs>(buildLeaderRebuffInputs());
  const [setupPairInputs, setSetupPairInputs] = useState<SetupPairInputs>(buildSetupPairInputs());
  const [selectedLeaderSlot, setSelectedLeaderSlot] = useState(1);
  const [setupDutyMemberIds, setSetupDutyMemberIds] = useState<string[]>([]);
  const [manualAssignments, setManualAssignments] = useState<ManualLeaderAssignments>({});
  const [leaderNotes, setLeaderNotes] = useState<LeaderNotesMap>(buildEmptyLeaderNotes());

  useEffect(() => {
    let disposed = false;

    async function bootstrap() {
      try {
        const session = await getSession();
        if (disposed) return;

        if (!session) {
          setStatus("Sign in to access the gym roster planner.");
          setIsBooting(false);
          return;
        }

        await loadAppData({ showBootScreen: true });
      } catch (loadError) {
        if (disposed) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to initialize the app.");
        setIsBooting(false);
      }
    }

    const unsubscribe = onAuthStateChange((_event, session) => {
      if (disposed) return;

      if (!session) {
        setProfile(null);
        setCatalog(null);
        setMembers([]);
        setCurrentChallengeState(null);
        setChallengeList([]);
        setChallengeDraft(createEmptyChallengeDraft());
        setSelectedChallengeId("");
        setActiveView("roster");
        setSelectedRound(4);
        setSelectedLeaderSlot(1);
        setManualAssignments({});
        setLeaderNotes(buildEmptyLeaderNotes());
        setLeaderPairInputs(buildLeaderPairInputs());
        setLeaderRebuffInputs(buildLeaderRebuffInputs());
        setSetupPairInputs(buildSetupPairInputs());
        setSetupDutyMemberIds([]);
        setStatus("Sign in to access the gym roster planner.");
        setError("");
        setIsBooting(false);
        return;
      }
    });

    void bootstrap();

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  async function loadAppData(options?: { preferredChallengeId?: string; showBootScreen?: boolean }) {
    if (options?.showBootScreen) {
      setIsBooting(true);
    }
    setError("");

    try {
      const currentProfile = await fetchCurrentProfile();
      if (!currentProfile) {
        setProfile(null);
        setCatalog(null);
        setMembers([]);
        setCurrentChallengeState(null);
        setChallengeList([]);
        setChallengeDraft(createEmptyChallengeDraft());
        setSelectedChallengeId("");
        setSelectedRound(4);
        setSelectedLeaderSlot(1);
        setManualAssignments({});
        setLeaderNotes(buildEmptyLeaderNotes());
        setLeaderPairInputs(buildLeaderPairInputs());
        setLeaderRebuffInputs(buildLeaderRebuffInputs());
        setSetupPairInputs(buildSetupPairInputs());
        setSetupDutyMemberIds([]);
        setStatus("Sign in to access the gym roster planner.");
        return;
      }

      const [currentCatalog, currentMembers, nextCurrentChallenge, nextChallengeList] = await Promise.all([
        fetchCatalog(),
        fetchImportedMembers(),
        fetchCurrentChallenge(),
        currentProfile.appRole === "admin" ? fetchChallengeList() : Promise.resolve([])
      ]);

      setProfile(currentProfile);
      setCatalog(currentCatalog);
      setMembers(currentMembers);
      setCurrentChallengeState(nextCurrentChallenge);
      setChallengeList(nextChallengeList);
      setSelectedLeaderSlot(nextCurrentChallenge?.leaders[0]?.slotNumber ?? 1);
      setSetupDutyMemberIds(nextCurrentChallenge?.setupDutyMemberIds ?? []);
      setManualAssignments(nextCurrentChallenge?.manualAssignments ?? {});

      if (currentProfile.appRole === "admin") {
        const selectedChallenge =
          nextChallengeList.find(
            (challenge) => challenge.id === (options?.preferredChallengeId ?? selectedChallengeId)
          ) ??
          nextChallengeList[0] ??
          null;

        if (selectedChallenge) {
          setSelectedChallengeId(selectedChallenge.id);
          setChallengeDraft(challengeToDraft(selectedChallenge));
          setLeaderPairInputs(buildLeaderPairInputs());
          setLeaderRebuffInputs(buildLeaderRebuffInputs());
          setSetupPairInputs(buildSetupPairInputs());
        } else {
          setSelectedChallengeId("");
          setChallengeDraft(createEmptyChallengeDraft());
          setLeaderPairInputs(buildLeaderPairInputs());
          setLeaderRebuffInputs(buildLeaderRebuffInputs());
          setSetupPairInputs(buildSetupPairInputs());
        }
      } else {
        setSelectedChallengeId("");
        setChallengeDraft(createEmptyChallengeDraft());
        setActiveView("roster");
        setManualAssignments({});
        setLeaderNotes(buildEmptyLeaderNotes());
        setLeaderPairInputs(buildLeaderPairInputs());
        setLeaderRebuffInputs(buildLeaderRebuffInputs());
        setSetupPairInputs(buildSetupPairInputs());
      }

      const rosterStatus = currentMembers.length ? `Loaded ${currentMembers.length} saved rosters` : "No saved rosters yet";
      const challengeStatus = nextCurrentChallenge ? `Current challenge: ${nextCurrentChallenge.name}` : "No current challenge selected";
      setStatus(`${rosterStatus} | ${challengeStatus}`);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load app data.");
    } finally {
      setIsBooting(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoggingIn(true);
    setError("");

    try {
      await signIn(loginEmail.trim(), loginPassword);
      await loadAppData({ showBootScreen: true });
      setLoginPassword("");
      setStatus("Signed in.");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleLogout() {
    try {
      await signOut();
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Sign out failed.");
    }
  }

  function handleFileImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !catalog) return;

    const trimmedName = memberName.trim();
    if (!trimmedName) {
      setError("Enter or select a roster member before importing a roster.");
      event.target.value = "";
      return;
    }

    file
      .text()
      .then(async (text) => {
        const payload = JSON.parse(text) as Record<string, string>;
        const result = parseSyncPairsTrackerExport(trimmedName, payload, catalog);
        await importMemberRoster(result.member, payload);
        await loadAppData();
        setStatus(
          `Imported ${result.member.displayName}: ${result.member.pairs.length} matched, ${result.member.unmatchedKeys.length} unmatched`
        );
        setMemberName("");
        setError("");
        event.target.value = "";
      })
      .catch((importError: unknown) => {
        setError(importError instanceof Error ? importError.message : "Could not parse or import this roster.");
        event.target.value = "";
      });
  }

  async function handleDeleteMember(memberId: string) {
    try {
      await deleteRosterMember(memberId);
      await loadAppData();
      setStatus("Removed roster member.");
      setError("");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to remove roster member.");
    }
  }

  function handleSelectChallenge(challengeId: string) {
    setSelectedChallengeId(challengeId);

    const selectedChallenge = challengeList.find((challenge) => challenge.id === challengeId);
    setChallengeDraft(selectedChallenge ? challengeToDraft(selectedChallenge) : createEmptyChallengeDraft());
    setLeaderPairInputs(buildLeaderPairInputs());
    setLeaderRebuffInputs(buildLeaderRebuffInputs());
    setSetupPairInputs(buildSetupPairInputs());
    setError("");
  }

  function handleChallengeFieldChange(field: "name" | "notes", value: string) {
    setChallengeDraft((current) => ({
      ...current,
      [field]: value
    }));
  }

  function handleLeaderChange(
    slotNumber: number,
    field: "leaderName" | "bossType" | "weaknessType" | "battle1Effect" | "battle2Effect" | "battle3Effect",
    value: string
  ) {
    setChallengeDraft((current) => ({
      ...current,
      leaders: current.leaders.map((leader) =>
        leader.slotNumber === slotNumber
          ? {
              ...leader,
              [field]: value
            }
          : leader
      )
    }));
  }

  function handleModifierChange(field: keyof GymChallengeModifiers, value: string) {
    setChallengeDraft((current) => ({
      ...current,
      modifiers: {
        ...current.modifiers,
        [field]: value
      }
    }));
  }

  function handleCreateNewChallenge() {
    setSelectedChallengeId("");
    setChallengeDraft(createEmptyChallengeDraft());
    setLeaderPairInputs(buildLeaderPairInputs());
    setLeaderRebuffInputs(buildLeaderRebuffInputs());
    setSetupPairInputs(buildSetupPairInputs());
    setError("");
  }

  function handleLeaderPairInputChange(slotNumber: number, value: string) {
    setLeaderPairInputs((current) => ({
      ...current,
      [slotNumber]: value
    }));
  }

  function handleLeaderRebuffInputChange(slotNumber: number, value: string) {
    setLeaderRebuffInputs((current) => ({
      ...current,
      [slotNumber]: value
    }));
  }

  function handleSetupPairInputChange(bucket: SetupPairBucket, value: string) {
    setSetupPairInputs((current) => ({
      ...current,
      [bucket]: value
    }));
  }

  function handleManualAssignmentChange(slotNumber: number, role: "primary" | "secondary", memberId: string) {
    if (!currentChallenge) return;

    const currentAssignment = manualAssignments[slotNumber] ?? {
      primaryMemberId: "",
      secondaryMemberId: ""
    };
    const nextAssignment = {
      ...currentAssignment,
      [role === "primary" ? "primaryMemberId" : "secondaryMemberId"]: memberId
    };
    const nextManualAssignments = {
      ...manualAssignments,
      [slotNumber]: nextAssignment
    };

    if (!nextAssignment.primaryMemberId && !nextAssignment.secondaryMemberId) {
      delete nextManualAssignments[slotNumber];
    }

    setManualAssignments(nextManualAssignments);
    setCurrentChallengeState((current) =>
      current
        ? {
            ...current,
            manualAssignments: nextManualAssignments
          }
        : current
    );

    void saveChallengeManualAssignment(currentChallenge.id, slotNumber, nextAssignment)
      .then(() => {
        setStatus("Saved manual assignment.");
        setError("");
      })
      .catch((saveError: unknown) => {
        setManualAssignments(currentChallenge.manualAssignments);
        setCurrentChallengeState((current) =>
          current
            ? {
                ...current,
                manualAssignments: currentChallenge.manualAssignments
              }
            : current
        );
        setError(saveError instanceof Error ? saveError.message : "Failed to save manual assignment.");
      });
  }

  function handleLeaderNotesChange(slotNumber: number, value: string) {
    setLeaderNotes((current) => ({
      ...current,
      [slotNumber]: value
    }));
  }

  function handleToggleSetupDuty(memberId: string) {
    if (!currentChallenge) return;

    const nextMemberIds = setupDutyMemberIds.includes(memberId)
      ? setupDutyMemberIds.filter((value) => value !== memberId)
      : [...setupDutyMemberIds, memberId].sort((a, b) => a.localeCompare(b));

    setSetupDutyMemberIds(nextMemberIds);
    setCurrentChallengeState((current) =>
      current
        ? {
            ...current,
            setupDutyMemberIds: nextMemberIds
          }
        : current
    );

    void saveChallengeSetupDutyMembers(currentChallenge.id, nextMemberIds)
      .then(() => {
        setStatus("Saved setup-duty members.");
        setError("");
      })
      .catch((saveError: unknown) => {
        setSetupDutyMemberIds(currentChallenge.setupDutyMemberIds);
        setCurrentChallengeState((current) =>
          current
            ? {
                ...current,
                setupDutyMemberIds: currentChallenge.setupDutyMemberIds
              }
            : current
        );
        setError(saveError instanceof Error ? saveError.message : "Failed to save setup-duty members.");
      });
  }

  function findCatalogPair(inputValue: string) {
    if (!catalog) return null;

    return (
      Array.from(catalog.byId.values()).find(
        (candidate) =>
          candidate.label.toLowerCase() === inputValue.toLowerCase() ||
          candidate.pairId.toLowerCase() === inputValue.toLowerCase()
      ) ?? null
    );
  }

  function handleAddImportantPair(slotNumber: number) {
    const inputValue = leaderPairInputs[slotNumber]?.trim() ?? "";
    if (!inputValue || !catalog) return;

    const pair = findCatalogPair(inputValue);

    if (!pair) {
      setError(`Could not find a sync pair matching "${inputValue}".`);
      return;
    }

    setChallengeDraft((current) => ({
      ...current,
      leaders: current.leaders.map((leader) =>
        leader.slotNumber === slotNumber
          ? {
              ...leader,
              importantPairs: leader.importantPairs.some((importantPair) => importantPair.pairId === pair.pairId)
                ? leader.importantPairs
                : [...leader.importantPairs, pair].sort((a, b) => a.label.localeCompare(b.label))
            }
          : leader
      )
    }));

    setLeaderPairInputs((current) => ({
      ...current,
      [slotNumber]: ""
    }));
    setError("");
  }

  function handleAddRebuffPair(slotNumber: number) {
    const inputValue = leaderRebuffInputs[slotNumber]?.trim() ?? "";
    if (!inputValue || !catalog) return;

    const pair = findCatalogPair(inputValue);

    if (!pair) {
      setError(`Could not find a sync pair matching "${inputValue}".`);
      return;
    }

    setChallengeDraft((current) => ({
      ...current,
      leaders: current.leaders.map((leader) =>
        leader.slotNumber === slotNumber
          ? {
              ...leader,
              rebuffPairs: leader.rebuffPairs.some((rebuffPair) => rebuffPair.pairId === pair.pairId)
                ? leader.rebuffPairs
                : [...leader.rebuffPairs, pair].sort((a, b) => a.label.localeCompare(b.label))
            }
          : leader
      )
    }));

    setLeaderRebuffInputs((current) => ({
      ...current,
      [slotNumber]: ""
    }));
    setError("");
  }

  function handleRemoveRebuffPair(slotNumber: number, pairId: string) {
    setChallengeDraft((current) => ({
      ...current,
      leaders: current.leaders.map((leader) =>
        leader.slotNumber === slotNumber
          ? {
              ...leader,
              rebuffPairs: leader.rebuffPairs.filter((pair) => pair.pairId !== pairId)
            }
          : leader
      )
    }));
  }

  function handleAddSetupPair(bucket: SetupPairBucket) {
    const inputValue = setupPairInputs[bucket]?.trim() ?? "";
    if (!inputValue || !catalog) return;

    const pair = findCatalogPair(inputValue);

    if (!pair) {
      setError(`Could not find a sync pair matching "${inputValue}".`);
      return;
    }

    setChallengeDraft((current) => ({
      ...current,
      setupPairs: {
        ...current.setupPairs,
        [bucket]: current.setupPairs[bucket].some((setupPair) => setupPair.pairId === pair.pairId)
          ? current.setupPairs[bucket]
          : [...current.setupPairs[bucket], pair].sort((a, b) => a.label.localeCompare(b.label))
      }
    }));

    setSetupPairInputs((current) => ({
      ...current,
      [bucket]: ""
    }));
    setError("");
  }

  function handleRemoveSetupPair(bucket: SetupPairBucket, pairId: string) {
    setChallengeDraft((current) => ({
      ...current,
      setupPairs: {
        ...current.setupPairs,
        [bucket]: current.setupPairs[bucket].filter((pair) => pair.pairId !== pairId)
      }
    }));
  }

  function handleRemoveImportantPair(slotNumber: number, pairId: string) {
    setChallengeDraft((current) => ({
      ...current,
      leaders: current.leaders.map((leader) =>
        leader.slotNumber === slotNumber
          ? {
              ...leader,
              importantPairs: leader.importantPairs.filter((pair) => pair.pairId !== pairId)
            }
          : leader
      )
    }));
  }

  async function handleSaveChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingChallenge(true);
    setError("");

    try {
      const challengeId = await saveGymChallenge({
        id: challengeDraft.id,
        name: challengeDraft.name.trim(),
        notes: challengeDraft.notes.trim(),
        leaders: challengeDraft.leaders.map((leader) => ({
          ...leader,
          leaderName: leader.leaderName.trim(),
          bossType: leader.bossType.trim(),
          weaknessType: leader.weaknessType.trim(),
          battle1Effect: leader.battle1Effect.trim(),
          battle2Effect: leader.battle2Effect.trim(),
          battle3Effect: leader.battle3Effect.trim()
        })),
        modifiers: {
          modifier1: challengeDraft.modifiers.modifier1.trim(),
          modifier2: challengeDraft.modifiers.modifier2.trim(),
          modifier3: challengeDraft.modifiers.modifier3.trim()
        },
        roundStats: challengeDraft.roundStats,
        setupPairs: challengeDraft.setupPairs
      });

      await loadAppData({ preferredChallengeId: challengeId });
      setSelectedChallengeId(challengeId);
      setStatus(challengeDraft.id ? "Challenge updated." : "Challenge created.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save challenge.");
    } finally {
      setIsSavingChallenge(false);
    }
  }

  async function handleSetCurrentChallenge(challengeId: string) {
    setIsSettingCurrentChallenge(true);
    setError("");

    try {
      await setCurrentChallenge(challengeId);
      await loadAppData({ preferredChallengeId: challengeId });
      setStatus("Current challenge updated.");
    } catch (setCurrentError) {
      setError(setCurrentError instanceof Error ? setCurrentError.message : "Failed to set current challenge.");
    } finally {
      setIsSettingCurrentChallenge(false);
    }
  }

  const leaderRecommendations = useMemo(
    () => buildLeaderRecommendations(currentChallenge, members),
    [currentChallenge, members]
  );
  const assignmentPlan = useMemo(
    () =>
      buildGreedyLeaderAssignments(currentChallenge, leaderRecommendations, members, {
        setupDutyMemberIds: currentChallenge?.setupDutyMemberIds ?? setupDutyMemberIds,
        manualAssignments
      }),
    [currentChallenge, leaderRecommendations, members, setupDutyMemberIds, manualAssignments]
  );

  async function handleExportWorkbook() {
    if (!currentChallenge) return;

    exportGymChallengeWorkbook({
      challenge: currentChallenge,
      members,
      selectedRound,
      recommendations: leaderRecommendations,
      assignmentPlan,
      manualAssignments: buildWorkbookManualAssignments(members, manualAssignments)
    });
  }

  if (isBooting) {
    return (
      <div className="shell shell-centered">
        <section className="panel login-panel">
          <h1>GVGPlanner</h1>
          <p className="lede">{status}</p>
        </section>
      </div>
    );
  }

  if (!profile || !catalog) {
    return (
      <div className="shell shell-centered">
        <section className="panel login-panel">
          <p className="eyebrow">Pokemon Masters EX | Gym Battle Planner</p>
          <h1>Sign In</h1>
          <p className="lede">
            This planner is private to your gym. Use the shared member or admin credentials to continue.
          </p>

          <form className="login-form" onSubmit={handleLogin}>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                placeholder="member@gvgplanner.local"
                autoComplete="username"
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="Password"
                autoComplete="current-password"
              />
            </label>

            <button className="primary-button" type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="dev-creds">
            <p className="helper">Local dev credentials</p>
            <code>member@gvgplanner.local / GauntletMember123!</code>
            <code>admin@gvgplanner.local / GauntletAdmin123!</code>
          </div>

          {error ? <p className="warning">{error}</p> : null}
        </section>
      </div>
    );
  }

  const isAdmin = profile.appRole === "admin";

  return (
    <div className="shell">
      <main className="layout">
        <section className="panel compact-panel">
          <div className="panel-header compact-header">
            <div>
              <p className="section-kicker">Gym Roster Planner</p>
              <h1>GVGPlanner</h1>
            </div>
            <span className={`status-pill ${error ? "error" : "ready"}`}>{error || status}</span>
          </div>

          {isAdmin ? (
            <div className="tab-row">
              <button
                className={`tab-button ${activeView === "roster" ? "active" : ""}`}
                onClick={() => setActiveView("roster")}
                type="button"
              >
                Roster
              </button>
              <button
                className={`tab-button ${activeView === "gym-challenge" ? "active" : ""}`}
                onClick={() => setActiveView("gym-challenge")}
                type="button"
              >
                Gym Challenge
              </button>
              <button
                className={`tab-button ${activeView === "challenge-admin" ? "active" : ""}`}
                onClick={() => setActiveView("challenge-admin")}
                type="button"
              >
                Challenge Admin
              </button>
            </div>
          ) : (
            <div className="tab-row">
              <button
                className={`tab-button ${activeView === "roster" ? "active" : ""}`}
                onClick={() => setActiveView("roster")}
                type="button"
              >
                Roster
              </button>
              <button
                className={`tab-button ${activeView === "gym-challenge" ? "active" : ""}`}
                onClick={() => setActiveView("gym-challenge")}
                type="button"
              >
                Gym Challenge
              </button>
            </div>
          )}

          {activeView === "roster" ? (
            <div className="import-card">
              <label className="field">
                <span>Target roster member</span>
                <input
                  list="member-options"
                  type="text"
                  value={memberName}
                  onChange={(event) => setMemberName(event.target.value)}
                  placeholder="Example: Ryan"
                />
                <datalist id="member-options">
                  {members.map((member) => (
                    <option key={member.id} value={member.displayName} />
                  ))}
                </datalist>
              </label>

              <label className="field file-field">
                <span>SyncPairsTracker export</span>
                <input type="file" accept="application/json" onChange={handleFileImport} />
              </label>

              <button className="ghost-button compact-signout" onClick={handleLogout} type="button">
                Sign out
              </button>
            </div>
          ) : activeView === "gym-challenge" ? (
            <div className="admin-toolbar">
              <span className="helper">
                {currentChallenge ? `Planning ${currentChallenge.name}` : "Select a current challenge to begin planning."}
              </span>
              <div className="button-row">
                <button className="ghost-button" onClick={handleExportWorkbook} type="button" disabled={!currentChallenge}>
                  Export .xlsx
                </button>
                <button className="ghost-button compact-signout" onClick={handleLogout} type="button">
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="admin-toolbar">
              <button className="ghost-button" onClick={handleCreateNewChallenge} type="button">
                New challenge
              </button>
              <button className="ghost-button compact-signout" onClick={handleLogout} type="button">
                Sign out
              </button>
            </div>
          )}
        </section>

        {activeView === "roster" ? (
          <>
            <ChallengeReadOnly
              challenge={currentChallenge}
              recommendations={leaderRecommendations}
              selectedRound={selectedRound}
              onRoundChange={setSelectedRound}
            />

            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">Roster members</p>
                  <h2>Current snapshots</h2>
                </div>
              </div>

              <div className="member-list">
                {members.length ? (
                  members
                    .slice()
                    .sort((a, b) => a.displayName.localeCompare(b.displayName))
                    .map((member) => (
                      <article className="member-card" key={member.id}>
                        <div>
                          <h3>{member.displayName}</h3>
                          <p>{member.pairs.length} matched pairs</p>
                        </div>
                        {isAdmin ? (
                          <button className="ghost-button" onClick={() => handleDeleteMember(member.id)} type="button">
                            Remove
                          </button>
                        ) : null}
                      </article>
                    ))
                ) : (
                  <div className="empty-state">No members imported yet.</div>
                )}
              </div>
            </section>
          </>
        ) : activeView === "gym-challenge" ? (
          <GymChallengeWorkspace
            challenge={currentChallenge}
            members={members}
            recommendations={leaderRecommendations}
            selectedRound={selectedRound}
            onRoundChange={setSelectedRound}
            selectedLeaderSlot={selectedLeaderSlot}
            onSelectLeader={setSelectedLeaderSlot}
            assignmentPlan={assignmentPlan}
            setupDutyMemberIds={setupDutyMemberIds}
            onToggleSetupDuty={handleToggleSetupDuty}
            manualAssignments={manualAssignments}
            onManualAssignmentChange={handleManualAssignmentChange}
            leaderNotes={leaderNotes}
            onLeaderNotesChange={handleLeaderNotesChange}
          />
        ) : (
          <div className="admin-grid">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">Stored challenges</p>
                  <h2>Challenge library</h2>
                </div>
              </div>

              <div className="challenge-list">
                {challengeList.length ? (
                  challengeList.map((challenge) => (
                    <article className="challenge-list-item" key={challenge.id}>
                      <div>
                        <h3>{challenge.name}</h3>
                        <p>{challenge.isCurrent ? "Current challenge" : "Saved challenge"}</p>
                      </div>
                      <div className="button-row">
                        <button className="ghost-button" onClick={() => handleSelectChallenge(challenge.id)} type="button">
                          Edit
                        </button>
                        <button
                          className="ghost-button"
                          onClick={() => handleSetCurrentChallenge(challenge.id)}
                          disabled={challenge.isCurrent || isSettingCurrentChallenge}
                          type="button"
                        >
                          {challenge.isCurrent ? "Current" : "Set current"}
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">No challenges saved yet.</div>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">Challenge editor</p>
                  <h2>{challengeDraft.id ? "Edit challenge" : "New challenge"}</h2>
                </div>
              </div>

              <form className="challenge-form" onSubmit={handleSaveChallenge}>
                <datalist id="sync-pair-options">
                  {Array.from(catalog.byId.values()).map((pair) => (
                    <option key={pair.pairId} value={pair.label} />
                  ))}
                </datalist>

                <label className="field">
                  <span>Challenge name</span>
                  <input
                    type="text"
                    value={challengeDraft.name}
                    onChange={(event) => handleChallengeFieldChange("name", event.target.value)}
                    placeholder="Example: Week 1 Gym Rotation"
                  />
                </label>

                <label className="field">
                  <span>Notes</span>
                  <textarea
                    value={challengeDraft.notes}
                    onChange={(event) => handleChallengeFieldChange("notes", event.target.value)}
                    placeholder="Optional notes about the current rotation or strategy."
                    rows={3}
                  />
                </label>

                <section className="subpanel">
                  <p className="section-kicker">Global setup pairs</p>
                  <div className="workspace-columns">
                    <div className="field">
                      <span>Physical breaks</span>
                      <div className="pair-picker-row">
                        <input
                          list="sync-pair-options"
                          type="text"
                          value={setupPairInputs.physicalBreakPairs}
                          onChange={(event) => handleSetupPairInputChange("physicalBreakPairs", event.target.value)}
                          placeholder="Search by pair name"
                        />
                        <button className="ghost-button" onClick={() => handleAddSetupPair("physicalBreakPairs")} type="button">
                          Add
                        </button>
                      </div>
                      {challengeDraft.setupPairs.physicalBreakPairs.length ? (
                        <div className="badge-row">
                          {challengeDraft.setupPairs.physicalBreakPairs.map((pair) => (
                            <button
                              className="badge removable-badge"
                              key={`physical-${pair.pairId}`}
                              onClick={() => handleRemoveSetupPair("physicalBreakPairs", pair.pairId)}
                              type="button"
                            >
                              {pair.label} x
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="helper">No physical break pairs chosen yet.</p>
                      )}
                    </div>

                    <div className="field">
                      <span>Special breaks</span>
                      <div className="pair-picker-row">
                        <input
                          list="sync-pair-options"
                          type="text"
                          value={setupPairInputs.specialBreakPairs}
                          onChange={(event) => handleSetupPairInputChange("specialBreakPairs", event.target.value)}
                          placeholder="Search by pair name"
                        />
                        <button className="ghost-button" onClick={() => handleAddSetupPair("specialBreakPairs")} type="button">
                          Add
                        </button>
                      </div>
                      {challengeDraft.setupPairs.specialBreakPairs.length ? (
                        <div className="badge-row">
                          {challengeDraft.setupPairs.specialBreakPairs.map((pair) => (
                            <button
                              className="badge removable-badge"
                              key={`special-${pair.pairId}`}
                              onClick={() => handleRemoveSetupPair("specialBreakPairs", pair.pairId)}
                              type="button"
                            >
                              {pair.label} x
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="helper">No special break pairs chosen yet.</p>
                      )}
                    </div>

                    <div className="field">
                      <span>Debuffs / chip</span>
                      <div className="pair-picker-row">
                        <input
                          list="sync-pair-options"
                          type="text"
                          value={setupPairInputs.debuffChipPairs}
                          onChange={(event) => handleSetupPairInputChange("debuffChipPairs", event.target.value)}
                          placeholder="Search by pair name"
                        />
                        <button className="ghost-button" onClick={() => handleAddSetupPair("debuffChipPairs")} type="button">
                          Add
                        </button>
                      </div>
                      {challengeDraft.setupPairs.debuffChipPairs.length ? (
                        <div className="badge-row">
                          {challengeDraft.setupPairs.debuffChipPairs.map((pair) => (
                            <button
                              className="badge removable-badge"
                              key={`chip-${pair.pairId}`}
                              onClick={() => handleRemoveSetupPair("debuffChipPairs", pair.pairId)}
                              type="button"
                            >
                              {pair.label} x
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="helper">No debuff/chip pairs chosen yet.</p>
                      )}
                    </div>

                    <div className="field">
                      <span>Off-type</span>
                      <div className="pair-picker-row">
                        <input
                          list="sync-pair-options"
                          type="text"
                          value={setupPairInputs.offTypePairs}
                          onChange={(event) => handleSetupPairInputChange("offTypePairs", event.target.value)}
                          placeholder="Search by pair name"
                        />
                        <button className="ghost-button" onClick={() => handleAddSetupPair("offTypePairs")} type="button">
                          Add
                        </button>
                      </div>
                      {challengeDraft.setupPairs.offTypePairs.length ? (
                        <div className="badge-row">
                          {challengeDraft.setupPairs.offTypePairs.map((pair) => (
                            <button
                              className="badge removable-badge"
                              key={`off-type-${pair.pairId}`}
                              onClick={() => handleRemoveSetupPair("offTypePairs", pair.pairId)}
                              type="button"
                            >
                              {pair.label} x
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="helper">No off-type pairs chosen yet.</p>
                      )}
                    </div>
                  </div>
                </section>

                <div className="leaders-grid">
                  {challengeDraft.leaders.map((leader) => (
                    <article className="leader-editor" key={leader.slotNumber}>
                      <p className="leader-slot">Leader {leader.slotNumber}</p>
                      <label className="field">
                        <span>Name</span>
                        <input
                          type="text"
                          value={leader.leaderName}
                          onChange={(event) => handleLeaderChange(leader.slotNumber, "leaderName", event.target.value)}
                          placeholder={`Leader ${leader.slotNumber}`}
                        />
                      </label>

                      <label className="field">
                        <span>Weakness type</span>
                        <select
                          value={leader.weaknessType}
                          onChange={(event) =>
                            handleLeaderChange(leader.slotNumber, "weaknessType", event.target.value)
                          }
                        >
                          <option value="">Select type</option>
                          {weaknessTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="field">
                        <span>Boss type</span>
                        <select
                          value={leader.bossType}
                          onChange={(event) => handleLeaderChange(leader.slotNumber, "bossType", event.target.value)}
                        >
                          <option value="">Select type</option>
                          {weaknessTypes.map((type) => (
                            <option key={`${leader.slotNumber}-boss-${type}`} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="field">
                        <span>Battle 1 effect</span>
                        <input
                          type="text"
                          value={leader.battle1Effect}
                          onChange={(event) => handleLeaderChange(leader.slotNumber, "battle1Effect", event.target.value)}
                          placeholder="Acuity"
                        />
                      </label>

                      <label className="field">
                        <span>Battle 2 effect</span>
                        <input
                          type="text"
                          value={leader.battle2Effect}
                          onChange={(event) => handleLeaderChange(leader.slotNumber, "battle2Effect", event.target.value)}
                          placeholder="Bedazzle 1"
                        />
                      </label>

                      <label className="field">
                        <span>Battle 3 effect</span>
                        <input
                          type="text"
                          value={leader.battle3Effect}
                          onChange={(event) => handleLeaderChange(leader.slotNumber, "battle3Effect", event.target.value)}
                          placeholder="Discombobulate 9"
                        />
                      </label>

                      <div className="field">
                        <span>Important sync pairs</span>
                        <div className="pair-picker-row">
                          <input
                            list="sync-pair-options"
                            type="text"
                            value={leaderPairInputs[leader.slotNumber] ?? ""}
                            onChange={(event) =>
                              handleLeaderPairInputChange(leader.slotNumber, event.target.value)
                            }
                            placeholder="Search by pair name"
                          />
                          <button
                            className="ghost-button"
                            onClick={() => handleAddImportantPair(leader.slotNumber)}
                            type="button"
                          >
                            Add
                          </button>
                        </div>

                        {leader.importantPairs.length ? (
                          <div className="badge-row">
                            {leader.importantPairs.map((pair) => (
                              <button
                                className="badge removable-badge"
                                key={pair.pairId}
                                onClick={() => handleRemoveImportantPair(leader.slotNumber, pair.pairId)}
                                type="button"
                              >
                                {pair.label} x
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="helper">No important pairs chosen yet.</p>
                        )}
                      </div>

                      <div className="field">
                        <span>Rebuff setup pairs</span>
                        <div className="pair-picker-row">
                          <input
                            list="sync-pair-options"
                            type="text"
                            value={leaderRebuffInputs[leader.slotNumber] ?? ""}
                            onChange={(event) =>
                              handleLeaderRebuffInputChange(leader.slotNumber, event.target.value)
                            }
                            placeholder="Search by pair name"
                          />
                          <button
                            className="ghost-button"
                            onClick={() => handleAddRebuffPair(leader.slotNumber)}
                            type="button"
                          >
                            Add
                          </button>
                        </div>

                        {leader.rebuffPairs.length ? (
                          <div className="badge-row">
                            {leader.rebuffPairs.map((pair) => (
                              <button
                                className="badge removable-badge"
                                key={`rebuff-${leader.slotNumber}-${pair.pairId}`}
                                onClick={() => handleRemoveRebuffPair(leader.slotNumber, pair.pairId)}
                                type="button"
                              >
                                {pair.label} x
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="helper">No rebuff setup pairs chosen yet.</p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>

                <div className="modifier-grid">
                  <label className="field">
                    <span>Modifier 1</span>
                    <input
                      type="text"
                      value={challengeDraft.modifiers.modifier1}
                      onChange={(event) => handleModifierChange("modifier1", event.target.value)}
                      placeholder="Only super effective"
                    />
                  </label>
                  <label className="field">
                    <span>Modifier 2</span>
                    <input
                      type="text"
                      value={challengeDraft.modifiers.modifier2}
                      onChange={(event) => handleModifierChange("modifier2", event.target.value)}
                      placeholder="Apply status"
                    />
                  </label>
                  <label className="field">
                    <span>Modifier 3</span>
                    <input
                      type="text"
                      value={challengeDraft.modifiers.modifier3}
                      onChange={(event) => handleModifierChange("modifier3", event.target.value)}
                      placeholder="Only special"
                    />
                  </label>
                </div>

                <button className="primary-button" disabled={isSavingChallenge} type="submit">
                  {isSavingChallenge ? "Saving..." : challengeDraft.id ? "Save challenge" : "Create challenge"}
                </button>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
