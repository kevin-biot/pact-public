#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

function nowUtcDate() {
  return new Date().toISOString().slice(0, 10);
}

function argValue(flag, fallback = null) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return fallback;
  return process.argv[idx + 1];
}

const passDate = argValue('--date', nowUtcDate());
const image = argValue('--image', 'gliner-extractor:latest');
const dryRun = process.argv.includes('--dry-run');

const packSpecs = [
  {
    dir: 'dssc-catalog-discovery-demo-pack',
    labels: [
      'CATALOG_ENTITY',
      'OFFERING',
      'DATASET_METADATA',
      'SERVICE_ENDPOINT',
      'USAGE_POLICY',
      'LIFECYCLE_STATE',
      'INTENT_CLASS',
      'JURISDICTION',
      'IDENTIFIER',
      'POLICY_SNAPSHOT'
    ]
  },
  {
    dir: 'dssc-rulebook-policy-mapping-demo-pack',
    labels: [
      'RULEBOOK_CLAUSE',
      'ODRL_PERMISSION',
      'ODRL_PROHIBITION',
      'ODRL_OBLIGATION',
      'CONSTRAINT_EXPRESSION',
      'INTENT_CLASS',
      'DENY_REASON_CODE',
      'POLICY_SNAPSHOT',
      'JURISDICTION',
      'IDENTIFIER'
    ]
  },
  {
    dir: 'dssc-eudi-attestation-admission-demo-pack',
    labels: [
      'VP_TOKEN',
      'CREDENTIAL_TYPE',
      'ISSUER_ID',
      'SUBJECT_ID',
      'ATTESTATION_CLASS',
      'ASSURANCE_LEVEL',
      'TRUST_ANCHOR',
      'VALIDITY_WINDOW',
      'REVOCATION_STATUS',
      'INTENT_CLASS',
      'POLICY_SNAPSHOT'
    ]
  },
  {
    dir: 'dssc-bilateral-challenge-receipt-demo-pack',
    labels: [
      'CHALLENGE_ID',
      'RECEIPT_ID',
      'JURISDICTION',
      'PAYLOAD_HASH',
      'POLICY_SNAPSHOT',
      'RATIONALE_REFERENCE',
      'CORRELATION_ID',
      'STATUS',
      'INTENT_CLASS',
      'DENY_REASON_CODE'
    ]
  },
  {
    dir: 'dssc-participant-onboarding-lifecycle-demo-pack',
    labels: [
      'PARTICIPANT_ID',
      'LIFECYCLE_STATE',
      'TRANSITION_RULE',
      'TRUST_PROOF',
      'POLICY_SNAPSHOT',
      'INTENT_CLASS',
      'DENY_REASON_CODE',
      'JURISDICTION',
      'IDENTIFIER'
    ]
  }
];

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}

function writeText(p, txt) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, txt.endsWith('\n') ? txt : txt + '\n');
}

function sha256File(p) {
  const data = fs.readFileSync(p);
  return `sha256:${createHash('sha256').update(data).digest('hex')}`;
}

function sha256String(s) {
  return `sha256:${createHash('sha256').update(s, 'utf8').digest('hex')}`;
}

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'pipe', encoding: 'utf8', ...opts });
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed\nstdout:\n${res.stdout}\nstderr:\n${res.stderr}`);
  }
  return res;
}

function collectCorpus(packDir) {
  const relFiles = [
    'README.md',
    'pack.json',
    'decision-space.json',
    'intent-mappings.json',
    'thesaurus-local.json',
    'patterns.json',
    'source-extract/sources.json',
    'message-identifiers.json',
    'extraction-summary.json'
  ];

  const crosswalkDir = path.join(packDir, 'source-extract', 'crosswalk');
  if (fs.existsSync(crosswalkDir)) {
    for (const file of fs.readdirSync(crosswalkDir).filter((f) => f.endsWith('.json')).sort()) {
      relFiles.push(path.join('source-extract', 'crosswalk', file));
    }
  }

  const chunks = [];
  const used = [];
  for (const rel of relFiles) {
    const full = path.join(packDir, rel);
    if (!fs.existsSync(full)) continue;
    used.push(rel.replace(/\\/g, '/'));
    const body = fs.readFileSync(full, 'utf8');
    chunks.push(`### FILE: ${rel.replace(/\\/g, '/')}\n${body}`);
  }

  return {
    corpus: chunks.join('\n\n'),
    sourceFiles: used
  };
}

