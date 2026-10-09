/**
 * Deterministic coverage check function.
 * Do NOT ask the LLM whether requirements are covered.
 * Inspects requirements, questions, and question.requirement_ids.
 */
export function checkCoverage(requirements = [], questions = []) {
  const coveredRequirementIds = new Set();

  questions.forEach((q) => {
    if (Array.isArray(q.requirement_ids)) {
      q.requirement_ids.forEach((rid) => coveredRequirementIds.add(rid));
    }
  });

  const uncoveredMusts = [];
  const uncoveredNices = [];

  requirements.forEach((req) => {
    if (!coveredRequirementIds.has(req.id)) {
      if (req.priority === 'must') {
        uncoveredMusts.push(req.id);
      } else {
        uncoveredNices.push(req.id);
      }
    }
  });

  const allUncovered = [...uncoveredMusts, ...uncoveredNices];

  return {
    uncovered_requirement_ids: allUncovered,
    uncovered_must_ids: uncoveredMusts,
    uncovered_nice_ids: uncoveredNices,
    must_satisfied: uncoveredMusts.length === 0
  };
}
