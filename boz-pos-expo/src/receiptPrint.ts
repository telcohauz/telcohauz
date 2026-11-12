/** Print only server-confirmed sales. Android print service handles supported printers.
 * The HTML is escaped to prevent product names from injecting markup.
 */
export function confirmedSalePrintHtml(saleId:string,summary:string):string{
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saleId))
  throw new Error('Confirmed sale UUID required');
 if(typeof summary!=='string'||!summary.includes('BOZ POS · SALE CONFIRMATION')||!summary.includes('Sale ID: '+saleId))
  throw new Error('Only a server-confirmed sale can be printed');
 const encoded=summary.slice(0,12000).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]||char));
 return '<!doctype html><html><head><meta charset="utf-8"><style>'+
  '@page{size:80mm auto;margin:5mm}body{font:11px monospace;color:#000;margin:5mm}pre{white-space:pre-wrap;overflow-wrap:anywhere}'+
  '</style></head><body><pre>'+encoded+'</pre></body></html>';
}
