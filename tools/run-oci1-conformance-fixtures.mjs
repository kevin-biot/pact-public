#!/usr/bin/env node
import { createHash, createPublicKey, verify } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const fixtureIndexPath = process.argv[2] || path.join(root, 'docs', 'architecture', 'oci-1-fixture-index.json');

function loadJson(filePath) {
  try {
    return { ok: true, value: JSON.parse(fs.readFileSync(filePath, 'utf8')) };
  } catch (err) {
    return { ok: false, error: err };
  }
}

function sha256Text(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

function decodeB64Url(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, 'base64');
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function verifyRequiredAndUnknownFields(obj, schema, requiredCode, unknownCode) {
  const required = Array.isArray(schema.required) ? schema.required : [];
  for (const key of required) {
    if (!(key in obj)) {
      return { ok: false, code: requiredCode, details: `missing required field: ${key}` };
    }
  }

  if (schema.additionalProperties === false && schema.properties && typeof schema.properties === 'object') {
    const known = new Set(Object.keys(schema.properties));
    for (const key of Object.keys(obj)) {
      if (!known.has(key)) {
        return { ok: false, code: unknownCode, details: `unknown field: ${key}` };
      }
    }
  }

  return { ok: true };
}

function evaluateCase(caseDef, fixtureKeyPath, packSchema, bundleSchema) {
  const caseDir = path.join(root, caseDef.path);
  if (!fs.existsSync(caseDir)) {
    return { status: 'fail', code: 'CASE_PATH_MISSING', details: caseDir };
  }

  const requiredFiles = ['pack.json', 'bundle.json', 'obt.jws'];
  for (const fileName of requiredFiles) {
    if (!fs.existsSync(path.join(caseDir, fileName))) {
      return { status: 'fail', code: 'CASE_FILE_MISSING', details: `missing ${fileName}` };
    }
  }

  const packRes = loadJson(path.join(caseDir, 'pack.json'));
  if (!packRes.ok) {
    return { status: 'fail', code: 'CASE_JSON_INVALID', details: `pack.json: ${packRes.error.message}` };
  }
  const bundleRes = loadJson(path.join(caseDir, 'bundle.json'));
  if (!bundleRes.ok) {
    return { status: 'fail', code: 'CASE_JSON_INVALID', details: `bundle.json: ${bundleRes.error.message}` };
  }
  const keyRes = loadJson(path.join(root, fixtureKeyPath));
  if (!keyRes.ok) {
    return { status: 'fail', code: 'CASE_JSON_INVALID', details: `fixture key: ${keyRes.error.message}` };
  }

  const pack = packRes.value;
  const bundle = bundleRes.value;
  const fixturePubJwk = keyRes.value;

  const packSchemaCheck = verifyRequiredAndUnknownFields(pack, packSchema, 'PACK_SCHEMA_REQUIRED_MISSING', 'PACK_SCHEMA_UNKNOWN_FIELD');
  if (!packSchemaCheck.ok) {
    return { status: 'fail', code: packSchemaCheck.code, details: packSchemaCheck.details };
  }

  const bundleSchemaCheck = verifyRequiredAndUnknownFields(bundle, bundleSchema, 'BUNDLE_SCHEMA_REQUIRED_MISSING', 'BUNDLE_SCHEMA_UNKNOWN_FIELD');
  if (!bundleSchemaCheck.ok) {
    return { status: 'fail', code: bundleSchemaCheck.code, details: bundleSchemaCheck.details };
  }

  const precedence = Array.isArray(pack.precedence) ? pack.precedence : [];
  if (precedence.length > 0) {
    if (pack.deny_wins !== true || bundle.denyWins !== true) {
      return {
        status: 'fail',
        code: 'OVL_CANONICAL_MISMATCH',
        details: 'overlay precedence requires deny-wins=true on both pack and bundle'
      };
    }
    for (const overlayKey of precedence) {
      if (!(overlayKey in (pack.files || {})) || !(overlayKey in (bundle.files || {}))) {
        return {
          status: 'fail',
          code: 'OVL_CANONICAL_MISMATCH',
          details: `overlay key missing in files maps: ${overlayKey}`
        };
      }
    }
  }

  for (const [logicalKey, expectedHash] of Object.entries(bundle.files || {})) {
    const relFile = (pack.files || {})[logicalKey];
    if (!relFile) {
      return {
        status: 'fail',
        code: 'BUNDLE_FILE_LOGICAL_KEY_MISSING',
        details: `bundle key missing from pack files: ${logicalKey}`
      };
    }

    const filePath = path.join(caseDir, relFile);
    if (!fs.existsSync(filePath)) {
      return {
        status: 'fail',
        code: 'CASE_FILE_MISSING',
        details: `referenced file missing: ${relFile}`
      };
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const actual = `sha256:${sha256Text(content)}`;
    if (actual !== expectedHash) {
      return {
        status: 'fail',
        code: 'BUNDLE_FILE_HASH_MISMATCH',
        details: `${logicalKey}: expected=${expectedHash} actual=${actual}`
      };
    }
  }

  const jwsCompact = fs.readFileSync(path.join(caseDir, 'obt.jws'), 'utf8').trim();
  const parts = jwsCompact.split('.');
  if (parts.length !== 3 || parts.some((p) => !p)) {
    return { status: 'fail', code: 'BUNDLE_SIGNATURE_FORMAT_INVALID', details: 'expected compact JWS header.payload.signature' };
  }

  let header;
  let payload;
  try {
    header = JSON.parse(decodeB64Url(parts[0]).toString('utf8'));
    payload = JSON.parse(decodeB64Url(parts[1]).toString('utf8'));
  } catch (err) {
    return { status: 'fail', code: 'BUNDLE_SIGNATURE_FORMAT_INVALID', details: err.message };
  }

  if (header.alg !== 'EdDSA') {
    return { status: 'fail', code: 'BUNDLE_SIGNATURE_ALG_UNSUPPORTED', details: `alg=${header.alg || '<missing>'}` };
  }

  if (!deepEqual(payload, bundle)) {
    return { status: 'fail', code: 'BUNDLE_SIGNATURE_PAYLOAD_MISMATCH', details: 'JWS payload does not match bundle.json' };
  }

  const signingInput = Buffer.from(`${parts[0]}.${parts[1]}`, 'utf8');
  const sigBytes = decodeB64Url(parts[2]);
  const pubKey = createPublicKey({ key: fixturePubJwk, format: 'jwk' });
  const sigOk = verify(null, signingInput, pubKey, sigBytes);
  if (!sigOk) {
    return { status: 'fail', code: 'BUNDLE_SIGNATURE_INVALID', details: 'Ed25519 signature verification failed' };
  }

  return { status: 'pass', code: 'PASS', details: 'all checks passed' };
}

function main() {
  const fixtureIdxRes = loadJson(fixtureIndexPath);
  if (!fixtureIdxRes.ok) {
    console.error(`failed to read fixture index ${fixtureIndexPath}: ${fixtureIdxRes.error.message}`);
    process.exit(2);
  }

  const packSchema = loadJson(path.join(root, 'schemas', 'pack-descriptor.schema.json'));
  const bundleSchema = loadJson(path.join(root, 'schemas', 'bundle-manifest.schema.json'));
  if (!packSchema.ok || !bundleSchema.ok) {
    console.error('failed to load required schemas');
    process.exit(2);
  }

  const fixtureIndex = fixtureIdxRes.value;
  const fixtureKeyPath = fixtureIndex.keyset;
  const cases = Array.isArray(fixtureIndex.cases) ? fixtureIndex.cases : [];
  if (cases.length === 0) {
    console.error('no fixture cases found');
    process.exit(2);
  }

  let failures = 0;
  const results = [];

  for (const caseDef of cases) {
    const actual = evaluateCase(caseDef, fixtureKeyPath, packSchema.value, bundleSchema.value);
    const expected = caseDef.expected || { status: 'pass', code: 'PASS' };
    const match = actual.status === expected.status && actual.code === expected.code;
    if (!match) {
      failures += 1;
    }
    results.push({
      id: caseDef.id,
      expected,
      actual,
      match
    });
  }

  console.log(JSON.stringify({
    fixture_index: path.relative(root, fixtureIndexPath),
    cases_total: results.length,
    cases_failed: failures,
    results
  }, null, 2));

  process.exit(failures === 0 ? 0 : 1);
}

main();
