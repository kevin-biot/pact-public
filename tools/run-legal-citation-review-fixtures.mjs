#!/usr/bin/env node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const fixtureIndexPath = process.argv[2] || path.join(root, 'fixtures', 'legal-citation-review', 'index.json');

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function bundleIdFor(bundlePath) {
  const content = fs.readFileSync(bundlePath, 'utf8');
  const digest = createHash('sha256').update(content, 'utf8').digest('hex');
  return `sha256:${digest}`;
}

function parseDate(s) {
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

function evaluateCase(casePath, expectedBundleId) {
  const payload = loadJson(casePath);
  const d = payload.decision || {};
  const effectiveBundleId = payload.bundleId === '__AUTO_BUNDLE_ID__' ? expectedBundleId : payload.bundleId;

  if (effectiveBundleId !== expectedBundleId) {
    return {
      status: 'fail',
      code: 'PSC_BUNDLE_COMMIT_MISMATCH',
      details: `expected ${expectedBundleId}, got ${effectiveBundleId || '<missing>'}`
    };
  }

  if (d.type !== 'LegalCitationReviewIntent') {
    return { status: 'fail', code: 'CIC_CANONICAL_VALUE_INVALID', details: 'type must be LegalCitationReviewIntent' };
  }

  if (d.intent_class !== 'legal.citation.review.align.v1') {
    return { status: 'fail', code: 'ESCALATE_OUT_OF_SCOPE_INTENT', details: 'intent is outside legal-citation-review bounded domain' };
  }

  if (typeof d.jurisdiction !== 'string' || d.jurisdiction.trim() === '') {
    return { status: 'fail', code: 'CIC_REQUIRED_FIELD_MISSING', details: 'jurisdiction is required' };
  }

  const reviewTs = parseDate(d.review_date);
  if (reviewTs === null) {
    return { status: 'fail', code: 'CIC_REQUIRED_FIELD_MISSING', details: 'review_date is required and must be ISO date' };
  }

  const sourceRefs = Array.isArray(d.source_refs) ? d.source_refs : [];
  const claims = Array.isArray(d.draft_claims) ? d.draft_claims : [];
  const sourceById = new Map(sourceRefs.map((s) => [s.source_id, s]));

  for (const claim of claims) {
    const cited = Array.isArray(claim.cited_source_ids) ? claim.cited_source_ids : [];
    if (cited.length === 0) {
      return { status: 'fail', code: 'DENY_MISSING_CITATION', details: `claim ${claim.claim_id || '<unknown>'} has no citations` };
    }

    for (const sid of cited) {
      const src = sourceById.get(sid);
      if (!src) {
        return { status: 'fail', code: 'DENY_MISSING_CITATION', details: `claim ${claim.claim_id} references unknown source ${sid}` };
      }

      if ((claim.jurisdiction || d.jurisdiction) !== src.jurisdiction || d.jurisdiction !== src.jurisdiction) {
        return {
          status: 'fail',
          code: 'DENY_JURISDICTION_MISMATCH',
          details: `claim ${claim.claim_id} jurisdiction does not match source ${sid}`
        };
      }

      const fromTs = parseDate(src.effective_from);
      const untilTs = parseDate(src.effective_until);
      if (fromTs === null || untilTs === null || reviewTs < fromTs || reviewTs > untilTs) {
        return {
          status: 'fail',
          code: 'DENY_EFFECTIVE_DATE_MISMATCH',
          details: `claim ${claim.claim_id} cites source ${sid} outside effective date window`
        };
      }

      const supports = Array.isArray(src.supports_claim_ids) ? src.supports_claim_ids : [];
      if (!supports.includes(claim.claim_id)) {
        return {
          status: 'fail',
          code: 'DENY_UNSUPPORTED_CLAIM',
          details: `claim ${claim.claim_id} is not supported by source ${sid}`
        };
      }
    }
  }

  return {
    status: 'pass',
    code: 'ALLOW_REVIEW_PACK_READY',
    details: 'citation, jurisdiction, and effective-date checks passed'
  };
}

function main() {
  const fixtureIndex = loadJson(fixtureIndexPath);
  const packPath = path.join(root, fixtureIndex.pack_path || 'verticals/legal-citation-review-demo-pack');
  const expectedBundleId = bundleIdFor(path.join(packPath, 'bundle.json'));

  const cases = Array.isArray(fixtureIndex.cases) ? fixtureIndex.cases : [];
  if (cases.length === 0) {
    console.error('no fixture cases found');
    process.exit(2);
  }

  let failed = 0;
  const results = [];
  for (const c of cases) {
    const actual = evaluateCase(path.join(root, c.path), expectedBundleId);
    const expected = c.expected || { status: 'pass', code: 'ALLOW_REVIEW_PACK_READY' };
    const match = actual.status === expected.status && actual.code === expected.code;
    if (!match) failed += 1;
    results.push({ id: c.id, expected, actual, match });
  }

  console.log(JSON.stringify({
    fixture_index: path.relative(root, fixtureIndexPath),
    bundle_id: expectedBundleId,
    cases_total: results.length,
    cases_failed: failed,
    results
  }, null, 2));

  process.exit(failed === 0 ? 0 : 1);
}

main();
