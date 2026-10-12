/** Disabled until secure authenticated backend integration. Never place admin DB credentials in an APK. */
export async function authorizedRequest<T>(baseUrl:string,token:string,path:string):Promise<T>{
 if(!baseUrl.startsWith('https://'))throw new Error('HTTPS API URL required');
 if(!token)throw new Error('Valid scoped user session required');
 const response=await fetch(baseUrl.replace(/\/$/,'')+path,{headers:{Authorization:'Bearer '+token}});
 if(!response.ok)throw new Error('Backend denied the request');
 return response.json() as Promise<T>;
}
