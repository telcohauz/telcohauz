import React,{useMemo,useState,useEffect,useRef} from 'react';
import {SafeAreaView,View,Text,TextInput,Pressable,ScrollView,StyleSheet,Alert,Share} from 'react-native';
import {CameraView,useCameraPermissions} from 'expo-camera';
import * as Crypto from 'expo-crypto';
import {items,jobs,labels,money,ShopId,Item,Job} from './src/demo';
import {BozMobileApi,MobileSession} from './src/mobileApi';
import {BozSupabaseApi} from './src/supabaseMobile';
import {BOZ_SUPABASE_URL,BOZ_PUBLISHABLE_KEY} from './src/bozConfig';
import {addCartUnit,buildDraftReceipt,cartLines} from './src/posDraft';
import {answerBozShopQuestion} from './src/bozAssistant';
import {selectShopRecords} from './src/shopView';
type Tab='Cashier'|'Inventory'|'Repairs'|'BOZ AI'|'Settings';
const tabs:Tab[]=['Cashier','Inventory','Repairs','BOZ AI','Settings'];
const colors={bg:'#f3f7f7',ink:'#193034',teal:'#137d6d',white:'#fff',muted:'#64767a'};
function Btn({name,onPress}:{name:string,onPress:()=>void}){return <Pressable onPress={onPress} style={s.btn}><Text style={s.btnText}>{name}</Text></Pressable>}
export default function App(){
 const [shop,setShop]=useState<ShopId>('shop-a');const [tab,setTab]=useState<Tab>('Cashier');
 const [search,setSearch]=useState('');const [cart,setCart]=useState<Record<string,number>>({});
 const [scan,setScan]=useState(false);const [scanLock,setScanLock]=useState(false);
 const scanGuard=useRef(false);const [draftReceipt,setDraftReceipt]=useState('');
 const pendingCheckoutKey=useRef<string|null>(null);const checkoutGuard=useRef(false);const [confirmedSaleId,setConfirmedSaleId]=useState('');
 const [permission,requestPermission]=useCameraPermissions();const [ask,setAsk]=useState('');

 const [answer,setAnswer]=useState('');const [adFree,setAdFree]=useState(false);
 const endpoint=process.env.EXPO_PUBLIC_BOZ_API_URL||'';
 const supabaseUrl=process.env.EXPO_PUBLIC_BOZ_SUPABASE_URL||BOZ_SUPABASE_URL;
 const supabaseKey=process.env.EXPO_PUBLIC_BOZ_SUPABASE_KEY||BOZ_PUBLISHABLE_KEY;
 const api=useMemo(()=>{try{return supabaseUrl&&supabaseKey?new BozSupabaseApi(supabaseUrl,supabaseKey):endpoint?new BozMobileApi(endpoint):null;}catch{return null;}},[endpoint,supabaseUrl,supabaseKey]);
 const isLiveMode=Boolean(supabaseUrl&&supabaseKey);
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');
 const [session,setSession]=useState<MobileSession|null>(null);
 const [activeShopId,setActiveShopId]=useState('');
 const [liveProducts,setLiveProducts]=useState<Item[]>([]);const [liveRepairs,setLiveRepairs]=useState<Job[]>([]);
 const [loadedShopId,setLoadedShopId]=useState('');
 const [serverStatus,setServerStatus]=useState('No authenticated BOS server connected.');
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  if(!api||!session||!activeShopId)return;
  let cancelled=false;
  setLiveProducts([]);setLiveRepairs([]);setLoadedShopId('');setServerStatus('Loading shop records...');
  Promise.all([api.inventory(session,activeShopId),api.repairs(session,activeShopId)])
   .then(([ps,rs])=>{if(!cancelled){setLiveProducts(ps);setLiveRepairs(rs);setLoadedShopId(activeShopId);setServerStatus('Read-only shop records loaded.');}})
   .catch(e=>{if(!cancelled){setLiveProducts([]);setLiveRepairs([]);setLoadedShopId('');setServerStatus(e instanceof Error?e.message:'Request failed');}});
  return()=>{cancelled=true;};
 },[api,session,activeShopId]);
 async function signIn(){
  if(!api)return;
  setBusy(true);
  try{
   const s=await api.signIn(email,password);
   setLiveProducts([]);setLiveRepairs([]);setLoadedShopId('');setAnswer('');
   setSession(s);setActiveShopId(s.shops[0].id);setPassword('');setSearch('');setCart({});
   setServerStatus('Authenticated. Loading authorized shop data...');
  }catch(e){setServerStatus('Login failed: '+(e instanceof Error?e.message:'Unknown error'));}
  finally{setBusy(false);}
 }
 async function health(){
  if(!api){setServerStatus('Backend is not configured in this build.');return;}
  setBusy(true);
  try{setServerStatus(await api.health());}
  catch(e){setServerStatus(e instanceof Error?e.message:'Health check failed');}
  finally{setBusy(false);}
 }
 function signOut(){
  if(checkoutGuard.current||pendingCheckoutKey.current){Alert.alert('Pending cash sale','Resolve the pending transaction before signing out. Check the Admin sales list or retry the same sale.');return;}
  setSession(null);setActiveShopId('');setLiveProducts([]);setLiveRepairs([]);setLoadedShopId('');
  setCart({});setDraftReceipt('');setConfirmedSaleId('');pendingCheckoutKey.current=null;setPassword('');setSearch('');setAnswer('');setServerStatus('Disconnected.');
 }

 const own=useMemo(()=>session?selectShopRecords(activeShopId,loadedShopId,liveProducts):isLiveMode?[]:items.filter(x=>x.shop===shop),[session,activeShopId,loadedShopId,liveProducts,shop,isLiveMode]);
 const ownRepairs=useMemo(()=>session?selectShopRecords(activeShopId,loadedShopId,liveRepairs):isLiveMode?[]:jobs.filter(j=>j.shop===shop),[session,activeShopId,loadedShopId,liveRepairs,shop,isLiveMode]);
 const found=useMemo(()=>own.filter(x=>(x.name+' '+x.sku+' '+x.barcode).toLowerCase().includes(search.toLowerCase())),[own,search]);
 const total=own.reduce((sum,p)=>sum+(cart[p.id]||0)*p.price,0);
 const role=session?.shops.find(s=>s.id===activeShopId)?.role||'';
 const mayCheckout=session&&api instanceof BozSupabaseApi&&['OWNER','ADMIN','CASHIER'].includes(role);
 const mayRepair=session&&api instanceof BozSupabaseApi&&['OWNER','ADMIN','TECHNICIAN'].includes(role);
 function changeShop(){
  if(pendingCheckoutKey.current){Alert.alert('Pending sale','Resolve the previous sale before changing shops.');return;}
  if(session){
   if(session.shops.length<2)return;
   const i=session.shops.findIndex(x=>x.id===activeShopId);
   setLiveProducts([]);setLiveRepairs([]);setLoadedShopId('');
   setActiveShopId(session.shops[(i+1)%session.shops.length].id);
  }else{setShop(shop==='shop-a'?'shop-b':'shop-a');}
  setCart({});setDraftReceipt('');setConfirmedSaleId('');setSearch('');setAnswer('');
 }
 function add(p:Item){if(pendingCheckoutKey.current){Alert.alert('Pending sale','Retry or verify the pending cash sale before changing this cart.');return;}try{setCart(addCartUnit(cart,p,session?activeShopId:shop));setDraftReceipt('');setConfirmedSaleId('');}catch(e){Alert.alert('Cart restriction',e instanceof Error?e.message:'Cannot add product');}}
 function barcode(data:string){if(scanGuard.current)return;scanGuard.current=true;setScanLock(true);setScan(false);const p=own.find(x=>x.barcode===data||x.sku===data);if(p){add(p);setSearch(p.name);setTab('Cashier')}else{setSearch(data);setTab('Inventory');Alert.alert('Not found','Product unavailable in selected shop. No database edit was made.')}}
 function openScanner(){scanGuard.current=false;setScanLock(false);setScan(true);}
 function previewDraft(){try{const shopId=session?activeShopId:shop;const label=session?(session.shops.find(x=>x.id===shopId)?.name||'Assigned shop'):labels[shop];setDraftReceipt(buildDraftReceipt(own,cart,shopId,label));}catch(e){Alert.alert('Draft unavailable',e instanceof Error?e.message:'Cart validation failed');}}
 function clearCart(){if(pendingCheckoutKey.current){Alert.alert('Sale status unresolved','Do not discard a pending sale. Retry using the same key or check BOZ Admin sales.');return;}setCart({});setDraftReceipt('');setConfirmedSaleId('');}
 async function advanceRepair(repairId:string,nextStatus:string){
  if(!mayRepair||!session||!(api instanceof BozSupabaseApi)||!activeShopId||busy)return;
  setBusy(true);
  try{
   await api.updateRepair(session,activeShopId,repairId,nextStatus);
   setLiveRepairs(await api.repairs(session,activeShopId));
   setServerStatus('Repair ticket updated: '+nextStatus);
  }catch(e){Alert.alert('Repair not changed',e instanceof Error?e.message:'Operation rejected');}
  finally{setBusy(false);}
 }
 async function saveCashSale(){
  if(checkoutGuard.current||!session||!(api instanceof BozSupabaseApi)||!activeShopId)return;
  if(loadedShopId!==activeShopId){Alert.alert('Shop is loading','Wait until authorized shop records are ready.');return;}
  let lines;
  try{lines=cartLines(own,cart,activeShopId);if(!lines.length)throw Error('Add products first');}
  catch(e){Alert.alert('Cart validation',e instanceof Error?e.message:'Invalid cart');return;}
  const key=pendingCheckoutKey.current||Crypto.randomUUID();
  pendingCheckoutKey.current=key;checkoutGuard.current=true;setBusy(true);
  try{
   const receipt=await api.submitCashSale(session,activeShopId,key,lines.map(x=>({productId:x.id,quantity:x.quantity})));
   const name=session.shops.find(x=>x.id===activeShopId)?.name||'Authorized shop';
   const msg=['BOZ POS · SALE CONFIRMATION','NOT A TAX INVOICE',
    'Shop: '+name,'Sale ID: '+receipt.saleId,'Paid cash: '+money(receipt.totalCents),
    receipt.replayed?'Recovered an already recorded sale.':'Payment recorded in BOZ.',
    'Receipt printer verification pending.'].join('\n');
   pendingCheckoutKey.current=null;setCart({});setDraftReceipt(msg);setConfirmedSaleId(receipt.saleId);
   setServerStatus('Cash sale recorded: '+receipt.saleId);
   try{const records=await api.inventory(session,activeShopId);setLiveProducts(records);}
   catch{setLiveProducts([]);setServerStatus('Sale saved. Reload stock from BOZ before next transaction.');}
  }catch(e){
   setServerStatus('Sale confirmation uncertain. Retry using the same transaction key or verify in Admin Website.');
   Alert.alert('Sale not confirmed', (e instanceof Error?e.message:'Connection error')+'\nRetry uses the same transaction key; do not create a new sale until reconciled.');
  }finally{checkoutGuard.current=false;setBusy(false);}
 }
 function askCashConfirmation(){
  if(!mayCheckout||busy||!Object.values(cart).some(v=>v>0))return;
  if(pendingCheckoutKey.current){void saveCashSale();return;}
  Alert.alert('Confirm CASH received','Only confirm after collecting the cash. BOZ will save a real sale and reduce shop inventory.',
   [{text:'Cancel',style:'cancel'},{text:'Cash received — save sale',onPress:()=>{void saveCashSale()}}]);
 }
 function row(label:string,value:string){return <View style={s.row}><Text style={s.body}>{label}</Text><Text style={s.strong}>{value}</Text></View>}
 if(isLiveMode&&!session)return <SafeAreaView style={s.safe}>
  <View style={s.top}><View><Text style={s.small}>TELCOHAUZ BOZ · PRODUCTION BACKEND</Text><Text style={s.logo}>BOZ <Text style={{color:colors.teal}}>POS</Text></Text></View><Text style={s.chip}>LOGIN REQUIRED</Text></View>
  <ScrollView contentContainerStyle={{padding:20}} keyboardShouldPersistTaps="handled">
   <View style={s.card}><Text style={s.title}>Staff Login</Text>
    <Text style={s.small}>Sign in with your assigned Telcohauz BOZ shop account. No demo data or sales are shown without authentication.</Text>
    <TextInput style={s.input} placeholder="Staff email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}/>
    <TextInput style={s.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword}/>
    <Btn name={busy?'Verifying...':'Login to Telcohauz BOZ'} onPress={()=>{if(!busy)void signIn()}}/>
    <Btn name="Check backend connection" onPress={()=>{if(!busy)void health()}}/>
    <Text style={s.small}>{serverStatus}</Text>
    <Text style={s.small}>Account and shop membership are managed through the central BOZ Admin Website.</Text>
   </View>
  </ScrollView>
 </SafeAreaView>;
 return <SafeAreaView style={s.safe}>
 <View style={s.top}><View><Text style={s.small}>TELCOHAUZ · BUSINESS OS</Text><Text style={s.logo}>BOZ <Text style={{color:colors.teal}}>POS</Text></Text></View><Text style={s.chip}>{session?'BOZ CLOUD • AUTHENTICATED':'NO LIVE SESSION'}</Text></View>
 <Pressable onPress={changeShop} style={s.shop}><Text style={s.strong}>▣ {session?(session.shops.find(x=>x.id===activeShopId)?.name||'Assigned shop'):labels[shop]}</Text><Text style={s.link}>{session&&session.shops.length<2?'Assigned':'Switch shop ↗'}</Text></Pressable>
 {scan?<View style={{flex:1,padding:15}}><Text style={s.title}>Product scanner</Text>{!permission?<Text>Checking permission…</Text>:!permission.granted?<Btn name="Allow camera" onPress={()=>{void requestPermission()}}/>:<CameraView style={{flex:1,borderRadius:16,overflow:'hidden'}} facing="back" barcodeScannerSettings={{barcodeTypes:['ean13','ean8','code128','qr']}} onBarcodeScanned={scanLock?undefined:({data})=>barcode(data)}/>}<Btn name="Cancel" onPress={()=>setScan(false)}/></View>:
 <ScrollView style={{flex:1,padding:16}} keyboardShouldPersistTaps="handled">
 {tab==='Cashier'&&<><Text style={s.title}>Cash Sales</Text><Text style={s.small}>Authenticated shop cash checkout. Confirm cash receipt before submitting the sale.</Text><Btn name="▣ Scan barcode using camera" onPress={openScanner}/><TextInput placeholder="Search product, SKU or barcode" style={s.input} value={search} onChangeText={setSearch}/>
 {found.map(p=><View key={p.id} style={s.card}>{row(p.name,money(p.price))}<Text style={s.small}>{p.sku} · {p.qty} available</Text><Btn name={'Add to sample cart +'+(cart[p.id]?' ('+cart[p.id]+')':'')} onPress={()=>add(p)}/></View>)}
 <View style={s.card}><Text style={s.strong}>Cart</Text>{own.filter(p=>cart[p.id]).map(p=>row(p.name+' × '+cart[p.id],money(p.price*cart[p.id])))}{row('Estimate',money(total))}<Text style={s.small}>BOZ server calculates the authoritative sale total and stock deduction. Cash sale requires cashier confirmation.</Text>{mayCheckout?<Btn name={busy?'Saving...':pendingCheckoutKey.current?'Retry pending cash sale':'Confirm cash received & record sale'} onPress={askCashConfirmation}/>:null}<Btn name="Preview unsaved draft" onPress={previewDraft}/>{draftReceipt?<View style={s.card}><Text style={s.body}>{draftReceipt}</Text><Btn name={confirmedSaleId?'Share confirmed sale summary':'Share draft only'} onPress={()=>{void Share.share({message:draftReceipt})}}/></View>:null}<Btn name="Clear cart" onPress={clearCart}/></View></>}
 {tab==='Inventory'&&<><Text style={s.title}>Inventory · read only</Text><Text style={s.small}>Supplier costs and master products are edited ONLY on Admin Website</Text><TextInput style={s.input} placeholder="Search stock" value={search} onChangeText={setSearch}/>{found.map(p=><View style={s.card} key={p.id}>{row(p.name,money(p.price))}<Text style={s.small}>{p.sku} / {p.barcode} / Qty {p.qty}</Text></View>)}<Btn name="Camera scan" onPress={openScanner}/></>}
 {tab==='Repairs'&&<><Text style={s.title}>Repair tickets</Text>{ownRepairs.map(j=><View style={s.card} key={j.id}>{row(j.device,j.status)}<Text style={s.small}>{j.id} — {j.issue}</Text>{mayRepair&&j.status!=='COMPLETED'&&j.status!=='CANCELLED'?<Btn name={j.status==='READY'?'Mark completed':'Move to next repair stage'} onPress={()=>{const next=j.status==='PENDING'?'IN_PROGRESS':j.status==='IN_PROGRESS'?'READY':'COMPLETED';Alert.alert('Confirm repair status','Update ticket to '+next+'?', [{text:'Cancel',style:'cancel'},{text:'Confirm update',onPress:()=>{void advanceRepair(j.id,next)}}])}}/>:null}</View>)}<Text style={s.small}>Live repair changes require authenticated API permissions.</Text></>}
 {tab==='BOZ AI'&&<><Text style={s.title}>BOZ Assistant</Text><Text style={s.small}>{session?'No live AI connected.':'Rule-based sample helper, not a connected model.'}</Text><TextInput style={s.input} placeholder="Ask in Malay or English..." value={ask} onChangeText={setAsk}/><Btn name="Ask" onPress={()=>{const allowedShop=session?activeShopId:shop;setAnswer(session&&(loadedShopId!==activeShopId||serverStatus!=='Read-only shop records loaded.')?'Data kedai belum tersedia / Shop records are not ready.':answerBozShopQuestion(allowedShop,own,ownRepairs,ask));setAsk('')}}/><View style={s.card}><Text style={s.strong}>BOZ</Text><Text style={s.body}>{answer||'Ask about stock, repairs or prices.'}</Text></View></>}
 {tab==='Settings'&&<><Text style={s.title}>Settings</Text>
 <View style={s.card}><Text style={s.strong}>BOS API connection</Text>
 <Text style={s.small}>Configured BOZ endpoint: {supabaseUrl||endpoint||'None — demo only'}</Text>
 <Text style={s.small}>{serverStatus}</Text>
 <Btn name="Check API health" onPress={()=>{if(!busy)void health()}}/>
 {!session&&api&&<>
 <TextInput style={s.input} placeholder="Staff email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}/>
 <TextInput style={s.input} placeholder="Password (memory only)" secureTextEntry value={password} onChangeText={setPassword}/>
 <Btn name={busy?'Working...':'Sign in to verified BOS API'} onPress={()=>{if(!busy)void signIn()}}/>
 </>}
 {session&&<><Text style={s.small}>Authorized shops: {session.shops.map(x=>x.name).join(', ')}</Text><Btn name="Disconnect and clear token" onPress={signOut}/></>}
 <Text style={s.small}>Use only an independently verified HTTPS BOS server. Passwords and tokens are not saved on your device.</Text>
 </View><View style={s.card}><Text style={s.strong}>Ad removal preview</Text><Text style={s.small}>Local UI preview only. No subscription payment or ad network.</Text><Btn name={adFree?'Switch to free with banner':'Preview ad-free'} onPress={()=>setAdFree(!adFree)}/></View><View style={s.card}><Text style={s.strong}>Integrations</Text><Text style={s.small}>Bluetooth printing: pending hardware validation</Text><Text style={s.small}>AI historical migration: Admin Website only</Text><Text style={s.small}>Backend/API: {session?'Read-only session':'Disconnected demo'}</Text></View></>}
 {!adFree && tab==='Settings' && <View style={s.ad}><Text style={s.small}>ADVERTISEMENT · PLACEHOLDER (NO REAL ADS)</Text></View>}
 </ScrollView>}
 <View style={s.nav}>{tabs.map(t=><Pressable key={t} onPress={()=>{setTab(t);setSearch('');setScan(false)}} style={[s.navItem,tab===t&&s.navActive]}><Text style={[s.navText,tab===t&&{color:colors.teal}]}>{t}</Text></Pressable>)}</View>
 </SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:colors.bg},top:{backgroundColor:colors.white,padding:17,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},small:{color:colors.muted,fontSize:11,lineHeight:18},logo:{fontSize:27,fontWeight:'900',color:colors.ink},chip:{fontSize:9,color:colors.teal,fontWeight:'800'},shop:{padding:17,backgroundColor:'#e8f5ef',flexDirection:'row',justifyContent:'space-between'},strong:{fontWeight:'800',color:colors.ink,fontSize:13},link:{color:colors.teal,fontSize:12},title:{fontSize:25,fontWeight:'900',color:colors.ink,marginBottom:8},input:{backgroundColor:colors.white,borderWidth:1,borderColor:'#d9e4e5',borderRadius:9,marginTop:12,padding:13},card:{padding:15,borderRadius:12,marginVertical:8,backgroundColor:colors.white},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginVertical:5,gap:8},body:{color:colors.ink,fontSize:13,flexShrink:1},btn:{padding:12,backgroundColor:colors.teal,borderRadius:8,marginTop:12,alignItems:'center'},btnText:{fontSize:13,fontWeight:'800',color:colors.white},nav:{flexDirection:'row',padding:8,backgroundColor:colors.white},navItem:{flex:1,paddingVertical:13,alignItems:'center'},navActive:{backgroundColor:'#e9f5f1',borderRadius:8},navText:{fontSize:9,fontWeight:'700',color:colors.muted},ad:{borderStyle:'dashed',borderWidth:1,borderColor:'#c6d5d7',padding:13,alignItems:'center',marginTop:10}})
