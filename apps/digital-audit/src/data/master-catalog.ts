import master from '../../../../packages/catalog/data/products.json';
import { publicProduct } from '../../../../packages/catalog/catalog.ts';
export function masterWebPlan(sourceId: string) {
  const product = master.find(p => p.source.id === sourceId);
  return product ? publicProduct(product, 'web') : null;
}
