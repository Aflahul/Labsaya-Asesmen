export function validateEvent(e){
 if(!e || typeof e.id!=='string'||typeof e.sessionId!=='string'||!Number.isInteger(e.seq)||e.seq<1||!['action','submit','run','hint','reset','checkpoint'].includes(e.type)||!Number.isFinite(e.activeMs)||e.activeMs<0||!e.payload||typeof e.payload!=='object')throw new Error('Event tidak valid');return e;
}
