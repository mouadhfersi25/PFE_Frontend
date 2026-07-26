/**
 * Attend le Quality Gate SonarQube via l'API (sans webhook Jenkins).
 * Variables injectees par withSonarQubeEnv : SONAR_HOST_URL, SONAR_AUTH_TOKEN
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const host = (process.env.SONAR_HOST_URL || '').replace(/\/$/, '');
const token = process.env.SONAR_AUTH_TOKEN || process.env.SONAR_TOKEN || '';

if (!host || !token) {
  console.error('SONAR_HOST_URL / SONAR_AUTH_TOKEN manquants (withSonarQubeEnv).');
  process.exit(1);
}

function readReportTask() {
  const candidates = [
    join(process.cwd(), '.scannerwork', 'report-task.txt'),
    join(process.cwd(), '.sonarqube', 'out', '.sonar', 'report-task.txt'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return readFileSync(p, 'utf8');
  }
  throw new Error('report-task.txt introuvable apres le scan SonarQube.');
}

function parseTask(content) {
  const map = Object.fromEntries(
    content
      .split(/\r?\n/)
      .filter((l) => l.includes('='))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i), l.slice(i + 1)];
      })
  );
  return {
    ceTaskId: map.ceTaskId,
    analysisId: map.analysisId,
    projectKey: map.projectKey,
  };
}

async function sonarGet(path) {
  const url = `${host}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${token}:`).toString('base64')}`,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GET ${path} -> ${res.status}: ${body}`);
  }
  return res.json();
}

async function waitTask(ceTaskId, maxAttempts = 60, delayMs = 5000) {
  for (let i = 1; i <= maxAttempts; i++) {
    const data = await sonarGet(`/api/ce/task?id=${encodeURIComponent(ceTaskId)}`);
    const status = data?.task?.status;
    console.log(`[${i}/${maxAttempts}] CE task ${ceTaskId}: ${status}`);
    if (status === 'SUCCESS') return data.task.analysisId || data.task.id;
    if (status === 'FAILED' || status === 'CANCELED') {
      throw new Error(`Compute Engine task echouee: ${status}`);
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error('Timeout en attendant la fin de l analyse SonarQube.');
}

async function checkQualityGate(projectKey) {
  const data = await sonarGet(
    `/api/qualitygates/project_status?projectKey=${encodeURIComponent(projectKey)}`
  );
  const status = data?.projectStatus?.status;
  console.log(`Quality Gate: ${status}`);
  if (status !== 'OK') {
    const conditions = data?.projectStatus?.conditions || [];
    for (const c of conditions) {
      console.log(
        ` - ${c.metricKey}: ${c.status} (actual=${c.actualValue}, error=${c.errorThreshold})`
      );
    }
    process.exit(1);
  }
}

const task = parseTask(readReportTask());
console.log(`projectKey=${task.projectKey} ceTaskId=${task.ceTaskId}`);
await waitTask(task.ceTaskId);
await checkQualityGate(task.projectKey);
console.log('Quality Gate OK');
