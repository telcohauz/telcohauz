import React,{useMemo,useState} from 'react';
import {SafeAreaView,View,Text,TextInput,Pressable,ScrollView,StyleSheet,Alert} from 'react-native';
import {CameraView,useCameraPermissions} from 'expo-camera';
import {items,jobs,labels,money,demoAnswer,ShopId,Item} from './src/demo';
type Tab='Cashier'|'Inventory'|'Repairs'|'BOZ AI'|'Settings';
const tabs:Tab[]=['Cashier','Inventory','Repairs','BOZ AI','Settings'];
const colors={bg:'#f3f7f7',ink:'#193034',teal:'#137d6d',white:'#fff',muted:'#64767a'};
function Btn({name,onPress}:{name:string,onPress:()=>void}){return <Pressable onPress={onPress} style={s.btn}><Text style={s.btnText}>{name}</Text></Pressable>}
export default function App(){
 const [shop,setShop]=useState<ShopId>('shop-a');const [tab,setTab]=useState<Tab>('Cashier');
 const [search,setSearch]=useState('');const [cart,setCart]=useState<Record<string,number>>({});
 const [scan,setScan]=useState(false);const [scanLock,setScanLock]=useState(false);
 const [permission,requestPermission]=useCameraPermissions();const [ask,setAsk]=useState('');
 const [answer,setAnswer]=useState('');const [adFree,setAdFree]=useState(false);
 const own=useMemo(()=>items.filter(x=>x.shop===shop),[shop]);
 const found=useMemo(()=>own.filter(x=>(x.name+' '+x.sku+' '+x.barcode).toLowerCase().includes(search.toLowerCase())),[own,search]);
 const total=own.reduce((sum,p)=>sum+(cart[p.id]||0)*p.price,0);
 function changeShop(){setShop(shop==='shop-a'?'shop-b':'shop-a');setCart({});setSearch('');setAnswer('');}
 function add(p:Item){if((cart[p.id]||0)>=p.qty){Alert.alert('Demo limit','Insufficient sample stock');return;}setCart(c=>({...c,[p.id]:(c[p.id]||0)+1}));}
 function barcode(data:string){if(scanLock)return;setScanLock(true);setScan(false);const p=own.find(x=>x.barcode===data||x.sku===data);if(p){add(p);setSearch(p.name);setTab('Cashier')}else{setSearch(data);setTab('Inventory');Alert.alert('Not found','Not found in selected demo shop. No database edit was made.')}}
 function row(label:string,value:string){return <View style={s.row}><Text style={s.body}>{label}</Text><Text style={s.strong}>{value}</Text></View>}
 return <SafeAreaView style={s.safe}>
 <View style={s.top}><View><Text style={s.small}>TELCOHAUZ · BUSINESS OS</Text><Text style={s.logo}>BOZ <Text style={{color:colors.teal}}>POS</Text></Text></View><Text style={s.chip}>DEMO OFFLINE</Text></View>
 <Pressable onPress={changeShop} style={s.shop}><Text style={s.strong}>▣ {labels[shop]}</Text><Text style={s.link}>Switch shop ↗</Text></Pressable>
 {scan?<View style={{flex:1,padding:15}}><Text style={s.title}>Product scanner</Text>{!permission?<Text>Checking permission…</Text>:!permission.granted?<Btn name="Allow camera" onPress={()=>{void requestPermission()}}/>:<CameraView style={{flex:1,borderRadius:16,overflow:'hidden'}} facing="back" barcodeScannerSettings={{barcodeTypes:['ean13','ean8','code128','qr']}} onBarcodeScanned={scanLock?undefined:({data})=>barcode(data)}/>}<Btn name="Cancel" onPress={()=>setScan(false)}/></View>:
 <ScrollView style={{flex:1,padding:16}} keyboardShouldPersistTaps="handled">
 {tab==='Cashier'&&<><Text style={s.title}>New sale (preview)</Text><Text style={s.small}>No payment or database transactions</Text><Btn name="▣ Scan barcode using camera" onPress={()=>{setScanLock(false);setScan(true)}}/><TextInput placeholder="Search product, SKU or barcode" style={s.input} value={search} onChangeText={setSearch}/>
 {found.map(p=><View key={p.id} style={s.card}>{row(p.name,money(p.price))}<Text style={s.small}>{p.sku} · {p.qty} available</Text><Btn name={'Add to sample cart +'+(cart[p.id]?' ('+cart[p.id]+')':'')} onPress={()=>add(p)}/></View>)}
 <View style={s.card}><Text style={s.strong}>Sample cart</Text>{own.filter(p=>cart[p.id]).map(p=>row(p.name+' × '+cart[p.id],money(p.price*cart[p.id])))}{row('Total',money(total))}<Text style={s.small}>Checkout intentionally disabled until secure BOS backend integration.</Text><Btn name="Clear demo cart" onPress={()=>setCart({})}/></View></>}
 {tab==='Inventory'&&<><Text style={s.title}>Inventory · read only</Text><Text style={s.small}>Supplier costs and master products are edited ONLY on Admin Website</Text><TextInput style={s.input} placeholder="Search stock" value={search} onChangeText={setSearch}/>{found.map(p=><View style={s.card} key={p.id}>{row(p.name,money(p.price))}<Text style={s.small}>{p.sku} / {p.barcode} / Qty {p.qty}</Text></View>)}<Btn name="Camera scan" onPress={()=>{setScanLock(false);setScan(true)}}/></>}
 {tab==='Repairs'&&<><Text style={s.title}>Repair tickets</Text>{jobs.filter(j=>j.shop===shop).map(j=><View style={s.card} key={j.id}>{row(j.device,j.status)}<Text style={s.small}>{j.id} — {j.issue}</Text></View>)}<Text style={s.small}>Live repair changes require authenticated API permissions.</Text></>}
 {tab==='BOZ AI'&&<><Text style={s.title}>BOZ AI demo</Text><Text style={s.small}>Rule-based sample helper, not a connected model.</Text><TextInput style={s.input} placeholder="Ask in Malay or English..." value={ask} onChangeText={setAsk}/><Btn name="Ask" onPress={()=>{setAnswer(demoAnswer(shop,ask));setAsk('')}}/><View style={s.card}><Text style={s.strong}>BOZ</Text><Text style={s.body}>{answer||'Ask about stock, repairs or prices.'}</Text></View></>}
 {tab==='Settings'&&<><Text style={s.title}>Settings</Text><View style={s.card}><Text style={s.strong}>Ad removal preview</Text><Text style={s.small}>Local UI preview only. No subscription payment or ad network.</Text><Btn name={adFree?'Switch to free with banner':'Preview ad-free'} onPress={()=>setAdFree(!adFree)}/></View><View style={s.card}><Text style={s.strong}>Integrations</Text><Text style={s.small}>Bluetooth printing: pending hardware validation</Text><Text style={s.small}>AI historical migration: Admin Website only</Text><Text style={s.small}>Backend/API: disconnected demo</Text></View></>}
 {!adFree && tab==='Settings' && <View style={s.ad}><Text style={s.small}>ADVERTISEMENT · PLACEHOLDER (NO REAL ADS)</Text></View>}
 </ScrollView>}
 <View style={s.nav}>{tabs.map(t=><Pressable key={t} onPress={()=>{setTab(t);setSearch('');setScan(false)}} style={[s.navItem,tab===t&&s.navActive]}><Text style={[s.navText,tab===t&&{color:colors.teal}]}>{t}</Text></Pressable>)}</View>
 </SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:colors.bg},top:{backgroundColor:colors.white,padding:17,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},small:{color:colors.muted,fontSize:11,lineHeight:18},logo:{fontSize:27,fontWeight:'900',color:colors.ink},chip:{fontSize:9,color:colors.teal,fontWeight:'800'},shop:{padding:17,backgroundColor:'#e8f5ef',flexDirection:'row',justifyContent:'space-between'},strong:{fontWeight:'800',color:colors.ink,fontSize:13},link:{color:colors.teal,fontSize:12},title:{fontSize:25,fontWeight:'900',color:colors.ink,marginBottom:8},input:{backgroundColor:colors.white,borderWidth:1,borderColor:'#d9e4e5',borderRadius:9,marginTop:12,padding:13},card:{padding:15,borderRadius:12,marginVertical:8,backgroundColor:colors.white},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginVertical:5,gap:8},body:{color:colors.ink,fontSize:13,flexShrink:1},btn:{padding:12,backgroundColor:colors.teal,borderRadius:8,marginTop:12,alignItems:'center'},btnText:{fontSize:13,fontWeight:'800',color:colors.white},nav:{flexDirection:'row',padding:8,backgroundColor:colors.white},navItem:{flex:1,paddingVertical:13,alignItems:'center'},navActive:{backgroundColor:'#e9f5f1',borderRadius:8},navText:{fontSize:9,fontWeight:'700',color:colors.muted},ad:{borderStyle:'dashed',borderWidth:1,borderColor:'#c6d5d7',padding:13,alignItems:'center',marginTop:10}})
