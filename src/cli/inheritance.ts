import { resolve } from 'node:path';
import { loadJson } from './utils.js';

export function buildInheritanceMap(
  configDir: string,
  environments: string[]
): Record<string, string | null> {
  const map: Record<string, string | null> = {};

  for (const env of environments) {
    const clear = loadJson(resolve(configDir, env, 'clear.json'));
    const { extendsEnv } = extractExtends(clear);
    map[env] = extendsEnv;
  }

  return map;
}

export function resolveInheritanceChain(
  env: string,
  inheritanceMap: Record<string, string | null>,
  availableEnvs: string[]
): string[] {
  const chain: string[] = [];
  const visited = new Set<string>();
  let current = inheritanceMap[env];

  visited.add(env);

  while (current !== null && current !== undefined) {
    if (visited.has(current)) {
      const cycle = [...chain, current].join(' -> ');
      throw new Error(
        `Circular _extends detected: ${env} -> ${cycle}`
      );
    }

    if (!availableEnvs.includes(current)) {
      throw new Error(
        `Environment "${env}" extends "${current}", but "${current}" does not exist. ` +
        `Available environments: ${availableEnvs.join(', ')}`
      );
    }

    visited.add(current);
    chain.push(current);
    current = inheritanceMap[current];
  }

  chain.reverse();
  return chain;
}

export function extractExtends(
  config: Record<string, unknown>
): { config: Record<string, unknown>; extendsEnv: string | null } {
  if (!('_extends' in config)) {
    return { config, extendsEnv: null };
  }

  const { _extends, ...rest } = config;

  if (typeof _extends !== 'string') {
    throw new Error(
      `_extends must be a string, got ${typeof _extends}`
    );
  }

  return { config: rest, extendsEnv: _extends };
}
