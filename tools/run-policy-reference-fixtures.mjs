#!/usr/bin/env node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const fixtureIndexPath = process.argv[2] || path.join(root, 'fixtures', 'policy-reference', 'index.json');

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

function applyOverlayComposition(packDir, pack, bundle, decision) {
  const precedence = Array.isArray(pack.precedence) ? pack.precedence : [];
  if (precedence.length === 0) {
    return { ok: true, composedEffect: decision.effect, trace: [] };
  }

  if (pack.deny_wins !== true || bundle.denyWins !== true) {
    return {
      ok: false,
      code: 'OVL_DENY_WINS_REQUIRED',
      details: 'overlay precedence requires deny_wins=true and denyWins=true'
    };
  }

  const trace = [];
  let composedEffect = decision.effect;
  for (const overlayKey of precedence) {
    const overlayRel = pack.files?.[overlayKey];
    if (!overlayRel || !bundle.files?.[overlayKey]) {
      return {
        ok: false,
        code: 'OVL_CANONICAL_MISMATCH',
        details: `overlay key missing from files map: ${overlayKey}`
      };
    }

    const overlayPath = path.join(packDir, overlayRel);
    if (!fs.existsSync(overlayPath)) {
      return {
        ok: false,
        code: 'OVL_CANONICAL_MISMATCH',
        details: `overlay file missing: ${overlayRel}`
      };
    }

    const overlay = loadJson(overlayPath);
    const rules = Array.isArray(overlay.rules) ? overlay.rules : [];

    for (const rule of rules) {
      const when = rule.when || {};
      const jurisdiction = decision.context?.jurisdiction;
      const matches = (
        (!when.jurisdiction || when.jurisdiction === jurisdiction) &&
        (!when.action || when.action === decision.action) &&
        (!when.resourceType || when.resourceType === decision.resourceType)
      );
      if (!matches) {
        continue;
      }

      trace.push({ overlay: overlayKey, rule: rule.id || '<unnamed>', effect: rule.effect || '<none>' });

      if (rule.effect === 'deny' && pack.deny_wins === true) {
        composedEffect = 'deny';
      }
    }
  }

  return { ok: true, composedEffect, trace };
}

function evaluateCase(casePath, expectedBundleId, casePackPath) {
  const payload = loadJson(casePath);
  const decision = payload.decision || {};

  if (payload.bundleId !== expectedBundleId) {
    return {
      status: 'fail',
      code: 'PSC_BUNDLE_COMMIT_MISMATCH',
      details: `expected ${expectedBundleId}, got ${payload.bundleId || '<missing>'}`
    };
  }

  if (decision.type !== 'PolicyDecision') {
    return {
      status: 'fail',
      code: 'CIC_CANONICAL_VALUE_INVALID',
      details: 'type must be PolicyDecision'
    };
  }
  if (decision.intent_class !== 'policy.decision.request.v1') {
    return {
      status: 'fail',
      code: 'CIC_CANONICAL_VALUE_INVALID',
      details: 'intent_class must be policy.decision.request.v1'
    };
  }

  const checks = [
    requiredString('subjectType', decision.subjectType),
    requiredString('action', decision.action),
    requiredString('resourceType', decision.resourceType),
    requiredString('effect', decision.effect),
    requiredString('context.jurisdiction', decision.context?.jurisdiction)
  ].filter(Boolean);
  if (checks.length > 0) {
    return checks[0];
  }

  if (!['permit', 'deny'].includes(decision.effect)) {
    return {
      status: 'fail',
      code: 'CIC_CANONICAL_VALUE_INVALID',
      details: 'effect must be permit or deny'
    };
  }

  const pack = loadJson(path.join(casePackPath, 'pack.json'));
  const bundle = loadJson(path.join(casePackPath, 'bundle.json'));
  const composition = applyOverlayComposition(casePackPath, pack, bundle, decision);
  if (!composition.ok) {
    return {
      status: 'fail',
      code: composition.code,
      details: composition.details
    };
  }

  const expectedComposed = decision.expected_composed_effect;
  if (typeof expectedComposed === 'string' && expectedComposed !== composition.composedEffect) {
    return {
      status: 'fail',
      code: 'OVL_COMPOSED_EFFECT_MISMATCH',
      details: `expected composed effect ${expectedComposed}, got ${composition.composedEffect}`
    };
  }

  const assertedEffect = decision.asserted_effect;
  if (typeof assertedEffect === 'string' && assertedEffect !== composition.composedEffect) {
    if (composition.composedEffect === 'deny' && assertedEffect === 'permit') {
      return {
        status: 'fail',
        code: 'OVL_AUTHORITY_EXPANSION_DENIED',
        details: 'asserted permit conflicts with deny-wins composed result'
      };
    }
    return {
      status: 'fail',
      code: 'OVL_COMPOSED_EFFECT_MISMATCH',
      details: `asserted effect ${assertedEffect} does not match composed effect ${composition.composedEffect}`
    };
  }

  return {
    status: 'pass',
    code: 'PASS',
    details: `CIC, PSC, and overlay checks passed (composed_effect=${composition.composedEffect})`
  };
}

function main() {
  const fixtureIndex = loadJson(fixtureIndexPath);
  const defaultPackPath = path.join(root, fixtureIndex.pack_path || 'verticals/policy-reference-pack');
  const cases = Array.isArray(fixtureIndex.cases) ? fixtureIndex.cases : [];
  if (cases.length === 0) {
    console.error('no fixture cases found');
    process.exit(2);
  }

  let failed = 0;
  const results = [];

  for (const c of cases) {
    const casePackPath = path.join(root, c.pack_path || fixtureIndex.pack_path || 'verticals/policy-reference-pack');
    const bundlePath = path.join(casePackPath, 'bundle.json');
    if (!fs.existsSync(bundlePath)) {
      results.push({
        id: c.id,
        expected: c.expected || { status: 'pass', code: 'PASS' },
        actual: { status: 'fail', code: 'CASE_FILE_MISSING', details: `bundle not found: ${bundlePath}` },
        match: false
      });
      failed += 1;
      continue;
    }

    const expectedBundleId = bundleIdFor(bundlePath);
    const casePath = path.join(root, c.path);
    const actual = evaluateCase(casePath, expectedBundleId, casePackPath);
    const expected = c.expected || { status: 'pass', code: 'PASS' };
    const match = actual.status === expected.status && actual.code === expected.code;
    if (!match) {
      failed += 1;
    }
    results.push({ id: c.id, expected, actual, match });
  }

  console.log(JSON.stringify({
    fixture_index: path.relative(root, fixtureIndexPath),
    default_pack_path: path.relative(root, defaultPackPath),
    cases_total: results.length,
    cases_failed: failed,
    results
  }, null, 2));

  process.exit(failed === 0 ? 0 : 1);
}

main();
