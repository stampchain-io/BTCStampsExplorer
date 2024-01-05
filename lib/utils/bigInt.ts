export function divideBigInts(dividend, divisor, decimalPlaces = 0) {
  // Escalar el dividendo para obtener decimales
  const scaledDividend = BigInt(dividend) * BigInt(10 ** decimalPlaces);

  // Realizar la división
  const quotient = scaledDividend / BigInt(divisor);

  // Formatear el resultado para incluir un punto decimal
  let quotientString = quotient.toString();
  if (decimalPlaces === 0) {
    return quotientString;
  }

  // Asegurarse de que el string tiene suficientes dígitos para el punto decimal
  const decimalIndex = quotientString.length - decimalPlaces;
  if (decimalIndex < 0) {
    // Agregar ceros al principio si es necesario
    quotientString = "0".repeat(-decimalIndex) + quotientString;
  }

  // Agregar el punto decimal en la posición correcta
  const resultIndex = Math.max(decimalIndex, 0);
  const result = quotientString.substring(0, resultIndex) + "." +
    quotientString.substring(resultIndex);

  return result;
}
