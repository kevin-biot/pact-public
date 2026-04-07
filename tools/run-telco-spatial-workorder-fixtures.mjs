#!/usr/bin/env node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const fixtureIndexPath = process.argv[2] || path.join(root, 'fixtures', 'telco-spatial-workorder', 'index.json');

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function bundleIdFor(bundlePath) {
  const content = fs.readFileSync(bundlePath, 'utf8');
  const digest = createHash('sha256').update(content, 'utf8').digest('hex');
  return `sha256:${digest}`;
}

function parseIso(s) {
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

function pointsEqual(a, b, eps = 1e-9) {
  return Math.abs(a[0] - b[0]) <= eps && Math.abs(a[1] - b[1]) <= eps;
}

function pointOnSegment(point, a, b, eps = 1e-9) {
  const [x, y] = point;
  const [x1, y1] = a;
  const [x2, y2] = b;
  const cross = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1);
  if (Math.abs(cross) > eps) return false;
  const dot = (x - x1) * (x2 - x1) + (y - y1) * (y2 - y1);
  if (dot < -eps) return false;
  const lenSq = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (dot - lenSq > eps) return false;
  return true;
}

function pointInPolygonWithBoundary(point, polygonCoords) {
  const ring = polygonCoords[0] || [];
  if (ring.length < 4) return 'outside';

  for (let i = 0; i < ring.length - 1; i += 1) {
    if (pointOnSegment(point, ring[i], ring[i + 1])) return 'boundary';
  }
  if (pointsEqual(point, ring[0])) return 'boundary';

  let inside = false;
  const [px, py] = point;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = ((yi > py) !== (yj > py)) &&
      (px < ((xj - xi) * (py - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }
  return inside ? 'inside' : 'outside';
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

  if (d.type !== 'TelcoSpatialWorkOrderIntent') {
    return { status: 'fail', code: 'CIC_CANONICAL_VALUE_INVALID', details: 'type must be TelcoSpatialWorkOrderIntent' };
  }

  if (d.intent_class !== 'telco.ran.workorder.spatial.execute.v1') {
    return { status: 'fail', code: 'ESCALATE_OUT_OF_SCOPE_INTENT', details: 'intent is outside telco spatial work-order bounded domain' };
  }

  const wo = d.work_order || {};
  const asset = d.asset || {};
  const req = d.request || {};

  if (typeof wo.work_order_id !== 'string' || wo.work_order_id.trim() === '') {
    return { status: 'fail', code: 'DENY_WORK_ORDER_NOT_FOUND', details: 'work_order_id is missing or invalid' };
  }

  if (typeof asset.asset_id !== 'string' || asset.asset_id.trim() === '' || req.target_asset_id !== asset.asset_id) {
    return { status: 'fail', code: 'CIC_CANONICAL_VALUE_INVALID', details: 'target_asset_id must match asset.asset_id' };
  }

  if (!Array.isArray(wo.authorized_actions) || !wo.authorized_actions.includes(req.requested_action)) {
    return { status: 'fail', code: 'DENY_ACTION_NOT_AUTHORIZED', details: 'requested action is not in authorized_actions' };
  }

  const fromTs = parseIso(wo.valid_from);
  const untilTs = parseIso(wo.valid_until);
  const reqTs = parseIso(req.request_time);
  if (fromTs === null || untilTs === null || reqTs === null || reqTs < fromTs || reqTs > untilTs) {
    return { status: 'fail', code: 'DENY_WINDOW_INACTIVE', details: 'request_time is outside valid_from/valid_until' };
  }

  if (req.requested_action === 'retune_radio') {
    const delta = req?.params?.tx_power_delta_db;
    if (typeof delta !== 'number' || delta < -2.0 || delta > 2.0) {
      return {
        status: 'fail',
        code: 'DENY_CAPABILITY_PARAM_OUT_OF_BOUNDS',
        details: 'retune_radio requires tx_power_delta_db in [-2,2]'
      };
    }
  }

  const point = asset?.location?.coordinates;
  const polygon = wo?.authorized_area?.coordinates;
  if (!Array.isArray(point) || point.length !== 2 || !Array.isArray(polygon)) {
    return { status: 'fail', code: 'CIC_CANONICAL_VALUE_INVALID', details: 'invalid asset/location polygon geometry' };
  }

  const spatialResult = pointInPolygonWithBoundary(point, polygon);
  if (spatialResult === 'outside') {
    return { status: 'fail', code: 'DENY_ASSET_OUTSIDE_POLYGON', details: 'asset is outside authorized polygon' };
  }

  return {
    status: 'pass',
    code: 'ALLOW_IN_SCOPE',
    details: `dual-boundary authorization passed (spatial=${spatialResult})`
  };
}

function main() {
  const fixtureIndex = loadJson(fixtureIndexPath);
  const packPath = path.join(root, fixtureIndex.pack_path || 'verticals/telco-spatial-workorder-guard-demo-pack');
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
    const expected = c.expected || { status: 'pass', code: 'ALLOW_IN_SCOPE' };
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
