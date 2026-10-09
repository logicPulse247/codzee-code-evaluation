import { InterviewKit } from '../../models/kit.model.js';
import { runKitPipeline } from '../../services/pipeline/kitPipeline.js';
import { checkCoverage } from '../../services/coverage/coverageChecker.js';
import { allocateSchedule } from '../../services/schedule/scheduleAllocator.js';
import { generateInitialQuestions } from '../../services/pipeline/stage4_questionGeneration.js';
import { researchCompany } from '../../services/webResearch/companyResearchService.js';
import { generateFlashcards } from '../../services/pipeline/stage8_flashcards.js';

export const kitsService = {
  async getUserKits(userId) {
    return InterviewKit.find({ userId }).sort({ updatedAt: -1 }).select('-__v');
  },

  async getKitById(kitId, userId) {
    const kit = await InterviewKit.findOne({ _id: kitId, userId });
    if (!kit) {
      const err = new Error('Interview kit not found or access unauthorized.');
      err.code = 'KIT_NOT_FOUND';
      err.status = 404;
      throw err;
    }
    return kit;
  },

  async createKit(userId, kitData) {
    const title = kitData.source?.role && kitData.source?.company
      ? `${kitData.source.company} - ${kitData.source.role}`
      : kitData.role?.title || 'Interview Preparation Kit';

    const kit = new InterviewKit({
      userId,
      title,
      ...kitData
    });

    await kit.save();
    return kit;
  },

  async updateKit(kitId, userId, updateData) {
    const kit = await InterviewKit.findOne({ _id: kitId, userId });
    if (!kit) {
      const err = new Error('Interview kit not found or access unauthorized.');
      err.code = 'KIT_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    Object.assign(kit, updateData);
    await kit.save();
    return kit;
  },

  async generateKit(userId, { jd, company_url, days }) {
    const generatedData = await runKitPipeline({
      jd,
      companyUrl: company_url,
      days
    });

    return this.createKit(userId, generatedData);
  },

  async regenerateSection(kitId, userId, { targetSection, category, questions: clientQuestions, flashcards: clientFlashcards }) {
    const kit = await this.getKitById(kitId, userId);

    if (targetSection === 'category' && category) {
      // Use client-provided questions if passed from UI state, falling back to DB questions
      const sourceQuestions = (clientQuestions && Array.isArray(clientQuestions) && clientQuestions.length > 0)
        ? clientQuestions
        : kit.questions;

      // Preserve edited/pinned items in target category, and ALL items in other categories
      const preservedQuestions = sourceQuestions.filter(q => {
        if (q.category !== category) return true;
        return q.status === 'edited' || q.status === 'pinned' || q.is_edited === true;
      });

      // Find requirements for category
      const targetReqs = kit.role?.requirements || [];
      const newGenerated = await generateInitialQuestions(targetReqs, kit.company_brief);

      // Filter new questions for the target category
      const categoryNewQuestions = newGenerated
        .filter(q => q.category === category)
        .map((q, idx) => ({ ...q, id: `q_regen_${Date.now()}_${idx}` }));

      kit.questions = [...preservedQuestions, ...categoryNewQuestions];

      // Re-run deterministic coverage & schedule
      const coverageResult = checkCoverage(kit.role.requirements, kit.questions);
      kit.coverage = {
        uncovered_requirement_ids: coverageResult.uncovered_requirement_ids,
        passes: (kit.coverage?.passes || 1) + 1
      };
      kit.schedule = allocateSchedule(kit.questions, kit.role.requirements, kit.schedule?.days_available || 5);
    } else if (targetSection === 'schedule') {
      if (clientQuestions && Array.isArray(clientQuestions) && clientQuestions.length > 0) {
        kit.questions = clientQuestions;
      }
      kit.schedule = allocateSchedule(kit.questions, kit.role.requirements, kit.schedule?.days_available || 5);
    } else if (targetSection === 'company_brief') {
      if (kit.company_brief.status !== 'pinned' && kit.company_brief.status !== 'edited') {
        const freshBrief = await researchCompany(kit.source.company_url);
        kit.company_brief = {
          summary: freshBrief.summary,
          what_they_do: freshBrief.what_they_do,
          sources: freshBrief.sources,
          status: 'generated'
        };
      }
    } else if (targetSection === 'flashcards') {
      const sourceCards = (clientFlashcards && Array.isArray(clientFlashcards) && clientFlashcards.length > 0)
        ? clientFlashcards
        : kit.flashcards;
      const preservedCards = sourceCards.filter(f => f.status === 'edited' || f.status === 'pinned' || f.is_edited === true);
      const newCards = await generateFlashcards(kit.role.requirements, kit.questions);
      kit.flashcards = [...preservedCards, ...newCards];
    }

    await kit.save();
    return kit;
  },

  async deleteKit(kitId, userId) {
    const result = await InterviewKit.deleteOne({ _id: kitId, userId });
    if (result.deletedCount === 0) {
      const err = new Error('Interview kit not found or access unauthorized.');
      err.code = 'KIT_NOT_FOUND';
      err.status = 404;
      throw err;
    }
    return { id: kitId, deleted: true };
  }
};
