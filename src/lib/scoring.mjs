export function scoreQuiz(questions, answers){
 if(!Array.isArray(questions)||!Array.isArray(answers)||questions.length===0) throw new Error('Invalid quiz');
 const byId=new Map(answers.map(a=>[a.question_id,a.option_id]));
 const details=questions.map(q=>{
  const selected=byId.get(q.id)??null;
  const option=q.question_options.find(o=>o.id===selected);
  const correct=q.question_options.find(o=>o.is_correct);
  if(!correct) throw new Error('Question has no answer key');
  return {question_id:q.id,selected_option_id:option?.id??null,correct_option_id:correct.id,is_correct:!!option&&option.id===correct.id,question_snapshot:q.prompt,selected_snapshot:option?.label??null,correct_snapshot:correct.label,explanation_snapshot:q.explanation};
 });
 const correct=details.filter(d=>d.is_correct).length;
 return {score:correct,total:details.length,percentage:Math.round(100*correct/details.length),details};
}
