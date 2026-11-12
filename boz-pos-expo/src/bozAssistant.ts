/**
 * BOZ POS read-only shop assistant.
 * Local rules only: no model, network calls, database changes or private-account access.
 * Caller must supply ONLY server-authorized shop records; additionally filter by shop ID.
 */
import type {Item,Job} from './demo';

function ringgit(sen:number):string{
 if(!Number.isSafeInteger(sen)||sen<0)throw new Error('Invalid product price');
 return 'RM '+(sen/100).toFixed(2);
}
function malay(text:string):boolean{
 return /\b(berapa|senarai|stok|barang|harga|kedai|baiki|pembaikan|tertunggak|jual|jualan|untung|kos|pembekal)\b/i.test(text);
}
export function answerBozShopQuestion(shopId:string,products:Item[],jobs:Job[],question:string):string{
 if(!shopId.trim())throw new Error('Shop context required');
 const query=question.trim().slice(0,500).toLowerCase();
 const ms=malay(query);
 if(!query)return ms?'Masukkan soalan tentang stok, harga atau repair.':'Ask about stock, pricing or repairs.';
 const ownProducts=products.filter(p=>p.shop===shopId);
 const ownJobs=jobs.filter(j=>j.shop===shopId);
 if(/\b(profit|margin|revenue|sales|jualan|untung|kos|supplier|pembekal|commission|komisen)\b/.test(query)){
  return ms?'Rekod kewangan dan pembekal belum tersedia untuk pembantu ini. Semak di Admin Website.':'Financial and supplier records are not available to this assistant. Check the Admin Website.';
 }
 if(/\b(repair|repairs|baiki|pembaikan|service|servis|ticket|job)\b/.test(query)){
  const pending=ownJobs.filter(j=>j.status.trim().toLowerCase()!=='completed'&&j.status.trim().toLowerCase()!=='selesai');
  if(!pending.length)return ms?'Tiada kerja repair tertunggak dalam data kedai ini.':'No pending repairs in the current shop records.';
  return (ms?'Repair belum selesai: ':'Pending repairs: ')+pending.map(j=>j.id+' '+j.device+' ('+j.status+')').join('; ');
 }
 if(/\b(price|prices|harga|produk|product|products)\b/.test(query)){
  if(!ownProducts.length)return ms?'Tiada produk untuk kedai ini.':'No products are available for this shop.';
  return ownProducts.slice(0,20).map(p=>p.name+': '+ringgit(p.price)).join('; ')+(ownProducts.length>20?' (more products available)':'');
 }
 if(/\b(stock|stok|inventory|inventori|habis|low|restock|reorder|barang)\b/.test(query)){
  const low=ownProducts.filter(p=>Number.isSafeInteger(p.qty)&&p.qty<=5&&p.qty>=0);
  if(!low.length)return ms?'Tiada stok rendah dalam data kedai ini.':'No low-stock products in this shop records.';
  return (ms?'Stok rendah: ':'Low stock: ')+low.map(p=>p.name+' ('+p.qty+')').join('; ');
 }
 return ms?'BOZ POS boleh menyemak stok, harga produk dan repair kedai yang dibenarkan. Fungsi AI penuh belum disambungkan.':'BOZ POS can check authorized shop stock, product prices and repairs. Full AI is not connected yet.';
}
