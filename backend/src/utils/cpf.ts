/**
 * Sanitiza CPF removendo qualquer não-dígito.
 */
export function sanitizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

/**
 * Valida CPF com dígitos verificadores.
 * Aceita com ou sem máscara.
 */
export function isValidCpf(input: string): boolean {
  const cpf = sanitizeCpf(input);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // todos os dígitos iguais

  const digits = cpf.split("").map(Number);

  // 1º dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
  let check = (sum * 10) % 11;
  if (check === 10) check = 0;
  if (check !== digits[9]) return false;

  // 2º dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
  check = (sum * 10) % 11;
  if (check === 10) check = 0;
  return check === digits[10];
}
