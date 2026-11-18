import assert from "node:assert/strict";
import test from "node:test";
import { recommendServicePrice, mayPublishServicePrice } from "./service-pricing.ts";
const base = { serviceId:"screen-repair",serviceName:"Repair screen",partsCostSen:20000,labourCostSen:4000,overheadSen:1000,targetMarginPercent:20 };
test("price is transparent and cannot drop below the margin floor",()=>{
  const quote = recommendServicePrice(base);
  assert.equal(quote.costSen,25000);
  assert.equal(quote.floorSen,31250);
  assert.equal(quote.proposedSen,31250);
  assert.equal(quote.marketMedianSen,null);
  assert.equal(quote.status,"NEEDS_ADMIN_REVIEW");
});
test("unverified market prices cannot become assumed facts",()=>{
  const quote=recommendServicePrice({...base,marketSamplesSen:[35000,38000,39000]});
  assert.equal(quote.marketMedianSen,null);
  assert.equal(quote.marketSampleCount,0);
});
test("market evidence is optional and never bypasses minimum cost-based price",()=>{
  const marketEvidence=[1,2,3].map(x=>({source:"https://example.org/reference/"+x,checkedAt:"2026-11-18"}));
  const quote=recommendServicePrice({...base,marketSamplesSen:[26000,29000,30000],marketEvidence});
  assert.equal(quote.marketMedianSen,29000);
  assert.equal(quote.proposedSen,31250);
});
test("only verified admin approval permits publishing",()=>{
  const quote=recommendServicePrice(base);
  assert.equal(mayPublishServicePrice(quote,{authorizedAdmin:false,approvedSen:32000,verifiedCosts:true,approvalReference:"A1"}),false);
  assert.equal(mayPublishServicePrice(quote,{authorizedAdmin:true,approvedSen:30000,verifiedCosts:true,approvalReference:"A1"}),false);
  assert.equal(mayPublishServicePrice(quote,{authorizedAdmin:true,approvedSen:32000,verifiedCosts:false,approvalReference:"A1"}),false);
  assert.equal(mayPublishServicePrice(quote,{authorizedAdmin:true,approvedSen:32000,verifiedCosts:true,approvalReference:"A1"}),true);
});
test("invalid costs or margins rejected",()=>{
  for(const cost of [NaN,-1,2.5]) assert.throws(()=>recommendServicePrice({...base,partsCostSen:cost}));
  for(const margin of [-1,100,Infinity]) assert.throws(()=>recommendServicePrice({...base,targetMarginPercent:margin}));
});
