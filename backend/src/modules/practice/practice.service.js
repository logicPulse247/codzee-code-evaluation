import { PracticeRecord } from '../../models/practice.model.js';
import { InterviewKit } from '../../models/kit.model.js';

export const practiceService = {
  async savePracticeScores(userId, kitId, scores) {
    // scores: Array of { flashcard_id, confidence }
    const record = await PracticeRecord.create({
      userId,
      kitId,
      records: scores.map(s => ({
        flashcard_id: s.flashcard_id,
        confidence: Number(s.confidence),
        reviewed_at: new Date()
      }))
    });

    return record;
  },

  async getWeakSpotsReport(userId, kitId) {
    const kit = await InterviewKit.findOne({ _id: kitId, userId });
    if (!kit) {
      const err = new Error('Kit not found');
      err.status = 404;
      throw err;
    }

    const records = await PracticeRecord.find({ userId, kitId }).sort({ createdAt: -1 });

    // Aggregate latest confidence per flashcard
    const latestConfidenceMap = new Map();
    records.forEach(session => {
      session.records.forEach(item => {
        if (!latestConfidenceMap.has(item.flashcard_id)) {
          latestConfidenceMap.set(item.flashcard_id, item.confidence);
        }
      });
    });

    // Map flashcards with confidence
    const cardStats = kit.flashcards.map(card => {
      const confidence = latestConfidenceMap.get(card.id) || 0; // 0 = unpracticed
      return {
        ...card.toObject(),
        confidence
      };
    });

    const lowConfidenceCards = cardStats.filter(c => c.confidence === 1 || c.confidence === 0);
    const mediumConfidenceCards = cardStats.filter(c => c.confidence === 2);
    const highConfidenceCards = cardStats.filter(c => c.confidence === 3);

    // Identify weak requirements (requirements linked to low confidence cards)
    const weakRequirementIds = new Set();
    lowConfidenceCards.forEach(c => {
      (c.requirement_ids || []).forEach(rid => weakRequirementIds.add(rid));
    });

    const weakRequirements = kit.role.requirements.filter(r => weakRequirementIds.has(r.id));

    // Category breakdown
    const categoryWeakness = {
      technical: 0,
      behavioural: 0,
      'system-design': 0,
      'company-fit': 0
    };

    kit.questions.forEach(q => {
      const coversWeakReq = q.requirement_ids.some(rid => weakRequirementIds.has(rid));
      if (coversWeakReq && categoryWeakness[q.category] !== undefined) {
        categoryWeakness[q.category]++;
      }
    });

    return {
      total_flashcards: kit.flashcards.length,
      practiced_cards_count: latestConfidenceMap.size,
      low_confidence_cards: lowConfidenceCards,
      weak_requirements: weakRequirements,
      category_weakness: categoryWeakness,
      recommended_focus: weakRequirements.length > 0
        ? `Focus study efforts on mandatory requirements: ${weakRequirements.slice(0, 3).map(r => r.text).join(', ')}`
        : 'Solid performance! Review medium confidence cards to reinforce retention.'
    };
  }
};
