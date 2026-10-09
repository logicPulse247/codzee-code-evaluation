import express from 'express';
import { getKits, getKitById, createKit, generateKitStream, batchGenerateKits, regenerateSection, updateKit, deleteKit } from './kits.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getKits);
router.post('/', createKit);
router.post('/generate', generateKitStream);
router.post('/batch-generate', batchGenerateKits);
router.post('/:id/regenerate', regenerateSection);
router.get('/:id', getKitById);
router.put('/:id', updateKit);
router.delete('/:id', deleteKit);

export default router;
