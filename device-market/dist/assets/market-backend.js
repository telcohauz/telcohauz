'use strict';

// Set the project URL and the publishable key once a dedicated project is provisioned.
const marketBackendConfig={url:'https://rkxcioziaxrbqqpduunq.supabase.co',publishableKey:'sb_publishable_HXUsM7CAout7NUvpyT_z4g_O0uHs7HN'};
const marketBackend=(()=>{
 const {url,publishableKey}=marketBackendConfig;
 const configured=/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url)&&Boolean(publishableKey);
 let session=null;
 async function call(path,body,method=body?'POST':'GET',prefer){
  if(!configured)throw Error('Supabase belum disambungkan / Supabase is disconnected');
  const headers={apikey:publishableKey};
  if(session)headers.Authorization='Bearer '+session.access_token;
  if(body)headers['Content-Type']='application/json';
  if(prefer)headers.Prefer=prefer;
  const response=await fetch(url+path,{method,headers,body:body?JSON.stringify(body):undefined});
  if(response.status===401)session=null;
  if(!response.ok)throw Error(response.status===401?'Log masuk semula / Sign in again':'Permintaan tidak berjaya / Request failed');
  return response.status===204?null:response.json();
 }
 return {
  configured,
  user:()=>session?.user,
  async login(email,password){session=await call('/auth/v1/token?grant_type=password',{email,password});},
  signup:(email,password)=>call('/auth/v1/signup',{email,password}),
  logout(){session=null;},
  read:(table,query)=>call('/rest/v1/'+table+'?'+query),
  insert:(table,body)=>call('/rest/v1/'+table,body,'POST','return=minimal'),
  rpc:(name,args)=>call('/rest/v1/rpc/'+name,args)
 };
})();
