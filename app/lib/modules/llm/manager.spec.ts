import { describe, expect, it, vi } from 'vitest';
import { LLMManager } from './manager';
import { BaseProvider } from './base-provider';
import type { ModelInfo } from './types';

class TestProvider extends BaseProvider {
  name = 'ModelCacheIsolationTest';
  staticModels: ModelInfo[] = [];
  config = {};
  getDynamicModels = vi.fn<() => Promise<ModelInfo[]>>(async () => []);

  getModelInstance(): never {
    throw new Error('Not used in this test');
  }
}

describe('LLMManager provider model discovery', () => {
  it('keeps provider model results isolated across successive API keys', async () => {
    const manager = LLMManager.getInstance();
    const provider = new TestProvider();
    manager.registerProvider(provider);

    const firstKeyModels = [
      { name: 'first-key-model', label: 'First key model', provider: provider.name, maxTokenAllowed: 1000 },
    ];
    const secondKeyModels = [
      { name: 'second-key-model', label: 'Second key model', provider: provider.name, maxTokenAllowed: 1000 },
    ];
    vi.mocked(provider.getDynamicModels!).mockResolvedValueOnce(firstKeyModels).mockResolvedValueOnce(secondKeyModels);

    const firstKeyOptions = { apiKeys: { [provider.name]: 'first-key' } };
    const secondKeyOptions = { apiKeys: { [provider.name]: 'second-key' } };

    const firstResult = await manager.getModelListFromProvider(provider, firstKeyOptions);
    const secondResult = await manager.getModelListFromProvider(provider, secondKeyOptions);

    expect(firstResult.map(({ name }) => name)).toContain('first-key-model');
    expect(firstResult.map(({ name }) => name)).not.toContain('second-key-model');
    expect(secondResult.map(({ name }) => name)).toContain('second-key-model');
    expect(provider.getDynamicModels).toHaveBeenCalledTimes(2);
  });

  it('propagates provider model-list failures instead of returning a misleading static fallback', async () => {
    const manager = LLMManager.getInstance();
    const provider = new TestProvider();
    provider.name = 'ModelListErrorTest';
    provider.getDynamicModels.mockRejectedValueOnce(new Error('Provider model service unavailable'));
    manager.registerProvider(provider);

    await expect(manager.getModelListFromProvider(provider, {})).rejects.toThrow('Provider model service unavailable');
  });
});
