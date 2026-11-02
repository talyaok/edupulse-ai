import {authenticate} from '@/lib/supabase';import {ok,fail} from '@/lib/responses';
export async function GET(req){try{const auth=await authenticate(req);if(!auth)return fail('Unauthorized',401);
const {admin}=auth;const id=new URL(req.url).searchParams.get('id');
if(id){const {data,error}=await admin.from('quizzes').select('id,title,course_id,questions(id,prompt,position,question_options(id,label,position))').eq('id',id).single();if(error)return fail(error.message,404);data.questions.sort((a,b)=>a.position-b.position);data.questions.forEach(q=>q.question_options.sort((a,b)=>a.position-b.position));return ok(data)}
const {data,error}=await admin.from('quizzes').select('id,title,course_id,courses(title)').order('title');if(error)throw error;return ok(data);
}catch(e){return fail(e.message,500)}}
