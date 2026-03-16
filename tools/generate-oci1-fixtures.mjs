#!/usr/bin/env node
import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, sign } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const fixturesRoot = path.join(root, 'fixtures', 'oci1');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function sha256Text(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, value, 'utf8');
}

function base64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function signJwsEdDsa(payloadObj, privateKey, opts = {}) {
  const {
    alg = 'EdDSA',
    typ = 'JWS',
    kid = 'fixture-ed25519',
    includeKid = true
  } = opts;
  const header = { alg, typ };
  if (includeKid) {
    header.kid = kid;
  }
  const protectedB64 = base64url(Buffer.from(JSON.stringify(header), 'utf8'));
  const payloadB64 = base64url(Buffer.from(JSON.stringify(payloadObj), 'utf8'));
  const signingInput = `${protectedB64}.${payloadB64}`;
  const signature = sign(null, Buffer.from(signingInput, 'utf8'), privateKey);
  return `${signingInput}.${base64url(signature)}`;
}

function buildCaseDir(relPath) {
  const dir = path.join(fixturesRoot, relPath);
  ensureDir(dir);
  return dir;
}

function writeCommonFiles(caseDir, includeOverlay = false) {
  const context = {
    '@context': {
      '@version': 1.1,
      id: '@id',
      type: '@type',
      term: 'https://pact.example/term#'
    }
  };

  const vocab = {
    '@context': {
      skos: 'http://www.w3.org/2004/02/skos/core#',
      dct: 'http://purl.org/dc/terms/'
    },
    '@id': 'https://pact.example/vocab/test-fixture',
    '@type': 'skos:ConceptScheme',
    'dct:title': 'PACT Test Fixture Vocabulary',
    'skos:hasTopConcept': [
      {
        '@id': 'https://pact.example/vocab/test-fixture#intent.activate',
        '@type': 'skos:Concept',
        'skos:prefLabel': 'Intent Activate'
      }
    ]
  };

  writeJson(path.join(caseDir, 'context.jsonld'), context);
  writeJson(path.join(caseDir, 'vocab.skos.jsonld'), vocab);
  if (includeOverlay) {
    const overlay = `@prefix ex: <https://pact.example/overlay#> .\nex:rule ex:denyWins true .\n`;
    writeText(path.join(caseDir, 'overlay-eu.ttl'), overlay);
  }
}

function fileHashMap(caseDir, filesMap) {
  const out = {};
  for (const [logicalKey, fileName] of Object.entries(filesMap)) {
    const content = fs.readFileSync(path.join(caseDir, fileName), 'utf8');
    out[logicalKey] = `sha256:${sha256Text(content)}`;
  }
  return out;
}

function basePack(files, overrides = {}) {
  return {
    pack_schema: '1.0',
    id: 'test-fixture-0.1.0',
    domain: 'test-fixture',
    version: '0.1.0',
    provider_id: 'ontology:pact-fixtures',
    trust_tier: 'Tier1',
    nbf: '2026-03-02T00:00:00Z',
    exp: '2030-03-02T00:00:00Z',
    rev_epoch: 1,
    deny_wins: true,
    precedence: [],
    files,
    dc: {
      identifier: 'ontology:test-fixture:v0.1.0',
      title: 'PACT OCI-1 Fixture Pack',
      creator: 'PACT Public Fixtures',
      issued: '2026-03-02',
      rights: 'Apache-2.0',
      description: 'Synthetic pack fixture for OCI-1 conformance checks.'
    },
    ...overrides
  };
}

function baseBundle(fileHashes, overrides = {}) {
  return {
    id: 'test-fixture-0.1.0',
    domain: 'test-fixture',
    version: '0.1.0',
    providerId: 'ontology:pact-fixtures',
    trustTier: 'Tier1',
    policySnapshotId: `sha256:${'a'.repeat(64)}`,
    files: fileHashes,
    precedence: [],
    denyWins: true,
    nbf: '2026-03-02T00:00:00Z',
    exp: '2030-03-02T00:00:00Z',
    revEpoch: 1,
    ...overrides
  };
}

