import { Env } from '../../worker-configuration';

const KNOWN_ADDRESSES_KEY = 'aibtcdev_known_stacks_addresses';

export async function getKnownAddresses(env: Env): Promise<string[]> {
	const addresses = await env.AIBTCDEV_SERVICES_KV.get<string[]>(KNOWN_ADDRESSES_KEY, 'json');
	return addresses || [];
}

export async function addKnownAddress(env: Env, address: string): Promise<void> {
	const addresses = await getKnownAddresses(env);
	if (!addresses.includes(address)) {
		addresses.push(address);
		await env.AIBTCDEV_SERVICES_KV.put(KNOWN_ADDRESSES_KEY, JSON.stringify(addresses));
	}
}
