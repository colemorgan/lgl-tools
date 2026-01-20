import { tools, getToolBySlug, getToolIcon, toolIconMap } from '@/config/tools';
import { Clock, Scroll, Volume2 } from 'lucide-react';

describe('tools configuration', () => {
  it('has correct number of tools', () => {
    expect(tools).toHaveLength(3);
  });

  it('has all required tools', () => {
    const slugs = tools.map((t) => t.slug);
    expect(slugs).toContain('timer');
    expect(slugs).toContain('prompter');
    expect(slugs).toContain('vog');
  });

  it('all tools have required properties', () => {
    tools.forEach((tool) => {
      expect(tool).toHaveProperty('slug');
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('icon');
      expect(tool).toHaveProperty('status');
      expect(tool.slug).toBeTruthy();
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.icon).toBeTruthy();
    });
  });
});

describe('getToolBySlug', () => {
  it('returns the correct tool for a valid slug', () => {
    const timer = getToolBySlug('timer');
    expect(timer).toBeDefined();
    expect(timer?.name).toBe('Timer');
  });

  it('returns undefined for an invalid slug', () => {
    const result = getToolBySlug('nonexistent');
    expect(result).toBeUndefined();
  });
});

describe('getToolIcon', () => {
  it('returns the correct icon for valid icon names', () => {
    expect(getToolIcon('Clock')).toBe(Clock);
    expect(getToolIcon('Scroll')).toBe(Scroll);
    expect(getToolIcon('Volume2')).toBe(Volume2);
  });

  it('returns Clock as default for invalid icon names', () => {
    expect(getToolIcon('NonExistentIcon')).toBe(Clock);
  });
});

describe('toolIconMap', () => {
  it('contains all expected icons', () => {
    expect(toolIconMap).toHaveProperty('Clock');
    expect(toolIconMap).toHaveProperty('Scroll');
    expect(toolIconMap).toHaveProperty('Volume2');
  });
});
