#!/usr/bin/env node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const fixtureIndexPath = process.argv[2] || path.join(root, 'fixtures', 'dssc-catalog-discovery', 'index.json');

function loadJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function bundleIdFor(bundlePath) {
  const content = fs.readFileSync(bundlePath, 'utf8');
  const digest = createHash('sha256').update(content, 'utf8').digest('hex');
  return 'sha256:' + digest;
}
function reqStr(name, value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return { status: 'fail', code: 'CIC_REQUIRED_FIELD_MISSING', details: name + ' is required' };
  }
  return null;
}

function evaluateCase(casePath, expectedBundleId, decisionSpace) {
  const payload = loadJson(casePath);
  const d = payload.decision || {};

  if (payload.bundleId !== expectedBundleId) {
    return { status: 'fail', code: 'PSC_BUNDLE_COMMIT_MISMATCH', details: 'expected ' + expectedBundleId + ', got ' + (payload.bundleId || '<missing>') };
  }
  if (d.type !== 'DSSCCatalogIntent') {
    return { status: 'fail', code: 'CIC_CANONICAL_VALUE_INVALID', details: 'type must be DSSCCatalogIntent' };
  }
  if (typeof d.intent_class !== 'string' || !decisionSpace.intent_resource_map[d.intent_class]) {
    return { status: 'fail', code: 'ESCALATE_OUT_OF_SCOPE_INTENT', details: 'intent is outside catalog bounded domain' };
  }

  const required = decisionSpace.required_fields_by_intent[d.intent_class] || [];
  for (const field of required) {
    const missing = reqStr(field, d[field]);
    if (missing) return missing;
  }

  if (['dssc.catalog.publish_offering.v1', 'dssc.catalog.update_offering.v1'].includes(d.intent_class)) {
    for (const field of ['catalog_id', 'offering_id', 'dataset_id', 'service_endpoint']) {
      const missing = reqStr(field, d[field]);
      if (missing) return missing;
    }
  }
  if (d.intent_class === 'dssc.catalog.query_offering.v1') {
    for (const field of ['catalog_id', 'offering_id']) {
      const missing = reqStr(field, d[field]);
      if (missing) return missing;
    }
  }

  if (['dssc.catalog.publish_offering.v1', 'dssc.catalog.update_offering.v1', 'dssc.catalog.remove_offering.v1'].includes(d.intent_class)) {
    if (d.policy_reference_bound !== true) {
      return { status: 'fail', code: 'DENY_POLICY_REFERENCE_UNBOUND', details: 'policy_reference_bound must be true for mutating catalog intents' };
    }
  }

  return { status: 'pass', code: 'ALLOW_IN_SCOPE', details: 'catalog decision is in scope and policy-bound' };
}

function main() {
  const fixtureIndex = loadJson(fixtureIndexPath);
  const packPath = path.join(root, fixtureIndex.pack_path || 'verticals/dssc-catalog-discovery-demo-pack');
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