function writeCaseArtifacts(caseRel, { pack, bundle, jws, includeOverlay = false }) {
  const dir = buildCaseDir(caseRel);
  writeCommonFiles(dir, includeOverlay);
  writeJson(path.join(dir, 'pack.json'), pack);
  writeJson(path.join(dir, 'bundle.json'), bundle);
  writeText(path.join(dir, 'obt.jws'), `${jws}\n`);
  return dir;
}

function nowUtc() {
  return new Date().toISOString().replace('.000', '');
}

ensureDir(fixturesRoot);

const REQUIRED_KID = 'fixture-ed25519';
const EVAL_NOW_UTC = '2027-01-01T00:00:00Z';
const MIN_REV_EPOCH = 1;

const keyPair = generateKeyPairSync('ed25519');
const privateKey = createPrivateKey(keyPair.privateKey.export({ format: 'pem', type: 'pkcs8' }));
const publicKey = createPublicKey(keyPair.publicKey.export({ format: 'pem', type: 'spki' }));
const publicJwk = {
  ...publicKey.export({ format: 'jwk' }),
  kid: REQUIRED_KID
};

const keysDir = path.join(fixturesRoot, 'keys');
writeJson(path.join(keysDir, 'ed25519-test-pub.jwk.json'), publicJwk);

const caseDefs = [];

// Case 1: valid
{
  const caseRel = path.join('valid', 'minimal');
  const dir = buildCaseDir(caseRel);
  writeCommonFiles(dir, false);

  const filesMap = { context: 'context.jsonld', vocab: 'vocab.skos.jsonld' };
  const pack = basePack(filesMap);
  const bundle = baseBundle(fileHashMap(dir, filesMap));
  const jws = signJwsEdDsa(bundle, privateKey);

  writeCaseArtifacts(caseRel, { pack, bundle, jws });
  caseDefs.push({
    id: 'OCI1-VALID-001',
    description: 'Valid minimal OCI-1 pack, bundle, and EdDSA signature.',
    path: `fixtures/oci1/${caseRel}`,
    expected: { status: 'pass', code: 'PASS' }
  });
}

// Case 2: missing required field in pack descriptor
{
  const caseRel = path.join('invalid', 'missing-required-field');
  const dir = buildCaseDir(caseRel);
  writeCommonFiles(dir, false);

  const filesMap = { context: 'context.jsonld', vocab: 'vocab.skos.jsonld' };
  const pack = basePack(filesMap);
  delete pack.provider_id;

  const bundle = baseBundle(fileHashMap(dir, filesMap));
  const jws = signJwsEdDsa(bundle, privateKey);

  writeCaseArtifacts(caseRel, { pack, bundle, jws });
  caseDefs.push({
    id: 'OCI1-FAIL-001',
    description: 'pack.json missing required field provider_id.',
    path: `fixtures/oci1/${caseRel}`,
    expected: { status: 'fail', code: 'PACK_SCHEMA_REQUIRED_MISSING' }
  });
}

// Case 3: bad file hash in bundle manifest
{
  const caseRel = path.join('invalid', 'bad-file-hash');
  const dir = buildCaseDir(caseRel);
  writeCommonFiles(dir, false);

  const filesMap = { context: 'context.jsonld', vocab: 'vocab.skos.jsonld' };
  const pack = basePack(filesMap);
  const hashes = fileHashMap(dir, filesMap);
  hashes.vocab = `sha256:${'0'.repeat(64)}`;

  const bundle = baseBundle(hashes);
  const jws = signJwsEdDsa(bundle, privateKey);

  writeCaseArtifacts(caseRel, { pack, bundle, jws });
  caseDefs.push({
    id: 'OCI1-FAIL-002',
    description: 'bundle.json hash does not match vocab file content.',
    path: `fixtures/oci1/${caseRel}`,
    expected: { status: 'fail', code: 'BUNDLE_FILE_HASH_MISMATCH' }
  });
}

