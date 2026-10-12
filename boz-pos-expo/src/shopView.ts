/** Prevent briefly rendering previous shop records during account switches or pending fetches. */
export function selectShopRecords<T extends {shop:string}>(activeShopId:string,loadedShopId:string,records:T[]):T[]{
 if(!activeShopId||!loadedShopId||activeShopId!==loadedShopId)return [];
 return records.filter(record=>record.shop===activeShopId);
}
