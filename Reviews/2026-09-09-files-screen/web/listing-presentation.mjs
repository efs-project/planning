// Presentation only. Classification does not validate, select, fetch or alter data.
export function presentListing(observation){
  const positions=[...observation.rows,...observation.unresolved,...observation.masked,...observation.absent];
  const files=positions.filter(r=>r.outcome==='FOUND');
  const history=positions.filter(r=>r.outcome==='ABSENT'||r.outcome==='MASKED');
  const attention=positions.filter(r=>!['FOUND','ABSENT','MASKED'].includes(r.outcome));
  const count=files.length,issues=attention.length,checked=positions.length;
  const issueText=issues+' placement'+(issues===1?' needs':'s need')+' attention';
  const fileText=count+' current file'+(count===1?'':'s');
  let summary;
  if(observation.qualification.status!=='QUALIFIED'){
    summary='Latest attempt failed: '+observation.reason+'. '+(checked?'Showing prior sealed rows only. ':'No complete folder result is available. ')+fileText+'.';
  }else if(count===0){
    summary=observation.coverage!=='COMPLETE'?'No current files found yet. Scan incomplete; more may remain.':issues?'No usable files found; '+issueText+'.':'No current files.';
  }else summary=fileText+'.'+(issues?' '+issueText+'.':'');
  summary+=' '+checked+' source positions checked.';
  if(observation.qualification.status==='QUALIFIED')summary+=observation.coverage==='COMPLETE'?' All source positions were traversed.':' More source positions remain. Names are sorted within the loaded portion only.';
  return {files,attention,history,checked,summary};
}
