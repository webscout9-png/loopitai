import { afterEach, describe, expect, it, vi } from 'vitest';
import { selectStarterTemplate } from './selectStarterTemplate';

describe('selectStarterTemplate', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('avoids an unnecessary model request when choosing a starter for a game', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);

    const result = await selectStarterTemplate({
      message: '[Model: gpt-example]\n\n[Provider: Example]\n\nCreate a Snake game!',
      model: 'gpt-example',
      provider: { name: 'Example', staticModels: [] },
    });

    expect(result).toEqual({ template: 'blank', title: 'Create a Snake game' });
    expect(fetch).not.toHaveBeenCalled();
  });
});