// Case 4: signature mismatch
{
  const caseRel = path.join('invalid', 'signature-mismatch');
  const dir = buildCaseDir(caseRel);
  writeCommonFiles(dir, false);

  const filesMap = { context: 'context.jsonld', vocab: 'vocab.skos.jsonld' };
  const pack = basePack(filesMap);
  const bundle = baseBundle(fileHashMap(dir, filesMap));

  const goodJws = signJwsEdDsa(bundle, privateKey);
  const parts = goodJws.split('.');
  const badSig = parts[2].slice(0, -1) + (parts[2].endsWith('A') ? 'B' : 'A');
  const badJws = `${parts[0]}.${parts[1]}.${badSig}`;

  writeCaseArtifacts(caseRel, { pack, bundle, jws: badJws });
  caseDefs.push({
    id: 'OCI1-FAIL-003',
    description: 'JWS signature does not verify for bundle payload.',
    path: `fixtures/oci1/${caseRel}`,
    expected: { status: 'fail', code: 'BUNDLE_SIGNATURE_INVALID' }
  });
}

// Case 5: overlay precedence conflict (missing overlay entry)
{
  const caseRel = path.join('invalid', 'overlay-precedence-conflict');
  const dir = buildCaseDir(caseRel);
  writeCommonFiles(dir, false);

  const filesMap = { context: 'context.jsonld', vocab: 'vocab.skos.jsonld' };
  const pack = basePack(filesMap, {
    precedence: ['overlay_eu'],
    deny_wins: true
  });
  const bundle = baseBundle(fileHashMap(dir, filesMap), {
    precedence: ['overlay_eu'],
    denyWins: true
  });
  const jws = signJwsEdDsa(bundle, privateKey);

  writeCaseArtifacts(caseRel, { pack, bundle, jws });
  caseDefs.push({
    id: 'OCI1-FAIL-004',
    description: 'Overlay precedence refers to missing logical overlay key.',
    path: `fixtures/oci1/${caseRel}`,
    expected: { status: 'fail', code: 'OVL_CANONICAL_MISMATCH' }
  });
}

// Case 6: signature kid mismatch (unknown kid)
{
  const caseRel = path.join('invalid', 'signature-kid-mismatch');
  const dir = buildCaseDir(caseRel);
  writeCommonFiles(dir, false);

  const filesMap = { context: 'context.jsonld', vocab: 'vocab.skos.jsonld' };
  const pack = basePack(filesMap);
  const bundle = baseBundle(fileHashMap(dir, filesMap));
  const jws = signJwsEdDsa(bundle, privateKey, { kid: 'unknown-kid' });

  writeCaseArtifacts(caseRel, { pack, bundle, jws });
  caseDefs.push({
    id: 'OCI1-FAIL-005',
    description: 'JWS kid does not match required fixture key id.',
    path: `fixtures/oci1/${caseRel}`,
    expected: { status: 'fail', code: 'BUNDLE_SIGNATURE_KID_UNKNOWN' }
  });
}

// Case 7: signature kid missing
{
  const caseRel = path.join('invalid', 'signature-kid-missing');
  const dir = buildCaseDir(caseRel);
  writeCommonFiles(dir, false);

  const filesMap = { context: 'context.jsonld', vocab: 'vocab.skos.jsonld' };
  const pack = basePack(filesMap);
  const bundle = baseBundle(fileHashMap(dir, filesMap));
  const jws = signJwsEdDsa(bundle, privateKey, { includeKid: false });

  writeCaseArtifacts(caseRel, { pack, bundle, jws });
  caseDefs.push({
    id: 'OCI1-FAIL-006',
    description: 'JWS kid is missing from protected header.',
    path: `fixtures/oci1/${caseRel}`,
    expected: { status: 'fail', code: 'BUNDLE_SIGNATURE_KID_MISSING' }
  });
}

