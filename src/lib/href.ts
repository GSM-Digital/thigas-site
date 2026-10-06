/** Aceita caminho do próprio site, âncora, endereço HTTP, e-mail ou telefone. */
export const validateHref = (value: unknown) =>
  !value || /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(String(value)) || 'Use um caminho /pagina ou um endereço HTTP, e-mail ou telefone válido.'
