import { createClient } from '@supabase/supabase-js';
export function browserClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key) return null;
 return createClient(url,key);
}
export function adminClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key) throw new Error('Supabase server credentials are not configured');
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function authenticate(request){
 const token=request.headers.get('authorization')?.replace(/^Bearer\s+/i,'');
 if(!token) return null;
 const admin=adminClient();
 const {data,error}=await admin.auth.getUser(token);
 if(error||!data.user) return null;
 return {user:data.user,admin};
}
