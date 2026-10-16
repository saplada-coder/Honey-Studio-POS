import labelSizes from './label-sizes.json';

export function productSize(product: {id: string; size?: string | null}) {
  const recorded = product.size?.trim();
  if (recorded) return {label: recorded.toUpperCase().replace(/2XL/g, 'XXL'), estimated: false};
  const label = (labelSizes as Record<string, string>)[product.id];
  return {label: label || 'ยังไม่ระบุ', estimated: !!label};
}
