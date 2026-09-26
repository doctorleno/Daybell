import {Temporal} from '@js-temporal/polyfill';
import {z} from 'zod';
export const recurrenceSchema=z.object({frequency:z.enum(['daily','weekly','monthly']),interval:z.number().int().min(1).max(52),weekdays:z.array(z.number().int().min(1).max(7)).max(7),until:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),timezone:z.string().max(80)}).superRefine((r,ctx)=>{try{Temporal.Now.zonedDateTimeISO(r.timezone);if(r.until)Temporal.PlainDate.from(r.until);}catch{ctx.addIssue({code:z.ZodIssueCode.custom,message:'Choose a valid time zone and end date.'});}if(r.frequency==='weekly'&&!r.weekdays.length)ctx.addIssue({code:z.ZodIssueCode.custom,message:'Choose at least one weekday.'});});
export type Recurrence=z.infer<typeof recurrenceSchema>;
export type Recurring={id:string;starts:string;done:number;recurrence?:Recurrence|null;completed?:string[];occurrence?:string;seriesStarts?:string};
export function localFields(starts:string,timezone:string){const z=Temporal.Instant.from(starts).toZonedDateTimeISO(timezone);return {date:z.toPlainDate().toString(),time:z.toPlainTime().toString().slice(0,5)};}
export function scheduledInstant(date:string,time:string,timezone:string){return Temporal.PlainDateTime.from(date+'T'+time).toZonedDateTime(timezone,{disambiguation:'compatible'}).toInstant().toString();}
export function matchesDate(starts:string,rule:Recurrence,date:string){
 const anchor=Temporal.Instant.from(starts).toZonedDateTimeISO(rule.timezone).toPlainDate(),candidate=Temporal.PlainDate.from(date);
 if(Temporal.PlainDate.compare(candidate,anchor)<0||(rule.until&&Temporal.PlainDate.compare(candidate,Temporal.PlainDate.from(rule.until))>0))return false;
 const days=anchor.until(candidate,{largestUnit:'day'}).days;
 if(rule.frequency==='daily')return days%rule.interval===0;
 if(rule.frequency==='weekly'){const monday=anchor.subtract({days:anchor.dayOfWeek-1});const weeks=Math.floor(monday.until(candidate,{largestUnit:'day'}).days/7);return weeks%rule.interval===0&&rule.weekdays.includes(candidate.dayOfWeek);}
 const months=(candidate.year-anchor.year)*12+candidate.month-anchor.month;
 return months%rule.interval===0&&candidate.day===anchor.day;
}
export function expandEntries<T extends Recurring>(items:T[],from:Date,to:Date):(T&{occurrence?:string;seriesStarts?:string})[]{
 const result:T[]=[];
 for(const e of items){
  if(!e.recurrence){result.push(e);continue;}
  const r=e.recurrence,anchor=Temporal.Instant.from(e.starts).toZonedDateTimeISO(r.timezone),start=Temporal.Instant.from(from.toISOString()).toZonedDateTimeISO(r.timezone).toPlainDate(),end=Temporal.Instant.from(to.toISOString()).toZonedDateTimeISO(r.timezone).toPlainDate();
  let d=Temporal.PlainDate.compare(start,anchor.toPlainDate())<0?anchor.toPlainDate():start;
  for(;Temporal.PlainDate.compare(d,end)<=0;d=d.add({days:1})){
   if(r.until&&d.toString()>r.until)break;
   if(!matchesDate(e.starts,r,d.toString()))continue;
   const starts=d.toPlainDateTime(anchor.toPlainTime()).toZonedDateTime(r.timezone,{disambiguation:'compatible'}).toInstant().toString();
   result.push({...e,starts,seriesStarts:e.starts,occurrence:d.toString(),done:e.completed?.includes(d.toString())?1:0});
  }
 }
 return result.sort((a,b)=>a.starts.localeCompare(b.starts));
}
// Expand the visible month and nearby reminders separately, avoiding years of intervening dates.
export function visibleEntries<T extends Recurring>(items:T[],month:Date,now:Date){
 const ranges=[[new Date(month.getFullYear(),month.getMonth(),-7),new Date(month.getFullYear(),month.getMonth()+1,15)],[new Date(now.getTime()-86400000),new Date(now.getTime()+62*86400000)]];
 const found=new Map<string,T>();for(const [from,to] of ranges)for(const e of expandEntries(items,from,to))found.set(e.id+'@'+(e.occurrence??''),e);
 return [...found.values()].sort((a,b)=>a.starts.localeCompare(b.starts));
}
