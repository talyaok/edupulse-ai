import test from 'node:test';import assert from 'node:assert/strict';import {scoreQuiz} from '../src/lib/scoring.mjs';
const q=[{id:'q1',prompt:'One?',explanation:'Because',question_options:[{id:'a',label:'Yes',is_correct:true},{id:'b',label:'No',is_correct:false}]},{id:'q2',prompt:'Two?',explanation:'Because',question_options:[{id:'c',label:'Yes',is_correct:true},{id:'d',label:'No',is_correct:false}]}];
test('correct and skipped answers',()=>{const r=scoreQuiz(q,[{question_id:'q1',option_id:'a'}]);assert.equal(r.score,1);assert.equal(r.percentage,50);assert.equal(r.details[1].selected_option_id,null)});
test('wrong answers',()=>{const r=scoreQuiz(q,[{question_id:'q1',option_id:'b'}]);assert.equal(r.score,0);assert.equal(r.details[0].correct_snapshot,'Yes')});
test('empty quiz rejected',()=>assert.throws(()=>scoreQuiz([],[])));