// Case 8: not yet valid (nbf in future relative to deterministic evaluation clock)
{
  const caseRel = path.join('invalid', 'not-yet-valid');
  const dir = buildCaseDir(caseRel);
  writeCommonFiles(dir, false);

  const filesMap = { context: 'context.jsonld', vocab: 'vocab.skos.jsonld' };
  const pack = basePack(filesMap, {
    nbf: '2028-01-01T00:00:00Z',
    exp: '2030-03-02T00:00:00Z'
  });
  const bundle = baseBundle(fileHashMap(dir, filesMap), {
    nbf: '2028-01-01T00:00:00Z',
    exp: '2030-03-02T00:00:00Z'
  });
  const jws = signJwsEdDsa(bundle, privateKey);

  writeCaseArtifacts(caseRel, { pack, bundle, jws });
  caseDefs.push({
    id: 'OCI1-FAIL-007',
    description: 'Bundle is not yet valid for evaluation clock.',
    path: `fixtures/oci1/${caseRel}`,
    expected: { status: 'fail', code: 'BUNDLE_NOT_YET_VALID' }
  });
}

// Case 9: expired bundle for evaluation clock
{
  const caseRel = path.join('invalid', 'expired');
  const dir = buildCaseDir(caseRel);
  writeCommonFiles(dir, false);

  const filesMap = { context: 'context.jsonld', vocab: 'vocab.skos.jsonld' };
  const pack = basePack(filesMap, {
    nbf: '2025-01-01T00:00:00Z',
    exp: '2026-01-01T00:00:00Z'
  });
  const bundle = baseBundle(fileHashMap(dir, filesMap), {
    nbf: '2025-01-01T00:00:00Z',
    exp: '2026-01-01T00:00:00Z'
  });
  const jws = signJwsEdDsa(bundle, privateKey);

  writeCaseArtifacts(caseRel, { pack, bundle, jws });
  caseDefs.push({
    id: 'OCI1-FAIL-008',
    description: 'Bundle has expired for evaluation clock.',
    path: `fixtures/oci1/${caseRel}`,
    expected: { status: 'fail', code: 'BUNDLE_EXPIRED' }
  });
}

// Case 10: revoked epoch (below minimum epoch in fixture policy)
{
  const caseRel = path.join('invalid', 'revoked-epoch');
  const dir = buildCaseDir(caseRel);
  writeCommonFiles(dir, false);

  const filesMap = { context: 'context.jsonld', vocab: 'vocab.skos.jsonld' };
  const pack = basePack(filesMap, { rev_epoch: 0 });
  const bundle = baseBundle(fileHashMap(dir, filesMap), { revEpoch: 0 });
  const jws = signJwsEdDsa(bundle, privateKey);

  writeCaseArtifacts(caseRel, { pack, bundle, jws });
  caseDefs.push({
    id: 'OCI1-FAIL-009',
    description: 'Bundle revocation epoch is below minimum required epoch.',
    path: `fixtures/oci1/${caseRel}`,
    expected: { status: 'fail', code: 'BUNDLE_REVOKED' }
  });
}

// Case 11: schema pattern violation in bundle policySnapshotId
{
  const caseRel = path.join('invalid', 'bundle-schema-pattern');
  const dir = buildCaseDir(caseRel);
  writeCommonFiles(dir, false);

  const filesMap = { context: 'context.jsonld', vocab: 'vocab.skos.jsonld' };
  const pack = basePack(filesMap);
  const bundle = baseBundle(fileHashMap(dir, filesMap), {
    policySnapshotId: 'sha256:not-a-valid-64-byte-hex'
  });
  const jws = signJwsEdDsa(bundle, privateKey);

  writeCaseArtifacts(caseRel, { pack, bundle, jws });
  caseDefs.push({
    id: 'OCI1-FAIL-010',
    description: 'bundle.json fails schema pattern validation for policySnapshotId.',
    path: `fixtures/oci1/${caseRel}`,
    expected: { status: 'fail', code: 'BUNDLE_SCHEMA_VALIDATION_FAILED' }
  });
}

writeJson(path.join(root, 'docs', 'architecture', 'oci-1-fixture-index.json'), {
  schema_version: '1.0',
  generated_at_utc: nowUtc(),
  evaluation: {
    now_utc: EVAL_NOW_UTC,
    min_rev_epoch: MIN_REV_EPOCH,
    required_kid: REQUIRED_KID
  },
  keyset: 'fixtures/oci1/keys/ed25519-test-pub.jwk.json',
  cases: caseDefs
});