function updateBundleAndObt(packDir) {
  const packPath = path.join(packDir, 'pack.json');
  const pack = readJson(packPath);
  const files = pack.files || {};

  const digestMap = {};
  for (const [k, rel] of Object.entries(files)) {
    const full = path.join(packDir, rel);
    if (fs.existsSync(full)) digestMap[k] = sha256File(full);
  }

  const bundle = {
    id: pack.id,
    domain: pack.domain,
    version: pack.version,
    providerId: pack.provider_id,
    trustTier: pack.trust_tier,
    policySnapshotId: digestMap.decision_space || sha256File(packPath),
    files: digestMap,
    precedence: pack.precedence || [],
    denyWins: !!pack.deny_wins,
    nbf: pack.nbf,
    exp: pack.exp,
    revEpoch: pack.rev_epoch
  };

  writeJson(path.join(packDir, 'bundle.json'), bundle);
  const header = { alg: 'EdDSA', kid: 'demo-obt', typ: 'JWS' };
  const signature = Buffer.from('gliner-docker-pass-signature').toString('base64url');
  writeText(path.join(packDir, 'obt.jws'), `${b64url(header)}.${b64url(bundle)}.${signature}`);

  return bundle;
}

function refreshDsscFixtureBundleIds() {
  const fixturesRoot = path.join(root, 'fixtures');
  for (const fdir of fs.readdirSync(fixturesRoot).filter((d) => d.startsWith('dssc-')).sort()) {
    const indexPath = path.join(fixturesRoot, fdir, 'index.json');
    const idx = readJson(indexPath);
    const bundleId = sha256File(path.join(root, idx.pack_path, 'bundle.json'));

    for (const c of idx.cases || []) {
      const casePath = path.join(root, c.path);
      if (!fs.existsSync(casePath)) continue;
      const obj = readJson(casePath);
      if (typeof obj.bundleId === 'string' && obj.bundleId.includes('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')) {
        continue;
      }
      obj.bundleId = bundleId;
      writeJson(casePath, obj);
    }
  }
}

function updateReadmeRunNote(readmePath, runId) {
  let txt = fs.readFileSync(readmePath, 'utf8');
  const marker = 'Current GLiNER Docker candidate pass:';
  const line = `Current GLiNER Docker candidate pass: \`${runId}\` (image: \`${image}\`).`;

  if (txt.includes(marker)) {
    txt = txt.replace(/Current GLiNER Docker candidate pass:.*$/m, line);
  } else {
    txt = txt.trimEnd() + `\n\n${line}\n`;
  }
  writeText(readmePath, txt);
}

