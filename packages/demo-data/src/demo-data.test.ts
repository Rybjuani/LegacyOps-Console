import { describe, it, expect } from 'vitest';
import { computeRoi, ROI_DEMO, buildDataset, buildDemoMigrationArtifacts } from '@legacyops/demo-data';

describe('roi calculation sanity', () => {
  it('returns positive monthly savings', () => {
    const r = computeRoi();
    expect(r.ahtDeltaSec).toBeGreaterThan(0);
    expect(r.ahtDeltaPct).toBeGreaterThan(0);
    expect(r.monthlySavingsUsd).toBeGreaterThan(0);
    expect(r.fcrUpliftPct).toBeGreaterThan(0);
    expect(r.escalationDropPct).toBeGreaterThan(0);
    expect(r.trainingWeeksSaved).toBeGreaterThan(0);
  });

  it('roi is internally consistent', () => {
    const r = computeRoi();
    const expectedHours = (ROI_DEMO.before.avgHandleTimeSec - ROI_DEMO.after.avgHandleTimeSec) * 60 * ROI_DEMO.teamSize / 3600;
    expect(Math.round(r.hoursSavedPerDay)).toBe(Math.round(expectedHours));
  });
});

describe('source-of-truth registry validation', () => {
  it('returns seeded entries', () => {
    const artifacts = buildDemoMigrationArtifacts();
    expect(artifacts.registry.list().length).toBeGreaterThan(0);
    expect(artifacts.sourceSystems.length).toBeGreaterThanOrEqual(3);
    expect(artifacts.plan.entityMappings.length).toBeGreaterThan(0);
  });
});

describe('dataset sanity', () => {
  it('contains customers, cases and fake siebel data', () => {
    const ds = buildDataset();
    expect(ds.customers.length).toBeGreaterThan(0);
    expect(ds.cases.length).toBeGreaterThan(0);
    expect(ds.fakeSiebel.contacts.length).toBeGreaterThan(0);
    expect(ds.fakeSiebel.serviceRequests.length).toBeGreaterThan(0);
  });
});