writeJson(path.join(root, 'docs', 'architecture', 'oci-1-error-map.json'), {
  schema_version: '1.0',
  errors: {
    PASS: 'Case passed expected OCI-1 checks.',
    PACK_SCHEMA_REQUIRED_MISSING: 'pack.json missing required top-level field.',
    PACK_SCHEMA_UNKNOWN_FIELD: 'pack.json contains unknown top-level field when additionalProperties=false.',
    PACK_SCHEMA_VALIDATION_FAILED: 'pack.json failed JSON Schema validation constraints.',
    BUNDLE_SCHEMA_REQUIRED_MISSING: 'bundle.json missing required top-level field.',
    BUNDLE_SCHEMA_UNKNOWN_FIELD: 'bundle.json contains unknown top-level field when additionalProperties=false.',
    BUNDLE_SCHEMA_VALIDATION_FAILED: 'bundle.json failed JSON Schema validation constraints.',
    BUNDLE_FILE_LOGICAL_KEY_MISSING: 'bundle logical key not present in pack files map.',
    BUNDLE_FILE_HASH_MISMATCH: 'bundle declared hash does not match referenced file.',
    BUNDLE_SIGNATURE_FORMAT_INVALID: 'obt.jws is not a valid compact JWS payload.',
    BUNDLE_SIGNATURE_ALG_UNSUPPORTED: 'JWS alg is unsupported for OCI-1 baseline.',
    BUNDLE_SIGNATURE_KID_MISSING: 'JWS protected header kid is missing.',
    BUNDLE_SIGNATURE_KID_UNKNOWN: 'JWS kid does not match required trust key selection policy.',
    BUNDLE_SIGNATURE_PAYLOAD_MISMATCH: 'JWS payload does not equal bundle.json.',
    BUNDLE_SIGNATURE_INVALID: 'JWS signature verification failed.',
    BUNDLE_TIME_WINDOW_INVALID: 'Bundle time window is invalid (nbf/exp malformed or exp<=nbf).',
    BUNDLE_TIME_WINDOW_MISMATCH: 'Pack and bundle nbf/exp values do not match.',
    BUNDLE_NOT_YET_VALID: 'Bundle nbf is later than evaluation clock.',
    BUNDLE_EXPIRED: 'Bundle exp is at or before evaluation clock.',
    BUNDLE_REV_EPOCH_MISMATCH: 'Pack and bundle revocation epoch values do not match.',
    BUNDLE_REVOKED: 'Bundle revocation epoch is below required minimum epoch.',
    OVL_CANONICAL_MISMATCH: 'Overlay precedence references are inconsistent with files map or deny-wins constraints.',
    OVL_DENY_WINS_REQUIRED: 'Overlay precedence is present but deny-wins is not enabled consistently.',
    OVL_AUTHORITY_EXPANSION_DENIED: 'Composed overlay result denies authority expansion attempt.',
    OVL_COMPOSED_EFFECT_MISMATCH: 'Computed composed effect does not match asserted or expected effect.',
    CASE_PATH_MISSING: 'Fixture case path does not exist.',
    CASE_FILE_MISSING: 'Required fixture file is missing.',
    CASE_JSON_INVALID: 'Fixture JSON file is invalid.'
  }
});

writeJson(path.join(root, 'registry', 'index.json'), {
  packs: [
    {
      snapshot_id: 'ontology:test-fixture:v0.1.0',
      domain: 'test-fixture',
      provider_id: 'ontology:pact-fixtures',
      trust_tier: 'Tier1',
      version: 'v0.1.0',
      path: 'fixtures/oci1/valid/minimal'
    },
    {
      snapshot_id: 'ontology:telco-reference:v0.1.0',
      domain: 'telco-reference',
      provider_id: 'ontology:pact-reference',
      trust_tier: 'Tier1',
      version: 'v0.1.0',
      path: 'verticals/telco-reference-pack'
    },
    {
      snapshot_id: 'ontology:policy-reference:v0.1.0',
      domain: 'policy-reference',
      provider_id: 'ontology:pact-reference',
      trust_tier: 'Tier1',
      version: 'v0.1.0',
      path: 'verticals/policy-reference-pack'
    }
  ]
});

console.log('Generated OCI-1 fixture set under fixtures/oci1');
