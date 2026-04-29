import { customAlphabet } from 'nanoid';

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const generate = customAlphabet(ALPHABET, 8);

export function gerarCodigoConvite(): string {
  return generate();
}

export const CODIGO_CONVITE_LENGTH = 8;
export const CODIGO_CONVITE_ALPHABET = ALPHABET;
