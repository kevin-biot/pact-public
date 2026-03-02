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

function signJwsEdDsa(payloadObj, privateKey, kid = 'fixture-ed25519') {
  const header = { alg: 'EdDSA', kid, typ: 'JWS' };
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

const keyPair = generateKeyPairSync('ed25519');
const privateKey = createPrivateKey(keyPair.privateKey.export({ format: 'pem', type: 'pkcs8' }));
const publicKey = createPublicKey(keyPair.publicKey.export({ format: 'pem', type: 'spki' }));
const publicJwk = publicKey.export({ format: 'jwk' });

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

writeJson(path.join(root, 'docs', 'architecture', 'oci-1-fixture-index.json'), {
  schema_version: '1.0',
  generated_at_utc: nowUtc(),
  keyset: 'fixtures/oci1/keys/ed25519-test-pub.jwk.json',
  cases: caseDefs
});

writeJson(path.join(root, 'docs', 'architecture', 'oci-1-error-map.json'), {
  schema_version: '1.0',
  errors: {
    PASS: 'Case passed expected OCI-1 checks.',
    PACK_SCHEMA_REQUIRED_MISSING: 'pack.json missing required top-level field.',
    PACK_SCHEMA_UNKNOWN_FIELD: 'pack.json contains unknown top-level field when additionalProperties=false.',
    BUNDLE_SCHEMA_REQUIRED_MISSING: 'bundle.json missing required top-level field.',
    BUNDLE_SCHEMA_UNKNOWN_FIELD: 'bundle.json contains unknown top-level field when additionalProperties=false.',
    BUNDLE_FILE_LOGICAL_KEY_MISSING: 'bundle logical key not present in pack files map.',
    BUNDLE_FILE_HASH_MISMATCH: 'bundle declared hash does not match referenced file.',
    BUNDLE_SIGNATURE_FORMAT_INVALID: 'obt.jws is not a valid compact JWS payload.',
    BUNDLE_SIGNATURE_ALG_UNSUPPORTED: 'JWS alg is unsupported for OCI-1 baseline.',
    BUNDLE_SIGNATURE_PAYLOAD_MISMATCH: 'JWS payload does not equal bundle.json.',
    BUNDLE_SIGNATURE_INVALID: 'JWS signature verification failed.',
    OVL_CANONICAL_MISMATCH: 'Overlay precedence references are inconsistent with files map or deny-wins constraints.',
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
    }
  ]
});

console.log('Generated OCI-1 fixture set under fixtures/oci1');
