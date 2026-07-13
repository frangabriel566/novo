/**
 * Preço unitário aplicável para um item de venda: preço de atacado se o
 * cliente for do tipo atacado OU se a quantidade atingir o mínimo configurado
 * no produto. Usado tanto no formulário de venda (cliente) quanto na API
 * (servidor) para garantir que os dois lados calculem o mesmo preço.
 */
export function getEffectivePrice(
  product: { price: number; wholesalePrice: number | null; wholesaleMinQty: number | null },
  customerType: 'RETAIL' | 'WHOLESALE',
  quantity: number
): number {
  const wholesaleConfigured = product.wholesalePrice != null && product.wholesaleMinQty != null
  const wholesaleEligible = wholesaleConfigured && (customerType === 'WHOLESALE' || quantity >= product.wholesaleMinQty!)
  return wholesaleEligible ? product.wholesalePrice! : product.price
}
