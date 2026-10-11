import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { LLMManager } from '~/lib/modules/llm/manager';
import { getProviderSettingsFromCookie } from '~/lib/api/cookies';

export async function action({ context, params, request }: ActionFunctionArgs) {
  const providerName = params.provider;

  if (!providerName) {
    return json({ error: 'Provider is required' }, { status: 400 });
  }

  const { apiKey } = await request.json<{ apiKey?: string }>();
  const serverEnv = Object.fromEntries(
    Object.entries(context.cloudflare?.env ?? {}).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
  const llmManager = LLMManager.getInstance(serverEnv);
  const provider = llmManager.getProvider(providerName);

  if (!provider) {
    return json({ error: 'Provider not found' }, { status: 404 });
  }

  const cookieHeader = request.headers.get('Cookie');
  const providerSettings = getProviderSettingsFromCookie(cookieHeader);
  const modelList = await llmManager.getModelListFromProvider(provider, {
    apiKeys: apiKey ? { [providerName]: apiKey } : {},
    providerSettings,
    serverEnv,
  });

  return json({ modelList });
}
