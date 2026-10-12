import React,{useMemo,useState,useEffect,useRef} from 'react';
import {SafeAreaView,View,Text,TextInput,Pressable,ScrollView,StyleSheet,Alert,Share} from 'react-native';
import {CameraView,useCameraPermissions} from 'expo-camera';
import {items,jobs,labels,money,ShopId,Item,Job} from './src/demo';
import {BozMobileApi,MobileSession} from './src/mobileApi';
import {addCartUnit,buildDraftReceipt} from './src/posDraft';
import {answerBozShopQuestion} from './src/bozAssistant';
type Tab='Cashier'|'Inventory'|'Repairs'|'BOZ AI'|'Settings';
const tabs:Tab[]=['Cashier','Inventory','Repairs','BOZ AI','Settings'];
const colors={bg:'#f3f7f7',ink:'#193034',teal:'#137d6d',white:'#fff',muted:'#64767a'};
function Btn({name,onPress}:{name:string,onPress:()=>void}){return <Pressable onPress={onPress} style={s.btn}><Text style={s.btnText}>{name}</Text></Pressable>}
export default function App(){
 const [shop,setShop]=useState<ShopId>('shop-a');const [tab,setTab]=useState<Tab>('Cashier');
 const [search,setSearch]=useState('');const [cart,setCart]=useState<Record<string,number>>({});
 const [scan,setScan]=useState(false);const [scanLock,setScanLock]=useState(false);
 const scanGuard=useRef(false);const [draftReceipt,setDraftReceipt]=useState('');
 const [permission,requestPermission]=useCameraPermissions();const [ask,setAsk]=useState('');

 const [answer,setAnswer]=useState('');const [adFree,setAdFree]=useState(false);
 const endpoint=process.env.EXPO_PUBLIC_BOZ_API_URL||'';
 const api=useMemo(()=>{try{return endpoint?new BozMobileApi(endpoint):null;}catch{return null;}},[endpoint]);
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');
 const [session,setSession]=useState<MobileSession|null>(null);
 const [activeShopId,setActiveShopId]=useState('');
 const [liveProducts,setLiveProducts]=useState<Item[]>([]);const [liveRepairs,setLiveRepairs]=useState<Job[]>([]);
 const [serverStatus,setServerStatus]=useState('No authenticated BOS server connected.');
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  if(!api||!session||!activeShopId)return;
  let cancelled=false;
  setLiveProducts([]);setLiveRepairs([]);setServerStatus('Loading shop records...');
  Promise.all([api.inventory(session,activeShopId),api.repairs(session,activeShopId)])
   .then(([ps,rs])=>{if(!cancelled){setLiveProducts(ps);setLiveRepairs(rs);setServerStatus('Read-only shop records loaded.');}})
   .catch(e=>{if(!cancelled){setLiveProducts([]);setLiveRepairs([]);setServerStatus(e instanceof Error?e.message:'Request failed');}});
  return()=>{cancelled=true;};
 },[api,session,activeShopId]);
 async function signIn(){
  if(!api)return;
  setBusy(true);
  try{
   const s=await api.signIn(email,password);
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
  setSession(null);setActiveShopId('');setLiveProducts([]);setLiveRepairs([]);
  setCart({});setDraftReceipt('');setPassword('');setSearch('');setAnswer('');setServerStatus('Disconnected.');
 }

 const own=useMemo(()=>session?liveProducts:items.filter(x=>x.shop===shop),[session,liveProducts,shop]);
 const ownRepairs=useMemo(()=>session?liveRepairs:jobs.filter(j=>j.shop===shop),[session,liveRepairs,shop]);
 const found=useMemo(()=>own.filter(x=>(x.name+' '+x.sku+' '+x.barcode).toLowerCase().includes(search.toLowerCase())),[own,search]);
 const total=own.reduce((sum,p)=>sum+(cart[p.id]||0)*p.price,0);
 function changeShop(){
  if(session){
   if(session.shops.length<2)return;
   const i=session.shops.findIndex(x=>x.id===activeShopId);
   setActiveShopId(session.shops[(i+1)%session.shops.length].id);
  }else{setShop(shop==='shop-a'?'shop-b':'shop-a');}
  setCart({});setDraftReceipt('');setSearch('');setAnswer('');
 }
 function add(p:Item){try{setCart(addCartUnit(cart,p,session?activeShopId:shop));setDraftReceipt('');}catch(e){Alert.alert('Cart restriction',e instanceof Error?e.message:'Cannot add product');}}
 function barcode(data:string){if(scanGuard.current)return;scanGuard.current=true;setScanLock(true);setScan(false);const p=own.find(x=>x.barcode===data||x.sku===data);if(p){add(p);setSearch(p.name);setTab('Cashier')}else{setSearch(data);setTab('Inventory');Alert.alert('Not found','Product unavailable in selected shop. No database edit was made.')}}
 function openScanner(){scanGuard.current=false;setScanLock(false);setScan(true);}
 function previewDraft(){try{const shopId=session?activeShopId:shop;const label=session?(session.shops.find(x=>x.id===shopId)?.name||'Assigned shop'):labels[shop];setDraftReceipt(buildDraftReceipt(own,cart,shopId,label));}catch(e){Alert.alert('Draft unavailable',e instanceof Error?e.message:'Cart validation failed');}}
 function row(label:string,value:string){return <View style={s.row}><Text style={s.body}>{label}</Text><Text style={s.strong}>{value}</Text></View>}
 return <SafeAreaView style={s.safe}>
 <View style={s.top}><View><Text style={s.small}>TELCOHAUZ · BUSINESS OS</Text><Text style={s.logo}>BOZ <Text style={{color:colors.teal}}>POS</Text></Text></View><Text style={s.chip}>{session?'API READ ONLY':'DEMO OFFLINE'}</Text></View>
 <Pressable onPress={changeShop} style={s.shop}><Text style={s.strong}>▣ {session?(session.shops.find(x=>x.id===activeShopId)?.name||'Assigned shop'):labels[shop]}</Text><Text style={s.link}>{session&&session.shops.length<2?'Assigned':'Switch shop ↗'}</Text></Pressable>
 {scan?<View style={{flex:1,padding:15}}><Text style={s.title}>Product scanner</Text>{!permission?<Text>Checking permission…</Text>:!permission.granted?<Btn name="Allow camera" onPress={()=>{void requestPermission()}}/>:<CameraView style={{flex:1,borderRadius:16,overflow:'hidden'}} facing="back" barcodeScannerSettings={{barcodeTypes:['ean13','ean8','code128','qr']}} onBarcodeScanned={scanLock?undefined:({data})=>barcode(data)}/>}<Btn name="Cancel" onPress={()=>setScan(false)}/></View>:
 <ScrollView style={{flex:1,padding:16}} keyboardShouldPersistTaps="handled">
 {tab==='Cashier'&&<><Text style={s.title}>New sale (preview)</Text><Text style={s.small}>No payment or database transactions</Text><Btn name="▣ Scan barcode using camera" onPress={openScanner}/><TextInput placeholder="Search product, SKU or barcode" style={s.input} value={search} onChangeText={setSearch}/>
 {found.map(p=><View key={p.id} style={s.card}>{row(p.name,money(p.price))}<Text style={s.small}>{p.sku} · {p.qty} available</Text><Btn name={'Add to sample cart +'+(cart[p.id]?' ('+cart[p.id]+')':'')} onPress={()=>add(p)}/></View>)}
 <View style={s.card}><Text style={s.strong}>Sample cart</Text>{own.filter(p=>cart[p.id]).map(p=>row(p.name+' × '+cart[p.id],money(p.price*cart[p.id])))}{row('Total',money(total))}<Text style={s.small}>Checkout intentionally disabled until secure BOS backend integration.</Text><Btn name="Preview receipt draft (no sale)" onPress={previewDraft}/>{draftReceipt?<View style={s.card}><Text style={s.body}>{draftReceipt}</Text><Btn name="Share draft only" onPress={()=>{void Share.share({message:draftReceipt})}}/></View>:null}<Btn name="Clear demo cart" onPress={()=>{setCart({});setDraftReceipt('')}}/></View></>}
 {tab==='Inventory'&&<><Text style={s.title}>Inventory · read only</Text><Text style={s.small}>Supplier costs and master products are edited ONLY on Admin Website</Text><TextInput style={s.input} placeholder="Search stock" value={search} onChangeText={setSearch}/>{found.map(p=><View style={s.card} key={p.id}>{row(p.name,money(p.price))}<Text style={s.small}>{p.sku} / {p.barcode} / Qty {p.qty}</Text></View>)}<Btn name="Camera scan" onPress={openScanner}/></>}
 {tab==='Repairs'&&<><Text style={s.title}>Repair tickets</Text>{ownRepairs.map(j=><View style={s.card} key={j.id}>{row(j.device,j.status)}<Text style={s.small}>{j.id} — {j.issue}</Text></View>)}<Text style={s.small}>Live repair changes require authenticated API permissions.</Text></>}
 {tab==='BOZ AI'&&<><Text style={s.title}>BOZ AI demo</Text><Text style={s.small}>{session?'No live AI connected.':'Rule-based sample helper, not a connected model.'}</Text><TextInput style={s.input} placeholder="Ask in Malay or English..." value={ask} onChangeText={setAsk}/><Btn name="Ask" onPress={()=>{const allowedShop=session?activeShopId:shop;setAnswer(session&&serverStatus!=='Read-only shop records loaded.'?'Data kedai belum tersedia / Shop records are not ready.':answerBozShopQuestion(allowedShop,own,ownRepairs,ask));setAsk('')}}/><View style={s.card}><Text style={s.strong}>BOZ</Text><Text style={s.body}>{answer||'Ask about stock, repairs or prices.'}</Text></View></>}
 {tab==='Settings'&&<><Text style={s.title}>Settings</Text>
 <View style={s.card}><Text style={s.strong}>BOS API connection</Text>
 <Text style={s.small}>Configured endpoint: {endpoint||'None — demo only'}</Text>
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
