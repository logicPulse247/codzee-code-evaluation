import { practiceService } from './practice.service.js';

export const recordPractice = async (req, res, next) => {
  try {
    const { kitId, scores } = req.body;
    const userId = req.user._id || req.user.id;
    const record = await practiceService.savePracticeScores(userId, kitId, scores);
    res.status(201).json({ status: 'ok', record });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const getWeakSpots = async (req, res, next) => {
  try {
    const { kitId } = req.params;
    const userId = req.user._id || req.user.id;
    const report = await practiceService.getWeakSpotsReport(userId, kitId);
    res.status(200).json({ status: 'ok', report });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};
