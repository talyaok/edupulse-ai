import {authenticate} from '@/lib/supabase';import {ok,fail} from '@/lib/responses';
export async function GET(req){try{const auth=await authenticate(req);if(!auth)return fail('Unauthorized',401);const {admin,user}=auth;
const [a,s,e]=await Promise.all([admin.from('quiz_attempts').select('percentage,submitted_at').eq('user_id',user.id).order('submitted_at',{ascending:false}).limit(30),admin.from('learning_sessions').select('started_at,minutes_spent').eq('user_id',user.id).order('started_at',{ascending:false}).limit(30),admin.from('enrollments').select('progress_percent').eq('user_id',user.id)]);if(a.error||s.error||e.error)throw a.error||s.error||e.error;
const attempts=a.data,sessions=s.data,enrollments=e.data;const avg=attempts.length?Math.round(attempts.reduce((x,v)=>x+v.percentage,0)/attempts.length):null;const last=sessions[0]?.started_at||attempts[0]?.submitted_at;const days=last?Math.floor((Date.now()-new Date(last).getTime())/86400000):null;
const risk =
  days === null ? 'Not enough data' :
  days > 14 ? 'High' :
  days > 7 ? 'Moderate' :
  'Low';

const latestScore = attempts[0]?.percentage ?? null;
const previousScore = attempts[1]?.percentage ?? null;

const improvement =
  latestScore !== null && previousScore !== null
    ? latestScore - previousScore
    : null;
    
    const tips = [];

if (improvement !== null && improvement > 0) {
  tips.push(
    `Your latest quiz score improved by ${improvement} percentage points compared with your previous attempt. Great progress!`
  );
}

if (latestScore !== null && latestScore >= 70) {
  tips.push(
    'Your latest quiz result is strong. Keep practicing to maintain your progress.'
  );
}
if (latestScore !== null && latestScore < 70)tips.push('Review incorrect answers and retake a quiz after studying.');if(days!==null&&days>7)tips.push('Schedule a short learning session to rebuild momentum.');if(!attempts.length)tips.push('Take your first assessment to unlock score-based recommendations.');if(!sessions.length)tips.push('Start a learning session to track time on task.');if(!tips.length)tips.push('Keep practicing regularly and review your progress each week.');
let ai=null;if(process.env.OPENAI_API_KEY){try{const OpenAI=(await import('openai')).default;const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});const r=await client.chat.completions.create({model:'gpt-4o-mini',max_tokens:180,messages:[{role:'system',content:'Write 2 concise, supportive study recommendations grounded ONLY in supplied aggregate data. Do not invent courses, diagnoses, or student facts.'},{role:'user',content:JSON.stringify({averageQuizScore:avg,attemptCount:attempts.length,sessionCount:sessions.length,daysSinceLastActivity:days,averageCourseProgress:enrollments.length?Math.round(enrollments.reduce((x,v)=>x+v.progress_percent,0)/enrollments.length):null})}]});ai=r.choices[0]?.message?.content??null;}catch{}}
return ok({
    averageScore: avg,
    latestScore,
    improvement,
    daysSinceActivity: days,
    risk,
    tips,
    ai,
    disclaimer:
      'Engagement indicator based on recent activity; not a validated dropout prediction.'
  });
}catch(e){return fail(e.message,500)}}
