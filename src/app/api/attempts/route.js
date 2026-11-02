import {authenticate} from '@/lib/supabase';import {scoreQuiz} from '@/lib/scoring.mjs';import {ok,fail} from '@/lib/responses';
export async function GET(req){try{const auth=await authenticate(req);if(!auth)return fail('Unauthorized',401);const id=new URL(req.url).searchParams.get('id');const {admin,user}=auth;if(!id)return fail('Missing id');const {data,error}=await admin.from('quiz_attempts').select('*,attempt_answers(*)').eq('id',id).eq('user_id',user.id).single();if(error)return fail('Attempt not found',404);return ok(data)}catch(e){return fail(e.message,500)}}
export async function POST(req){try{const auth=await authenticate(req);if(!auth)return fail('Unauthorized',401);const {admin,user}=auth;const {quiz_id,answers,submission_id}=await req.json();if(!quiz_id||!Array.isArray(answers)||!submission_id||!/^[-0-9a-f]{36}$/i.test(submission_id))return fail('Invalid submission');
const {data:questions,error:qerr}=await admin.from('questions').select('id,prompt,explanation,question_options(id,label,is_correct)').eq('quiz_id',quiz_id).order('position');if(qerr)throw qerr;
const result=scoreQuiz(questions,answers);
// One atomic PostgreSQL function inserts attempt + answer snapshots; submission_id makes retries idempotent.
const {data,error}=await admin.rpc('save_quiz_attempt',{p_user_id:user.id,p_quiz_id:quiz_id,p_submission_id:submission_id,p_score:result.score,p_total:result.total,p_percentage:result.percentage,p_answers:result.details});if(error)throw error;return ok({attempt_id:data,...result});
}catch(e){return fail(e.message,500)}}
