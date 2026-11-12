export type ShopId='shop-a'|'shop-b';
export type Item={id:string;shop:string;sku:string;barcode:string;name:string;price:number;qty:number};
export type Job={id:string;shop:string;device:string;issue:string;status:string};
export const labels:Record<ShopId,string>={'shop-a':'Telcohauz Demo Shop A','shop-b':'Example Shop B'};
export const items:Item[]=[
{id:'1',shop:'shop-a',sku:'A-CABLE',barcode:'9557000000001',name:'USB-C Cable',price:1500,qty:42},
{id:'2',shop:'shop-a',sku:'A-CASE',barcode:'9557000000002',name:'Phone Case',price:2500,qty:18},
{id:'3',shop:'shop-a',sku:'A-GLASS',barcode:'9557000000003',name:'Screen Protector',price:1000,qty:3},
{id:'4',shop:'shop-b',sku:'B-CABLE',barcode:'9557111111111',name:'USB-C Cable',price:1200,qty:7},
{id:'5',shop:'shop-b',sku:'B-CHARGER',barcode:'9557111111112',name:'Fast Charger',price:4500,qty:12}
];
export const jobs:Job[]=[
{id:'REP-001',shop:'shop-a',device:'Samsung A54',issue:'Screen',status:'In progress'},
{id:'REP-002',shop:'shop-a',device:'iPhone 13',issue:'Battery',status:'Pending'},
{id:'REP-003',shop:'shop-b',device:'Redmi Note',issue:'Charging',status:'Completed'}
];
export const money=(c:number)=>'RM '+(c/100).toFixed(2);
export function demoAnswer(shop:string,q:string){
 const txt=q.toLowerCase();const ps=items.filter(p=>p.shop===shop);
 if(/stock|stok|inventor|habis/.test(txt)){const l=ps.filter(p=>p.qty<=5);return l.length?l.map(x=>x.name+' ('+x.qty+')').join(', '):'No demo low-stock items.';}
 if(/repair|baiki|service/.test(txt))return jobs.filter(x=>x.shop===shop&&x.status!=='Completed').map(x=>x.id+' '+x.device).join('; ')||'No pending demo repairs.';
 if(/price|harga|product|produk/.test(txt))return ps.map(x=>x.name+' '+money(x.price)).join('; ');
 return 'BOZ Demo: ask about stock, repairs, or product prices. Real AI and shop records are not connected.';
}
