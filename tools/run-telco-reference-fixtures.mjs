#!/usr/bin/env node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const fixtureIndexPath = process.argv[2] || path.join(root, 'fixtures', 'telco-reference', 'index.json');

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function isRfc3339(value) {
  if (typeof value !== 'string') {
    return false;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value);
}

function bundleIdFor(bundlePath) {
  const content = fs.readFileSync(bundlePath, 'utf8');
  const digest = createHash('sha256').update(content, 'utf8').digest('hex');
  return `sha256:${digest}`;
}

function evaluateCase(casePath, expectedBundleId) {
  const payload = loadJson(casePath);
  const decision = payload.decision || {};

  if (payload.bundleId !== expectedBundleId) {
    return {
      status: 'fail',
      code: 'PSC_BUNDLE_COMMIT_MISMATCH',
      details: `expected ${expectedBundleId}, got ${payload.bundleId || '<missing>'}`
    };
  }

  if (decision.type !== 'FaultDiagnosis') {
    return {
      status: 'fail',
      code: 'CIC_CANONICAL_VALUE_INVALID',
      details: `type must be FaultDiagnosis`
    };
  }
  if (decision.intent_class !== 'fault.diagnosis.request.v1') {
    return {
      status: 'fail',
      code: 'CIC_CANONICAL_VALUE_INVALID',
      details: `intent_class must be fault.diagnosis.request.v1`
    };
  }
  if (decision.taskType !== 'FaultDiagnosis') {
    return {
      status: 'fail',
      code: 'CIC_CANONICAL_VALUE_INVALID',
      details: `taskType must be FaultDiagnosis`
    };
  }

  const identifier = decision.targetObject?.identifier;
  if (typeof identifier !== 'string' || identifier.trim() === '') {
    return {
      status: 'fail',
      code: 'CIC_REQUIRED_FIELD_MISSING',
      details: 'targetObject.identifier is required'
    };
  }

  const faultTime = decision.taskContext?.faultOccurrenceTime;
  if (!isRfc3339(faultTime)) {
    return {
      status: 'fail',
      code: 'CIC_REQUIRED_FIELD_MISSING',
      details: 'taskContext.faultOccurrenceTime is required and must be RFC3339 UTC'
    };
  }

  return {
    status: 'pass',
    code: 'PASS',
    details: 'CIC and PSC checks passed'
  };
}

function main() {
  const fixtureIndex = loadJson(fixtureIndexPath);
  const packPath = path.join(root, fixtureIndex.pack_path || 'verticals/telco-reference-pack');
  const bundlePath = path.join(packPath, 'bundle.json');

  if (!fs.existsSync(bundlePath)) {
    console.error(`bundle not found: ${bundlePath}`);
    process.exit(2);
  }

  const expectedBundleId = bundleIdFor(bundlePath);
  const cases = Array.isArray(fixtureIndex.cases) ? fixtureIndex.cases : [];
  if (cases.length === 0) {
    console.error('no fixture cases found');
    process.exit(2);
  }

  let failed = 0;
  const results = [];

  for (const c of cases) {
    const casePath = path.join(root, c.path);
    const actual = evaluateCase(casePath, expectedBundleId);
    const expected = c.expected || { status: 'pass', code: 'PASS' };
    const match = actual.status === expected.status && actual.code === expected.code;
    if (!match) {
      failed += 1;
    }
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
