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

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isRfc3339DateTime(value) {
  if (typeof value !== 'string') {
    return false;
  }
  const re = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
  if (!re.test(value)) {
    return false;
  }
  return Number.isFinite(Date.parse(value));
}

function parseUtc(value) {
  if (!isRfc3339DateTime(value)) {
    return Number.NaN;
  }
  return Date.parse(value);
}

function validateBySchema(value, schema, at = '$') {
  if (!isObject(schema)) {
    return null;
  }

  if (Array.isArray(schema.allOf)) {
    for (const item of schema.allOf) {
      const err = validateBySchema(value, item, at);
      if (err) {
        return err;
      }
    }
  }

  if (Array.isArray(schema.enum)) {
    const ok = schema.enum.some((entry) => deepEqual(entry, value));
    if (!ok) {
      return `${at}: value not in enum`;
    }
  }

  if (schema.type === 'object') {
    if (!isObject(value)) {
      return `${at}: expected object`;
    }
    const keys = Object.keys(value);
    if (Number.isInteger(schema.minProperties) && keys.length < schema.minProperties) {
      return `${at}: expected at least ${schema.minProperties} properties`;
    }
    const required = Array.isArray(schema.required) ? schema.required : [];
    for (const key of required) {
      if (!(key in value)) {
        return `${at}.${key}: missing required property`;
      }
    }
    const properties = isObject(schema.properties) ? schema.properties : {};
    for (const key of keys) {
      const propSchema = properties[key];
      if (!propSchema) {
        if (schema.additionalProperties === false) {
          return `${at}.${key}: unknown property`;
        }
        if (isObject(schema.additionalProperties)) {
          const apErr = validateBySchema(value[key], schema.additionalProperties, `${at}.${key}`);
          if (apErr) {
            return apErr;
          }
        }
        continue;
      }
      const propErr = validateBySchema(value[key], propSchema, `${at}.${key}`);
      if (propErr) {
        return propErr;
      }
    }
    return null;
  }

  if (schema.type === 'array') {
    if (!Array.isArray(value)) {
      return `${at}: expected array`;
    }
    if (Number.isInteger(schema.minItems) && value.length < schema.minItems) {
      return `${at}: expected at least ${schema.minItems} items`;
    }
    if (schema.uniqueItems === true) {
      const seen = new Set();
      for (const item of value) {
        const key = JSON.stringify(item);
        if (seen.has(key)) {
          return `${at}: expected unique items`;
        }
        seen.add(key);
      }
    }
    if (isObject(schema.items)) {
      for (let i = 0; i < value.length; i += 1) {
        const itemErr = validateBySchema(value[i], schema.items, `${at}[${i}]`);
        if (itemErr) {
          return itemErr;
        }
      }
    }
    return null;
  }

  if (schema.type === 'string') {
    if (typeof value !== 'string') {
      return `${at}: expected string`;
    }
    if (Number.isInteger(schema.minLength) && value.length < schema.minLength) {
      return `${at}: expected minLength ${schema.minLength}`;
    }
    if (typeof schema.pattern === 'string') {
      const re = new RegExp(schema.pattern);
      if (!re.test(value)) {
        return `${at}: does not match pattern ${schema.pattern}`;
      }
    }
    if (schema.format === 'date-time' && !isRfc3339DateTime(value)) {
      return `${at}: expected RFC3339 date-time`;
    }
    return null;
  }

  if (schema.type === 'integer') {
    if (!Number.isInteger(value)) {
      return `${at}: expected integer`;
    }
    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      return `${at}: expected minimum ${schema.minimum}`;
    }
    return null;
  }

  if (schema.type === 'boolean') {
    if (typeof value !== 'boolean') {
      return `${at}: expected boolean`;
    }
    return null;
  }

  if (schema.type === 'number') {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return `${at}: expected number`;
    }
    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      return `${at}: expected minimum ${schema.minimum}`;
    }
    return null;
  }

  return null;
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

