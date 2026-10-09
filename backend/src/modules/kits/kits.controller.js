import { kitsService } from './kits.service.js';
import { runKitPipeline } from '../../services/pipeline/kitPipeline.js';

export const getKits = async (req, res, next) => {
  try {
    const kits = await kitsService.getUserKits(req.user._id || req.user.id);
    res.status(200).json({ status: 'ok', kits });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const getKitById = async (req, res, next) => {
  try {
    const kit = await kitsService.getKitById(req.params.id, req.user._id || req.user.id);
    res.status(200).json({ status: 'ok', kit });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const createKit = async (req, res, next) => {
  try {
    const kit = await kitsService.createKit(req.user._id || req.user.id, req.body);
    res.status(201).json({ status: 'ok', kit });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const generateKitStream = async (req, res, next) => {
  const { jd, company_url, days } = req.body;
  const userId = req.user._id || req.user.id;

  // Set SSE Headers for real-time progress updates
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendProgress = async (stage, message) => {
    res.write(`data: ${JSON.stringify({ type: 'progress', stage, message })}\n\n`);
  };

  try {
    const kitData = await runKitPipeline({
      jd,
      companyUrl: company_url,
      days,
      onProgress: sendProgress
    });

    const kit = await kitsService.createKit(userId, kitData);

    res.write(`data: ${JSON.stringify({ type: 'complete', kit })}\n\n`);
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message || 'Generation failed' })}\n\n`);
    res.end();
  }
};

export const batchGenerateKits = async (req, res, next) => {
  const { roles } = req.body;
  const userId = req.user._id || req.user.id;

  if (!Array.isArray(roles) || roles.length === 0) {
    return res.status(400).json({ status: 'error', message: 'No role items provided for batch generation.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const createdKits = [];
    for (let i = 0; i < roles.length; i++) {
      const item = roles[i];
      const itemJd = item.jd || item.jobDescription || item.description || '';
      const itemCompanyUrl = item.company_url || item.companyUrl || item.company_website || '';
      const itemDays = Number(item.days) || 7;

      if (!itemJd.trim()) continue;

      res.write(`data: ${JSON.stringify({
        type: 'progress',
        stage: 'ANALYZING_JD',
        message: `Role ${i + 1}/${roles.length}: Analyzing job description...`
      })}\n\n`);

      const kitData = await runKitPipeline({
        jd: itemJd,
        companyUrl: itemCompanyUrl,
        days: itemDays,
        onProgress: async (stage, msg) => {
          res.write(`data: ${JSON.stringify({
            type: 'progress',
            stage,
            message: `Role ${i + 1}/${roles.length}: ${msg}`
          })}\n\n`);
        }
      });

      const kit = await kitsService.createKit(userId, kitData);
      createdKits.push(kit);
    }

    res.write(`data: ${JSON.stringify({ type: 'complete', kit: createdKits[createdKits.length - 1], kits: createdKits })}\n\n`);
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message || 'Batch generation failed' })}\n\n`);
    res.end();
  }
};

export const regenerateSection = async (req, res, next) => {
  try {
    const kit = await kitsService.regenerateSection(req.params.id, req.user._id || req.user.id, req.body);
    res.status(200).json({ status: 'ok', kit });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const updateKit = async (req, res, next) => {
  try {
    const kit = await kitsService.updateKit(req.params.id, req.user._id || req.user.id, req.body);
    res.status(200).json({ status: 'ok', kit });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const deleteKit = async (req, res, next) => {
  try {
    const result = await kitsService.deleteKit(req.params.id, req.user._id || req.user.id);
    res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};
