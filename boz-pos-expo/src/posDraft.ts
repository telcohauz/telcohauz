/** Read-only POS draft tools. Never writes sales or inventory to any backend. */
import type {Item} from './demo';
export type Cart=Record<string,number>;
export type CartLine={id:string;sku:string;name:string;quantity:number;unitPriceCents:number;subtotalCents:number};

function wholeNonnegative(value:number,label:string){
 if(!Number.isSafeInteger(value)||value<0)throw new Error('Invalid '+label);
 return value;
}
function checkedProduct(product:Item,shopId:string){
 if(!shopId||product.shop!==shopId)throw new Error('Product belongs to a different shop');
 if(!product.id||!product.name.trim())throw new Error('Invalid product');
 wholeNonnegative(product.price,'price');
 wholeNonnegative(product.qty,'available stock');
}
export function addCartUnit(cart:Cart,product:Item,shopId:string):Cart{
 checkedProduct(product,shopId);
 const count=wholeNonnegative(cart[product.id]??0,'cart quantity');
 if(count>=product.qty)throw new Error('Not enough available stock');
 return {...cart,[product.id]:count+1};
}
export function cartLines(products:Item[],cart:Cart,shopId:string):CartLine[]{
 if(!shopId)throw new Error('Missing shop');
 const result:CartLine[]=[];
 for(const [id,amount] of Object.entries(cart)){
  const qty=wholeNonnegative(amount,'cart quantity');
  if(qty===0)continue;
  const product=products.find(p=>p.shop===shopId&&p.id===id);
  if(!product)throw new Error('Cart contains an item outside this shop');
  checkedProduct(product,shopId);
  if(qty>product.qty)throw new Error('Cart exceeds available stock');
  const subtotal=product.price*qty;
  wholeNonnegative(subtotal,'line total');
  result.push({id,sku:product.sku,name:product.name,quantity:qty,unitPriceCents:product.price,subtotalCents:subtotal});
 }
 return result;
}
export function cartTotalCents(lines:CartLine[]):number{
 let total=0;
 for(const l of lines){total+=wholeNonnegative(l.subtotalCents,'line total');wholeNonnegative(total,'cart total');}
 return total;
}
export function buildDraftReceipt(products:Item[],cart:Cart,shopId:string,shopName:string,now=''):string{
 const lines=cartLines(products,cart,shopId);
 if(!lines.length)throw new Error('Add an item to preview a draft');
 const money=(v:number)=>'RM '+(v/100).toFixed(2);
 return [
 'BOZ POS — UNSAVED DRAFT','NOT A RECEIPT / NOT A TAX INVOICE',
 'Shop: '+shopName,
 ...(now?['Created: '+now]:[]),
 ...lines.map(l=>l.name+' x'+l.quantity+' @ '+money(l.unitPriceCents)+' = '+money(l.subtotalCents)),
 'Total (estimate): '+money(cartTotalCents(lines)),
 'NO PAYMENT TAKEN · NO STOCK DEDUCTED',
 'No transaction has been recorded.'
 ].join('\n');
}
