#!/usr/bin/env node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const fixtureIndexPath = process.argv[2] || path.join(root, 'fixtures', 'economic-measurement-drift', 'index.json');

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

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

function inUnitInterval(name, value) {
  if (typeof value !== 'number' || value < 0 || value > 1) {
    return { status: 'fail', code: 'CIC_CANONICAL_VALUE_INVALID', details: `${name} must be a number in [0,1]` };
  }
  return null;
}

function evaluateCase(casePath, expectedBundleId, decisionSpace) {
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

  if (d.type !== 'EconomicMeasurementIntent') {
    return {
      status: 'fail',
      code: 'CIC_CANONICAL_VALUE_INVALID',
      details: 'type must be EconomicMeasurementIntent'
    };
  }

  if (typeof d.intent_class !== 'string' || !decisionSpace.intent_resource_map[d.intent_class]) {
    return {
      status: 'fail',
      code: 'ESCALATE_OUT_OF_SCOPE_INTENT',
      details: 'intent is outside economic-measurement-drift bounded domain'
    };
  }

  const allowedResources = decisionSpace.intent_resource_map[d.intent_class] || [];
  if (!allowedResources.includes(d.resourceType)) {
    return {
      status: 'fail',
      code: 'CIC_CANONICAL_VALUE_INVALID',
      details: `resourceType ${d.resourceType || '<missing>'} invalid for ${d.intent_class}`
    };
  }

  const required = decisionSpace.required_fields_by_intent[d.intent_class] || [];
  for (const field of required) {
    const missing = reqStr(field, d[field]);
    if (missing) return missing;
  }

  for (const vector of ['v1', 'v2', 'v3']) {
    const invalid = inUnitInterval(vector, d[vector]);
    if (invalid) return invalid;
  }

  return {
    status: 'pass',
    code: 'PASS',
    details: 'CIC and PSC checks passed for economic measurement drift demo pack'
  };
}

function main() {
  const fixtureIndex = loadJson(fixtureIndexPath);
  const packPath = path.join(root, fixtureIndex.pack_path || 'verticals/economic-measurement-drift-demo-pack');
  const expectedBundleId = bundleIdFor(path.join(packPath, 'bundle.json'));
  const decisionSpace = loadJson(path.join(packPath, 'decision-space.json'));

  const cases = Array.isArray(fixtureIndex.cases) ? fixtureIndex.cases : [];
  if (cases.length === 0) {
    console.error('no fixture cases found');
    process.exit(2);
  }

  let failed = 0;
  const results = [];
  for (const c of cases) {
    const casePath = path.join(root, c.path);
    const actual = evaluateCase(casePath, expectedBundleId, decisionSpace);
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
