import { create } from 'zustand';
import type { Channel } from '../types/automation';

export type RuleDraft = {
  name: string;
  channel: Channel | null;
  locationType: 'single' | 'multi';
  selectedAdSets: Array<{
    platform: 'meta' | 'google';
    adSetId: string;
    adSetName: string;
    campaignId: string;
    campaignName?: string;
    accountId?: string; // meta ad account id or google customer id
  }>;
  location?: { city: string; country: string; lat: number; lon: number } | null;
  conditions?: Array<{ parameter: 'temperature'|'humidity'|'wind_speed'|'precipitation'|'visibility'|'cloud_cover'; operator: 'greater_than'|'less_than'|'equals'|'between'; value: number; unit: string }>;
  conditionLogic?: { groups: Array<{ id: string; operator: 'AND'|'OR'; conditions: Array<{ parameter: 'temperature'|'humidity'|'wind_speed'|'precipitation'|'visibility'|'cloud_cover'; operator: 'greater_than'|'less_than'|'equals'|'between'; value: number; unit: string }> }>; globalOperator: 'AND'|'OR'; timeFrame?: { days: number; action: 'on'|'off' } };
  checkIntervalMinutes?: number;
};

type RuleWizardState = {
  draft: RuleDraft;
  setName: (name: string) => void;
  setChannel: (ch: Channel) => void;
  setLocationType: (t: 'single' | 'multi') => void;
  setSelectedAdSets: (items: RuleDraft['selectedAdSets']) => void;
  setLocation: (loc: RuleDraft['location']) => void;
  setConditions: (conditions: RuleDraft['conditions']) => void;
  setConditionLogic: (logic: RuleDraft['conditionLogic']) => void;
  setCheckInterval: (mins: number) => void;
  reset: () => void;
};

const initial: RuleDraft = { name: '', channel: null, locationType: 'single', selectedAdSets: [], location: null, conditions: [], conditionLogic: undefined, checkIntervalMinutes: 720 };

export const useRuleWizard = create<RuleWizardState>((set) => ({
  draft: initial,
  setName: (name) => set((s) => ({ draft: { ...s.draft, name } })),
  setChannel: (channel) => set((s) => ({ draft: { ...s.draft, channel } })),
  setLocationType: (locationType) => set((s) => ({ draft: { ...s.draft, locationType } })),
  setSelectedAdSets: (selectedAdSets) => set((s) => ({ draft: { ...s.draft, selectedAdSets } })),
  setLocation: (location) => set((s) => ({ draft: { ...s.draft, location } })),
  setConditions: (conditions) => set((s) => ({ draft: { ...s.draft, conditions } })),
  setConditionLogic: (conditionLogic) => set((s) => ({ draft: { ...s.draft, conditionLogic } })),
  setCheckInterval: (checkIntervalMinutes) => set((s) => ({ draft: { ...s.draft, checkIntervalMinutes } })),
  reset: () => set({ draft: initial }),
}));
