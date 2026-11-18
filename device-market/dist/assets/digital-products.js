'use strict';

const shopifyDigital = {
 endpoint:'https://telcounlock.myshopify.com/api/2026-10/graphql.json',
 collectionHandle:'produk-digital'
};

const digitalCollectionQuery = `
 query DigitalCollection($handle: String!, $after: String) @inContext(country: MY) {
  collection(handle: $handle) {
   products(first: 30, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes {
     handle title description onlineStoreUrl availableForSale
     featuredImage { url altText }
     priceRange { minVariantPrice { amount currencyCode } }
    }
   }
  }
 }`;

async function fetchDigitalProducts(after=null){
 const response=await fetch(shopifyDigital.endpoint,{
  method:'POST',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({query:digitalCollectionQuery,variables:{handle:shopifyDigital.collectionHandle,after}}),
  signal:AbortSignal.timeout(12000)
 });
 const body=await response.json();
 if(!response.ok||body.errors?.length)throw Error('Shopify storefront unavailable');
 return body.data?.collection?.products||null;
}
