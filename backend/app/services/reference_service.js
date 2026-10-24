import fs from 'fs';
import path from 'path';
import config from '../core/config.js';
import {
  BrandGuidelineSchema,
  ApprovedTermSchema,
  ApprovedFactSchema
} from '../schemas/review.js';
import { ValidationError } from '../utils/errors.js';

let cachedSampleData = null;

function loadJsonFile(filename) {
  const filePath = path.join(config.DATA_DIR, filename);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to load reference sample file ${filename}: ${err.message}`);
  }
}

export function getSampleReferences() {
  if (!cachedSampleData) {
    cachedSampleData = {
      brand_guidelines: loadJsonFile('brand_guidelines.json'),
      approved_terms: loadJsonFile('approved_terms.json'),
      approved_facts: loadJsonFile('approved_facts.json')
    };
  }
  return cachedSampleData;
}

/**
 * Resolves references according to the policy:
 * - If undefined in request: fallback to bundled sample data.
 * - If provided (including empty array []): use provided data strictly without mixing.
 * - Validates IDs for uniqueness within their collection.
 */
export function resolveReferences(requestPayload) {
  const samples = getSampleReferences();

  const brandGuidelines = requestPayload.brand_guidelines !== undefined
    ? requestPayload.brand_guidelines
    : samples.brand_guidelines;

  const approvedTerms = requestPayload.approved_terms !== undefined
    ? requestPayload.approved_terms
    : samples.approved_terms;

  const approvedFacts = requestPayload.approved_facts !== undefined
    ? requestPayload.approved_facts
    : samples.approved_facts;

  // Validate reference items using Zod schemas
  try {
    brandGuidelines.forEach((item) => BrandGuidelineSchema.parse(item));
    approvedTerms.forEach((item) => ApprovedTermSchema.parse(item));
    approvedFacts.forEach((item) => ApprovedFactSchema.parse(item));
  } catch (err) {
    throw new ValidationError(`Invalid reference data: ${err.message}`, err.issues || err.errors || null);
  }

  // Check duplicate IDs within each list
  validateUniqueIds(brandGuidelines, 'brand_guidelines');
  validateUniqueIds(approvedTerms, 'approved_terms');
  validateUniqueIds(approvedFacts, 'approved_facts');

  return {
    brand_guidelines: brandGuidelines,
    approved_terms: approvedTerms,
    approved_facts: approvedFacts
  };
}

function validateUniqueIds(items, collectionName) {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.id)) {
      throw new ValidationError(`Duplicate ID '${item.id}' detected in ${collectionName}`);
    }
    seen.add(item.id);
  }
}

export default {
  getSampleReferences,
  resolveReferences
};
