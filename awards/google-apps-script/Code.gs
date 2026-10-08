/** Vision & Values Awards — separate standalone project, same private spreadsheet. */
const VALUE_IDS = ['fun','teamwork','integrity','recognition','innovation'];
const VALUE_NAMES = ['Fun','Teamwork','Integrity','Recognition','Innovation'];
// The eventual work recipient is deliberately NOT configured until go-live approval.
function testRecipient_(){const email=PropertiesService.getScriptProperties().getProperty('TEST_RECIPIENT');if(!email||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Set the private TEST_RECIPIENT script property first.');return email;}
const HEADERS = ['Browser voting ID','First saved','Last updated','Fun — name','Fun — reason','Teamwork — name','Teamwork — reason','Integrity — name','Integrity — reason','Recognition — name','Recognition — reason','Innovation — name','Innovation — reason','Voter name or nickname'];

function setupAwards() {
  const p=PropertiesService.getScriptProperties();
  if(!p.getProperty('SPREADSHEET_ID'))throw Error('Set the private SPREADSHEET_ID property first.');
  if(!p.getProperty('CAMPAIGN'))p.setProperty('CAMPAIGN','test-'+Utilities.getUuid());
  if(!p.getProperty('VOTING_OPEN'))p.setProperty('VOTING_OPEN','true');
  if(!p.getProperty('MODE'))p.setProperty('MODE','TEST');
  p.setProperty('EMAIL_ENABLED','false');
  p.setProperty('EMAIL_RECIPIENT',testRecipient_());
  sheet_();
}
function book_(){const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');if(!id)throw Error('Awards are not set up yet.');return SpreadsheetApp.openById(id);}
function sheet_(){const p=PropertiesService.getScriptProperties();const campaign=p.getProperty('CAMPAIGN');if(!campaign)throw Error('Awards are not set up yet.');const name='Awards '+campaign;const book=book_();let sheet=book.getSheetByName(name);if(!sheet){sheet=book.insertSheet(name);sheet.appendRow(HEADERS);sheet.setFrozenRows(1);sheet.getRange(1,1,1,HEADERS.length).setBackground('#294f3b').setFontColor('#ffffff').setFontWeight('bold');sheet.setColumnWidths(4,11,210);sheet.getRange('B:C').setNumberFormat('dd mmm yyyy hh:mm');}return sheet;}
function doPost(e){try{if(!e||!e.postData||e.postData.contents.length>25000)throw Error('Invalid request.');const body=JSON.parse(e.postData.contents);let data;if(body.action==='status'){const p=PropertiesService.getScriptProperties();const rows=sheet_().getDataRange().getValues().slice(1);data={ok:true,campaign:p.getProperty('CAMPAIGN'),open:p.getProperty('VOTING_OPEN')==='true',hasVotes:rows.some(r=>VALUE_IDS.some((_,i)=>String(r[3+i*2]||'').trim()))};}else if(body.action==='save'){data=saveVote_(body);}else throw Error('Unknown request.');return json_(data);}catch(error){return json_({ok:false,error:error.message||'Unable to save votes.'});}}
function doGet(){return json_({ok:true,service:'Vision & Values Awards'});}
function json_(data){return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);}
function saveVote_(body){
  if(typeof body.voterId!=='string'||! /^[a-f0-9-]{36}$/i.test(body.voterId))throw Error('Invalid voting ID.');
  if(!body.answers||typeof body.answers!=='object')throw Error('Missing nominations.');
  const voterName=body.voterName===undefined?'':body.voterName;
  if(typeof voterName!=='string'||voterName.length>100)throw Error('Your name is too long.');
  const pairs=VALUE_IDS.map(id=>{const a=body.answers[id];if(!a||typeof a.name!=='string'||typeof a.reason!=='string')throw Error('Invalid nomination.');const name=a.name.trim(),reason=a.reason.trim();if(name.length>100||reason.length>1500)throw Error('A nomination is too long.');if(Boolean(name)!==Boolean(reason))throw Error('Include a name and reason, or leave both blank.');return[name,reason];});
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try{const p=PropertiesService.getScriptProperties();if(body.campaign!==p.getProperty('CAMPAIGN'))throw Error('A fresh voting round has started. Reload this page to join it.');if(p.getProperty('VOTING_OPEN')!=='true')throw Error('Voting has closed.');const sheet=sheet_();const rows=sheet.getDataRange().getValues();const index=rows.findIndex((r,i)=>i>0&&r[0]===body.voterId);if(index<0&&!pairs.some(a=>a[0]))throw Error('Nominate someone for at least one value.');const now=new Date();const row=[body.voterId,index>=0?rows[index][1]:now,now,...pairs.flat().map(literal_),literal_(voterName.trim())];const target=index>=0?index+1:sheet.getLastRow()+1;sheet.getRange(target,1,1,HEADERS.length).setValues([row]);SpreadsheetApp.flush();return{ok:true,savedAt:now.toISOString()};}finally{lock.releaseLock();}
}
// Prevent nominations being interpreted as spreadsheet formulas.
function literal_(s){return /^[=+@\-\t\r]/.test(s)?"'"+s:s;}
function escape_(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function recap_(){
  const sheet=sheet_(),rows=sheet.getDataRange().getValues().slice(1);const p=PropertiesService.getScriptProperties();const stamp=Utilities.formatDate(new Date(),'Australia/Sydney','d MMM yyyy, h:mm a');
  const total=rows.filter(r=>VALUE_IDS.some((_,i)=>String(r[3+i*2]||'').trim())).length;
  let html='<div style="background:#edf3ed;padding:24px;font-family:Arial,sans-serif;color:#213f39"><div style="max-width:680px;margin:auto;background:#fafbf7;border-radius:18px;overflow:hidden"><div style="background:#294f3b;color:#fff;padding:28px"><p style="font-size:11px;letter-spacing:2px">VISION &amp; VALUES AWARDS</p><h1 style="font-size:30px;font-weight:normal;margin:12px 0">The people making a difference.</h1><p>'+total+' voting entries · '+escape_(stamp)+' (Sydney)</p></div><div style="padding:24px"><p>This is the complete current snapshot, not a batch to add to earlier recaps. Updated nominations replace earlier choices.</p><p>Names and nicknames are shown as entered. Combine aliases after review; these are not final winners.</p>';
  let text='VISION & VALUES AWARDS\n'+stamp+' Sydney\n'+total+' voting entries\nComplete current snapshot — do not add totals from previous recaps.\n';
  VALUE_IDS.forEach((id,i)=>{const nominations=rows.filter(r=>String(r[3+i*2]||'').trim());html+='<h2 style="font-weight:normal;margin:28px 0 8px;color:#294f3b">'+VALUE_NAMES[i]+' <span style="font-size:13px;color:#62715f">· '+nominations.length+' nominations</span></h2>';text+='\n'+VALUE_NAMES[i]+' — '+nominations.length+' nominations\n';if(!nominations.length)html+='<p style="color:#62715f">No nominations yet.</p>';nominations.forEach(r=>{html+='<div style="padding:14px 0;border-bottom:1px solid #dfe6d9"><strong>'+escape_(r[3+i*2])+'</strong><p style="line-height:1.6;margin:6px 0;white-space:pre-wrap">'+escape_(r[4+i*2])+'</p>'+(r[13]?'<p style="font-size:12px;color:#62715f">Nominated by '+escape_(r[13])+'</p>':'')+'</div>';text+=String(r[3+i*2])+': '+String(r[4+i*2])+(r[13]?' (Nominated by '+String(r[13])+')':'')+'\n';});});
  const url=book_().getUrl()+'#gid='+sheet.getSheetId();html+='<p style="margin-top:30px"><a style="display:inline-block;background:#294f3b;color:#fff;padding:13px 18px;border-radius:8px;text-decoration:none" href="'+escape_(url)+'">Open the full voting sheet →</a></p><p style="font-size:12px;color:#62715f">Private organiser recap · '+escape_(p.getProperty('MODE'))+' round</p></div></div></div>';text+='\nFull sheet: '+url;
  return{html,text,total};
}
function previewRecap(){console.log(recap_().text);}
function sendTestRecap(){const r=recap_();MailApp.sendEmail({to:testRecipient_(),subject:'[TEST] Vision & Values — nomination recap',body:r.text,htmlBody:r.html,name:'Vision & Values Awards'});}
function scheduledRecap(){const p=PropertiesService.getScriptProperties();if(p.getProperty('EMAIL_ENABLED')!=='true')return;const recipient=p.getProperty('EMAIL_RECIPIENT');if(recipient!==testRecipient_())throw Error('Work-address emails are locked until go-live approval.');const r=recap_();MailApp.sendEmail({to:recipient,subject:'[TEST] Vision & Values — nomination recap',body:r.text,htmlBody:r.html,name:'Vision & Values Awards'});}
/** Run only after testing is verified and scheduling is explicitly enabled. */
function installTestSchedule(){const p=PropertiesService.getScriptProperties();if(p.getProperty('EMAIL_ENABLED')!=='true')throw Error('Automatic emails are disabled.');if(p.getProperty('EMAIL_RECIPIENT')!==testRecipient_())throw Error('Only the test recipient is enabled.');ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='scheduledRecap').forEach(t=>ScriptApp.deleteTrigger(t));[ScriptApp.WeekDay.MONDAY,ScriptApp.WeekDay.THURSDAY].forEach(day=>ScriptApp.newTrigger('scheduledRecap').timeBased().onWeekDay(day).atHour(9).inTimezone('Australia/Sydney').create());}
function resetTestRound(){const p=PropertiesService.getScriptProperties();if(p.getProperty('MODE')!=='TEST')throw Error('Only test rounds can be reset.');const lock=LockService.getScriptLock();lock.waitLock(20000);try{p.setProperties({CAMPAIGN:'test-'+Utilities.getUuid(),EMAIL_ENABLED:'false',VOTING_OPEN:'true'});sheet_();}finally{lock.releaseLock();}}
function closeVoting(){PropertiesService.getScriptProperties().setProperty('VOTING_OPEN','false');}
function reopenVoting(){PropertiesService.getScriptProperties().setProperty('VOTING_OPEN','true');}
