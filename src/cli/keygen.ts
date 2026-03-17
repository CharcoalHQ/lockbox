import { generateKeyPair } from '../crypto.js';

export function runKeygen(): void {
  const { publicKey, privateKey } = generateKeyPair();

  console.log('Generated keypair:');
  console.log(`  Public key:  ${publicKey.toString('base64')}`);
  console.log(`  Private key: ${privateKey.toString('base64')}`);
}
