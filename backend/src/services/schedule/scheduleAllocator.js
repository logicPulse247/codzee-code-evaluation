/**
 * Deterministic schedule allocation function.
 * Do NOT let the LLM decide arithmetic allocation of days/minutes.
 */
export function allocateSchedule(questions = [], requirements = [], daysAvailable = 5) {
  const totalDays = Math.max(1, Math.min(60, Number(daysAvailable) || 1));
  const reqMap = new Map(requirements.map(r => [r.id, r]));

  // Priority weight: 100 for must-have requirement, + difficulty * 10
  const weightedQuestions = [...questions].map(q => {
    let weight = (q.difficulty || 2) * 10;
    if (Array.isArray(q.requirement_ids)) {
      const hasMust = q.requirement_ids.some(rid => reqMap.get(rid)?.priority === 'must');
      if (hasMust) weight += 100;
    }
    return { question: q, weight };
  });

  // Sort descending by weight (harder / higher priority earlier)
  weightedQuestions.sort((a, b) => b.weight - a.weight);

  const days = Array.from({ length: totalDays }, (_, i) => ({
    day: i + 1,
    focus: '',
    question_ids: [],
    minutes: 0
  }));

  // Round-robin distribution of questions across available days
  weightedQuestions.forEach((item, index) => {
    const dayIndex = index % totalDays;
    const q = item.question;
    days[dayIndex].question_ids.push(q.id);

    // Duration calculation: 30 mins for diff 3, 20 mins for diff 2, 15 mins for diff 1
    const minutesForQuestion = q.difficulty === 3 ? 30 : q.difficulty === 2 ? 20 : 15;
    days[dayIndex].minutes += minutesForQuestion;
  });

  // Build deterministic focus descriptions for each day
  const qMap = new Map(questions.map(q => [q.id, q]));
  days.forEach((dayObj) => {
    if (dayObj.question_ids.length > 0) {
      const dayQuestions = dayObj.question_ids.map(id => qMap.get(id)).filter(Boolean);
      const categories = [...new Set(dayQuestions.map(q => q.category))];
      dayObj.focus = `${categories.join(' & ')} practice and requirement review`;
    } else {
      dayObj.focus = 'General review, mock interview practice, and consolidation';
      dayObj.minutes = 30; // Baseline minutes for empty days in 60-day schedules
    }
  });

  return {
    days_available: totalDays,
    days
  };
}
