#!/usr/bin/env node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const fixtureIndexPath = process.argv[2] || path.join(root, 'fixtures', 'fhir-medications-module', 'index.json');

function loadJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function bundleIdFor(bundlePath) {
  const content = fs.readFileSync(bundlePath, 'utf8');
  const digest = createHash('sha256').update(content, 'utf8').digest('hex');
  return `sha256:${digest}`;
}
function reqStr(name, value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return { status: 'fail', code: 'CIC_REQUIRED_FIELD_MISSING', details: `${name} is required` };
  }
  return null;
}

function evaluateCase(casePath, expectedBundleId, decisionSpace) {
  const payload = loadJson(casePath);
  const d = payload.decision || {};

  if (payload.bundleId !== expectedBundleId) {
    return { status: 'fail', code: 'PSC_BUNDLE_COMMIT_MISMATCH', details: `expected ${expectedBundleId}, got ${payload.bundleId || '<missing>'}` };
  }
  if (d.type !== 'FHIRMedicationModuleIntent') {
    return { status: 'fail', code: 'CIC_CANONICAL_VALUE_INVALID', details: 'type must be FHIRMedicationModuleIntent' };
  }
  if (typeof d.intent_class !== 'string' || !decisionSpace.intent_resource_map[d.intent_class]) {
    return { status: 'fail', code: 'ESCALATE_OUT_OF_SCOPE_INTENT', details: 'intent is outside FHIR medications module bounded domain' };
  }

  const allowedResources = decisionSpace.intent_resource_map[d.intent_class] || [];
  if (!allowedResources.includes(d.resourceType)) {
    return { status: 'fail', code: 'CIC_CANONICAL_VALUE_INVALID', details: `resourceType ${d.resourceType || '<missing>'} is invalid for ${d.intent_class}` };
  }

  const required = decisionSpace.required_fields_by_intent[d.intent_class] || [];
  for (const field of required) {
    const value = d[field];
    const missing = reqStr(field, value);
    if (missing) return missing;
  }

  return { status: 'pass', code: 'PASS', details: 'CIC and PSC checks passed for FHIR medications module demo pack' };
}

function main() {
  const fixtureIndex = loadJson(fixtureIndexPath);
  const packPath = path.join(root, fixtureIndex.pack_path || 'verticals/fhir-medications-module-demo-pack');
  const bundlePath = path.join(packPath, 'bundle.json');
  const decisionSpacePath = path.join(packPath, 'decision-space.json');

  if (!fs.existsSync(bundlePath) || !fs.existsSync(decisionSpacePath)) {
    console.error('required pack files missing for fhir medications fixture run');
    process.exit(2);
  }

  const expectedBundleId = bundleIdFor(bundlePath);
  const decisionSpace = loadJson(decisionSpacePath);
  const cases = Array.isArray(fixtureIndex.cases) ? fixtureIndex.cases : [];
  if (cases.length === 0) {
    console.error('no fixture cases found');
    process.exit(2);
  }

  let failed = 0;
  const results = [];
  for (const c of cases) {
    const actual = evaluateCase(path.join(root, c.path), expectedBundleId, decisionSpace);
    const expected = c.expected || { status: 'pass', code: 'PASS' };
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
