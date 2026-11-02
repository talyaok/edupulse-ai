import {authenticate} from '@/lib/supabase';import {ok,fail} from '@/lib/responses';
export async function GET(req){try{const auth=await authenticate(req);if(!auth)return fail('Unauthorized',401);const {admin,user}=auth;
const [enrollments,sessions,attempts]=await Promise.all([
 admin.from('enrollments').select('id,progress_percent,courses(id,title,description,topic)').eq('user_id',user.id),
 admin.from('learning_sessions').select('id,course_id,started_at,ended_at,minutes_spent').eq('user_id',user.id).order('started_at',{ascending:false}).limit(100),
 admin.from('quiz_attempts').select('id,quiz_id,score,total,percentage,submitted_at,quizzes(title)').eq('user_id',user.id).order('submitted_at',{ascending:false}).limit(100)
]);for(const r of [enrollments,sessions,attempts])if(r.error)throw r.error;
return ok({user:{id:user.id,email:user.email},enrollments:enrollments.data,sessions:sessions.data,attempts:attempts.data});}catch(e){return fail(e.message,500)}}
