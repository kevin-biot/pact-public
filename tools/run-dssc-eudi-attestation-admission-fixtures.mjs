#!/usr/bin/env node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const fixtureIndexPath = process.argv[2] || path.join(root, 'fixtures', 'dssc-eudi-attestation-admission', 'index.json');

function loadJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function bundleIdFor(bundlePath) {
  const content = fs.readFileSync(bundlePath, 'utf8');
  const digest = createHash('sha256').update(content, 'utf8').digest('hex');
  return 'sha256:' + digest;
}
function reqStr(name, value) {
  return typeof value === 'string' && value.trim() !== '';
}
function toMs(value) {
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : t;
}
function level(value) {
  const norm = String(value || '').toLowerCase();
  if (norm === 'hardware') return 3;
  if (norm === 'tee') return 2;
  if (norm === 'basic') return 1;
  return 0;
}

function evaluateCase(casePath, expectedBundleId, decisionSpace) {
  const payload = loadJson(casePath);
  const d = payload.decision || {};

  if (payload.bundleId !== expectedBundleId) {
    return { status: 'fail', code: 'PSC_BUNDLE_COMMIT_MISMATCH', details: 'expected ' + expectedBundleId + ', got ' + (payload.bundleId || '<missing>') };
  }
  if (d.type !== 'DSSCAttestationAdmissionIntent') {
    return { status: 'fail', code: 'CIC_CANONICAL_VALUE_INVALID', details: 'type must be DSSCAttestationAdmissionIntent' };
  }
  if (typeof d.intent_class !== 'string' || !decisionSpace.intent_resource_map[d.intent_class]) {
    return { status: 'fail', code: 'ESCALATE_OUT_OF_SCOPE_INTENT', details: 'intent is outside attestation bounded domain' };
  }

  const required = decisionSpace.required_fields_by_intent[d.intent_class] || [];
  for (const field of required) {
    if (!reqStr(field, d[field])) {
      return { status: 'fail', code: 'CIC_REQUIRED_FIELD_MISSING', details: field + ' is required' };
    }
  }

  const evaluationMs = toMs(d.evaluation_time || '2026-04-14T12:00:00Z');
  const validUntilMs = toMs(d.valid_until);
  if (evaluationMs === null || validUntilMs === null) {
    return { status: 'fail', code: 'CIC_CANONICAL_VALUE_INVALID', details: 'valid_until/evaluation_time must be parseable timestamps' };
  }
  if (validUntilMs < evaluationMs) {
    return { status: 'fail', code: 'DENY_CREDENTIAL_EXPIRED', details: 'credential validity window has expired' };
  }
  if (String(d.revocation_status).toLowerCase() === 'revoked') {
    return { status: 'fail', code: 'DENY_CREDENTIAL_REVOKED', details: 'credential is revoked' };
  }

  if (d.trusted_issuer !== true) {
    return { status: 'fail', code: 'DENY_TRUST_ANCHOR_UNVERIFIED', details: 'issuer trust anchor not verified' };
  }

  const min = level(d.corridor_min_attestation || 'basic');
  const actual = level(d.attestation_class);
  if (actual < min) {
    return { status: 'fail', code: 'DENY_ATTESTATION_LEVEL_INSUFFICIENT', details: 'attestation class is below corridor minimum' };
  }

  return { status: 'pass', code: 'ALLOW_IN_SCOPE', details: 'attestation admission checks passed' };
}

function main() {
  const fixtureIndex = loadJson(fixtureIndexPath);
  const packPath = path.join(root, fixtureIndex.pack_path || 'verticals/dssc-eudi-attestation-admission-demo-pack');
  const expectedBundleId = bundleIdFor(path.join(packPath, 'bundle.json'));
  const decisionSpace = loadJson(path.join(packPath, 'decision-space.json'));

  const cases = Array.isArray(fixtureIndex.cases) ? fixtureIndex.cases : [];
  if (cases.length === 0) { console.error('no fixture cases found'); process.exit(2); }

  let failed = 0;
  const results = [];
  for (const c of cases) {
    const actual = evaluateCase(path.join(root, c.path), expectedBundleId, decisionSpace);
    const expected = c.expected || { status: 'pass', code: 'ALLOW_IN_SCOPE' };
    const match = actual.status === expected.status && actual.code === expected.code;
    if (!match) failed += 1;
    results.push({ id: c.id, expected, actual, match });
  }

  console.log(JSON.stringify({ fixture_index: path.relative(root, fixtureIndexPath), bundle_id: expectedBundleId, cases_total: results.length, cases_failed: failed, results }, null, 2));
  process.exit(failed === 0 ? 0 : 1);
}

main();