function main() {
  // Validate image exists
  run('docker', ['image', 'inspect', image]);

  const results = [];

  for (const spec of packSpecs) {
    const packDir = path.join(root, 'verticals', spec.dir);
    const packPath = path.join(packDir, 'pack.json');
    const pack = readJson(packPath);
    const domain = pack.domain;
    const runId = `${domain}-gliner-docker-pass-${passDate}`;

    const passRel = path.join('source-extract', 'candidates', `gliner-dirty-pass-${passDate}`).replace(/\\/g, '/');
    const passDir = path.join(packDir, passRel);
    fs.mkdirSync(passDir, { recursive: true });

    const { corpus, sourceFiles } = collectCorpus(packDir);
    const corpusPath = path.join(passDir, 'corpus.txt');
    writeText(corpusPath, corpus);

    const config = {
      schema_version: '1.0',
      extractor: {
        adapter: 'gliner',
        model: 'urchade/gliner_medium-v2.1',
        threshold: 0.35,
        merge_strategy: 'longest_match',
        max_length: 512
      },
      domain,
      extraction_profile: {
        labels: spec.labels
      },
      output: {
        format: 'candidate_json',
        include_context: true,
        context_window: 220
      }
    };
    const configPath = path.join(passDir, 'config.json');
    writeJson(configPath, config);

    const rawPath = path.join(passDir, 'candidates.raw.json');

    if (!dryRun) {
      run('docker', [
        'run', '--rm',
        '-v', `${passDir}:/work`,
        image,
        '--config', '/work/config.json',
        '--source', '/work/corpus.txt',
        '--output', '/work/candidates.raw.json',
        '--run-id', runId
      ]);
    }

    const raw = readJson(rawPath);
    const rawCandidates = Array.isArray(raw.candidates) ? raw.candidates : [];

    const normalizedCandidates = rawCandidates.map((c, i) => ({
      candidate_id: `${domain.toUpperCase().replace(/[^A-Z0-9]/g, '-')}-CAND-${String(i + 1).padStart(4, '0')}`,
      surface_form: c.surface_form,
      label: c.entity_type,
      confidence: c.confidence,
      review_status: 'candidate',
      span: {
        start: c.source_location?.offset ?? null,
        end: c.source_location?.end_offset ?? null
      },
      source_ref: {
        path: `${passRel}/corpus.txt`,
        line_start: c.source_location?.line ?? null,
        line_end: c.source_location?.line ?? null
      },
      context: c.source_location?.context ?? null
    }));

    const candidateDoc = {
      schema_version: '1.0',
      tool: 'extract_candidates',
      run_id: runId,
      review_status: 'candidate',
      authoritative: false,
      candidates: normalizedCandidates,
      provenance: {
        run_id: runId,
        model_id: raw.model || config.extractor.model,
        model_hash: raw.model_hash || null,
        adapter: raw.adapter || 'gliner',
        threshold: raw.threshold ?? config.extractor.threshold,
        docker_image: image,
        config_digest: sha256File(configPath),
        source_digest: sha256File(corpusPath),
        raw_output_digest: sha256File(rawPath),
        created_at: new Date().toISOString()
      },
      summary: {
        candidate_count: normalizedCandidates.length,
        labels_used: raw.labels_used || spec.labels,
        processing_time_ms: raw.provenance?.processing_time_ms ?? null
      }
    };

    const candidatePath = path.join(passDir, 'candidates.json');
    writeJson(candidatePath, candidateDoc);

    const summaryPath = path.join(passDir, 'extraction-summary.json');
    const summary = {
      schema_version: '1.0',
      run_id: runId,
      review_status: 'candidate',
      authoritative: false,
      source_count: sourceFiles.length,
      candidate_count: normalizedCandidates.length,
      notes: [
        'This is a Docker-executed GLiNER dirty-pass extraction for demo acceleration.',
        'No downstream ontology promotion is allowed without human candidate adjudication.'
      ]
    };
    writeJson(summaryPath, summary);

    const manifestPath = path.join(passDir, 'manifest.json');
    const manifest = {
      schema_version: '1.0',
      tool: 'batch_extract_candidates',
      run_id: runId,
      review_status: 'candidate',
      artifact_paths: {
        config: `${passRel}/config.json`,
        corpus: `${passRel}/corpus.txt`,
        raw: `${passRel}/candidates.raw.json`,
        candidates: `${passRel}/candidates.json`,
        summary: `${passRel}/extraction-summary.json`,
        manifest: `${passRel}/manifest.json`
      },
      stats: {
        source_count: sourceFiles.length,
        candidate_count: normalizedCandidates.length,
        processing_time_ms: raw.provenance?.processing_time_ms ?? null
      },
      provenance: {
        run_id: runId,
        model_id: raw.model || config.extractor.model,
        model_hash: raw.model_hash || null,
        docker_image: image,
        config_digest: sha256File(configPath),
        source_digests: sourceFiles.map((rel) => sha256File(path.join(packDir, rel))),
        corpus_digest: sha256File(corpusPath),
        raw_output_digest: sha256File(rawPath),
        output_digest: sha256File(candidatePath),
        created_at: new Date().toISOString()
      }
    };
    writeJson(manifestPath, manifest);

    // Update pack file map to bind real GLiNER artifacts
    pack.files = pack.files || {};
    pack.files.execution_checklist = 'source-extract/tasks/immutable-authoring-pipeline.v1-v2.json';
    pack.files.gliner_dirty_manifest = `${passRel}/manifest.json`;
    pack.files.gliner_dirty_candidates = `${passRel}/candidates.json`;
    pack.files.gliner_dirty_summary = `${passRel}/extraction-summary.json`;
    pack.files.gliner_dirty_config = `${passRel}/config.json`;
    pack.files.gliner_dirty_raw_output = `${passRel}/candidates.raw.json`;
    writeJson(packPath, pack);

    // Update checklist with real run metadata
    const checklistPath = path.join(packDir, 'source-extract', 'tasks', 'immutable-authoring-pipeline.v1-v2.json');
    if (fs.existsSync(checklistPath)) {
      const checklist = readJson(checklistPath);
      checklist.execution = {
        mode: 'docker_gliner_real',
        run_id: runId,
        docker_image: image,
        pass_date: passDate,
        human_mediation: 'required'
      };
      writeJson(checklistPath, checklist);
    }

    updateReadmeRunNote(path.join(packDir, 'README.md'), runId);

    const bundle = updateBundleAndObt(packDir);
    results.push({
      pack: spec.dir,
      run_id: runId,
      candidate_count: normalizedCandidates.length,
      bundle_id: sha256String(JSON.stringify(bundle))
    });
  }

  refreshDsscFixtureBundleIds();

  console.log(JSON.stringify({
    pass_date: passDate,
    docker_image: image,
    dry_run: dryRun,
    packs: results
  }, null, 2));
}

main();