function evaluateCase(caseDef, fixtureKeyPath, packSchema, bundleSchema, evaluationPolicy) {
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
  const packValidationErr = validateBySchema(pack, packSchema);
  if (packValidationErr) {
    return { status: 'fail', code: 'PACK_SCHEMA_VALIDATION_FAILED', details: packValidationErr };
  }

  const bundleSchemaCheck = verifyRequiredAndUnknownFields(bundle, bundleSchema, 'BUNDLE_SCHEMA_REQUIRED_MISSING', 'BUNDLE_SCHEMA_UNKNOWN_FIELD');
  if (!bundleSchemaCheck.ok) {
    return { status: 'fail', code: bundleSchemaCheck.code, details: bundleSchemaCheck.details };
  }
  const bundleValidationErr = validateBySchema(bundle, bundleSchema);
  if (bundleValidationErr) {
    return { status: 'fail', code: 'BUNDLE_SCHEMA_VALIDATION_FAILED', details: bundleValidationErr };
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

  if (!('kid' in header) || typeof header.kid !== 'string' || header.kid.length === 0) {
    return { status: 'fail', code: 'BUNDLE_SIGNATURE_KID_MISSING', details: 'JWS protected header kid is required' };
  }
  if (evaluationPolicy.requiredKid && header.kid !== evaluationPolicy.requiredKid) {
    return {
      status: 'fail',
      code: 'BUNDLE_SIGNATURE_KID_UNKNOWN',
      details: `kid mismatch: expected=${evaluationPolicy.requiredKid} actual=${header.kid}`
    };
  }
  if (typeof fixturePubJwk.kid === 'string' && fixturePubJwk.kid.length > 0 && header.kid !== fixturePubJwk.kid) {
    return {
      status: 'fail',
      code: 'BUNDLE_SIGNATURE_KID_UNKNOWN',
      details: `kid mismatch: keyset=${fixturePubJwk.kid} actual=${header.kid}`
    };
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

  if (pack.nbf !== bundle.nbf || pack.exp !== bundle.exp) {
    return {
      status: 'fail',
      code: 'BUNDLE_TIME_WINDOW_MISMATCH',
      details: 'pack/bundle nbf or exp mismatch'
    };
  }

  const nbfMs = parseUtc(bundle.nbf);
  const expMs = parseUtc(bundle.exp);
  if (!Number.isFinite(nbfMs) || !Number.isFinite(expMs)) {
    return { status: 'fail', code: 'BUNDLE_TIME_WINDOW_INVALID', details: 'bundle nbf/exp must be RFC3339 date-time values' };
  }
  if (!(nbfMs < expMs)) {
    return { status: 'fail', code: 'BUNDLE_TIME_WINDOW_INVALID', details: 'bundle exp must be later than nbf' };
  }
  if (evaluationPolicy.nowMs < nbfMs) {
    return {
      status: 'fail',
      code: 'BUNDLE_NOT_YET_VALID',
      details: `now=${evaluationPolicy.nowUtc} nbf=${bundle.nbf}`
    };
  }
  if (evaluationPolicy.nowMs >= expMs) {
    return {
      status: 'fail',
      code: 'BUNDLE_EXPIRED',
      details: `now=${evaluationPolicy.nowUtc} exp=${bundle.exp}`
    };
  }

  if (pack.rev_epoch !== bundle.revEpoch) {
    return {
      status: 'fail',
      code: 'BUNDLE_REV_EPOCH_MISMATCH',
      details: `pack.rev_epoch=${pack.rev_epoch} bundle.revEpoch=${bundle.revEpoch}`
    };
  }
  if (bundle.revEpoch < evaluationPolicy.minRevEpoch) {
    return {
      status: 'fail',
      code: 'BUNDLE_REVOKED',
      details: `bundle.revEpoch=${bundle.revEpoch} min_rev_epoch=${evaluationPolicy.minRevEpoch}`
    };
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
  const nowUtc = fixtureIndex.evaluation?.now_utc || fixtureIndex.generated_at_utc;
  const nowMs = parseUtc(nowUtc);
  if (!Number.isFinite(nowMs)) {
    console.error('fixture index has invalid evaluation.now_utc/generated_at_utc');
    process.exit(2);
  }
  const minRevEpoch = Number.isInteger(fixtureIndex.evaluation?.min_rev_epoch)
    ? fixtureIndex.evaluation.min_rev_epoch
    : 0;
  const requiredKid = typeof fixtureIndex.evaluation?.required_kid === 'string'
    ? fixtureIndex.evaluation.required_kid
    : null;
  const evaluationPolicy = {
    nowUtc,
    nowMs,
    minRevEpoch,
    requiredKid
  };

  const cases = Array.isArray(fixtureIndex.cases) ? fixtureIndex.cases : [];
  if (cases.length === 0) {
    console.error('no fixture cases found');
    process.exit(2);
  }

  let failures = 0;
  const results = [];

  for (const caseDef of cases) {
    const actual = evaluateCase(caseDef, fixtureKeyPath, packSchema.value, bundleSchema.value, evaluationPolicy);
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
    evaluation: {
      now_utc: nowUtc,
      min_rev_epoch: minRevEpoch,
      required_kid: requiredKid
    },
    cases_total: results.length,
    cases_failed: failures,
    results
  }, null, 2));

  process.exit(failures === 0 ? 0 : 1);
}

main();
