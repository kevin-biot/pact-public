#!/usr/bin/env node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const fixtureIndexPath = process.argv[2] || path.join(root, 'fixtures', 'telco-spatial-coverage-intersection', 'index.json');

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

function orientation(p, q, r, eps = 1e-9) {
  const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
  if (Math.abs(val) <= eps) return 0;
  return val > 0 ? 1 : 2;
}

function segmentsIntersect(p1, q1, p2, q2) {
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && pointOnSegment(p2, p1, q1)) return true;
  if (o2 === 0 && pointOnSegment(q2, p1, q1)) return true;
  if (o3 === 0 && pointOnSegment(p1, p2, q2)) return true;
  if (o4 === 0 && pointOnSegment(q1, p2, q2)) return true;
  return false;
}

function polygonRelation(assetCoverageCoords, authorizedCoords) {
  const assetRing = assetCoverageCoords[0] || [];
  const authRing = authorizedCoords[0] || [];
  if (assetRing.length < 4 || authRing.length < 4) return 'outside';

  for (let i = 0; i < assetRing.length - 1; i += 1) {
    for (let j = 0; j < authRing.length - 1; j += 1) {
      if (segmentsIntersect(assetRing[i], assetRing[i + 1], authRing[j], authRing[j + 1])) {
        return 'intersects';
      }
    }
  }

  const assetInside = pointInPolygonWithBoundary(assetRing[0], authorizedCoords);
  if (assetInside !== 'outside') return 'inside_authorized';

  const authInside = pointInPolygonWithBoundary(authRing[0], assetCoverageCoords);
  if (authInside !== 'outside') return 'contains_authorized';

  return 'outside';
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

  if (d.type !== 'TelcoSpatialCoverageIntersectionIntent') {
    return { status: 'fail', code: 'CIC_CANONICAL_VALUE_INVALID', details: 'type must be TelcoSpatialCoverageIntersectionIntent' };
  }

  if (d.intent_class !== 'telco.ran.workorder.spatial.coverage_intersection.execute.v1') {
    return { status: 'fail', code: 'ESCALATE_OUT_OF_SCOPE_INTENT', details: 'intent is outside telco coverage-intersection bounded domain' };
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

  const coverage = asset?.coverage?.coordinates;
  const authorized = wo?.authorized_area?.coordinates;
  if (!Array.isArray(coverage) || !Array.isArray(authorized)) {
    return { status: 'fail', code: 'CIC_CANONICAL_VALUE_INVALID', details: 'invalid coverage/authorized geometry' };
  }

  const spatialResult = polygonRelation(coverage, authorized);
  if (spatialResult === 'outside') {
    return { status: 'fail', code: 'DENY_COVERAGE_NO_INTERSECTION', details: 'asset coverage does not intersect authorized polygon' };
  }

  return {
    status: 'pass',
    code: 'ALLOW_COVERAGE_IN_SCOPE',
    details: `dual-boundary authorization passed (coverage=${spatialResult})`
  };
}

function main() {
  const fixtureIndex = loadJson(fixtureIndexPath);
  const packPath = path.join(root, fixtureIndex.pack_path || 'verticals/telco-spatial-coverage-intersection-demo-pack');
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
    const expected = c.expected || { status: 'pass', code: 'ALLOW_COVERAGE_IN_SCOPE' };
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
