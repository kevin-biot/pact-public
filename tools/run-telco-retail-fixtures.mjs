#!/usr/bin/env node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const fixtureIndexPath = process.argv[2] || path.join(root, 'fixtures', 'telco-retail', 'index.json');

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function bundleIdFor(bundlePath) {
  const content = fs.readFileSync(bundlePath, 'utf8');
  const digest = createHash('sha256').update(content, 'utf8').digest('hex');
  return `sha256:${digest}`;
}

function requiredString(name, value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return {
      status: 'fail',
      code: 'CIC_REQUIRED_FIELD_MISSING',
      details: `${name} is required`
    };
  }
  return null;
}

function evaluateCase(casePath, expectedBundleId, allowedIntents) {
  const payload = loadJson(casePath);
  const decision = payload.decision || {};

  if (payload.bundleId !== expectedBundleId) {
    return {
      status: 'fail',
      code: 'PSC_BUNDLE_COMMIT_MISMATCH',
      details: `expected ${expectedBundleId}, got ${payload.bundleId || '<missing>'}`
    };
  }

  if (decision.type !== 'TelcoRetailIntent') {
    return {
      status: 'fail',
      code: 'CIC_CANONICAL_VALUE_INVALID',
      details: 'type must be TelcoRetailIntent'
    };
  }

  const missingSubscriber = requiredString('subscriber_id', decision.subscriber_id);
  if (missingSubscriber) {
    return missingSubscriber;
  }

  if (typeof decision.intent_class !== 'string' || !allowedIntents.has(decision.intent_class)) {
    return {
      status: 'fail',
      code: 'CIC_CANONICAL_VALUE_INVALID',
      details: `unsupported intent_class ${decision.intent_class || '<missing>'}`
    };
  }

  if (decision.intent_class === 'telco.retail.sim_swap.v1') {
    const e1 = requiredString('current_iccid', decision.current_iccid);
    if (e1) return e1;
    const e2 = requiredString('new_iccid', decision.new_iccid);
    if (e2) return e2;
  }

  if (decision.intent_class === 'telco.retail.port_in.v1') {
    const e1 = requiredString('msisdn', decision.msisdn);
    if (e1) return e1;
    const e2 = requiredString('donor_operator', decision.donor_operator);
    if (e2) return e2;
  }

  if (decision.intent_class === 'telco.retail.top_up.v1') {
    if (typeof decision.amount !== 'number' || decision.amount <= 0) {
      return {
        status: 'fail',
        code: 'CIC_CANONICAL_VALUE_INVALID',
        details: 'amount must be a positive number'
      };
    }
    if (!/^[A-Z]{3}$/.test(decision.currency || '')) {
      return {
        status: 'fail',
        code: 'CIC_CANONICAL_VALUE_INVALID',
        details: 'currency must be ISO-4217 alpha-3'
      };
    }
  }

  if (decision.intent_class === 'telco.retail.plan_upgrade.v1') {
    const e1 = requiredString('target_plan', decision.target_plan);
    if (e1) return e1;
  }

  if (decision.intent_class === 'telco.retail.kyc_verify.v1') {
    const e1 = requiredString('id_document', decision.id_document);
    if (e1) return e1;
  }

  return {
    status: 'pass',
    code: 'PASS',
    details: 'CIC and PSC checks passed for telco retail demo pack'
  };
}

function main() {
  const fixtureIndex = loadJson(fixtureIndexPath);
  const packPath = path.join(root, fixtureIndex.pack_path || 'verticals/telco-retail-demo-pack');
  const bundlePath = path.join(packPath, 'bundle.json');
  const mappingsPath = path.join(packPath, 'intent-mappings.json');

  if (!fs.existsSync(bundlePath) || !fs.existsSync(mappingsPath)) {
    console.error('required pack files are missing for telco retail fixture run');
    process.exit(2);
  }

  const expectedBundleId = bundleIdFor(bundlePath);
  const mappings = loadJson(mappingsPath);
  const allowedIntents = new Set((mappings.mappings || []).map((m) => m.intent_class).filter(Boolean));

  const cases = Array.isArray(fixtureIndex.cases) ? fixtureIndex.cases : [];
  if (cases.length === 0) {
    console.error('no fixture cases found');
    process.exit(2);
  }

  let failed = 0;
  const results = [];

  for (const c of cases) {
    const casePath = path.join(root, c.path);
    const actual = evaluateCase(casePath, expectedBundleId, allowedIntents);
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
