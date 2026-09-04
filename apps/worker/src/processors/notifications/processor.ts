import type { Job } from 'bullmq';
import type { PrismaClient, Prisma } from '@lead-saas/database';
type PushJob={notificationId:string};
type PushTicket={status:'ok'|'error';id?:string;details?:{error?:string};message?:string};
export class PushNotificationProcessor {
  constructor(private readonly db:PrismaClient,private readonly accessToken?:string){}
  async process(job:Job<PushJob>):Promise<{sent:number}> {
    const notification=await this.db.notification.findUnique({where:{id:job.data.notificationId}}); if(!notification) throw new Error('Notification not found');
    const devices=await this.db.deviceToken.findMany({where:{userId:notification.userId}}); if(!devices.length)return{sent:0};
    const response=await fetch('https://exp.host/--/api/v2/push/send',{method:'POST',headers:{'content-type':'application/json','accept':'application/json',...(this.accessToken?{authorization:`Bearer ${this.accessToken}`}:{})},body:JSON.stringify(devices.map((device)=>({to:device.pushToken,title:notification.title,body:notification.body,data:notification.dataJson,sound:'default'})))});
    if(response.status===429||response.status>=500)throw new Error(`Expo Push temporary failure (${response.status})`);
    const payload=await response.json() as {data?:PushTicket[];errors?:unknown[]}; if(!response.ok||payload.errors)throw new Error('Expo Push rejected the notification batch');
    const tickets=payload.data??[]; const invalid=tickets.flatMap((ticket,index)=>ticket.status==='error'&&ticket.details?.error==='DeviceNotRegistered'?[devices[index]!.id]:[]);
    if(invalid.length)await this.db.deviceToken.deleteMany({where:{id:{in:invalid}}});
    const ids=tickets.flatMap((ticket)=>ticket.status==='ok'&&ticket.id?[ticket.id]:[]);
    await this.db.notification.update({where:{id:notification.id},data:{dataJson:{...((notification.dataJson as Record<string,unknown>|null)??{}),pushTicketIds:ids} as Prisma.InputJsonValue}});
    return{sent:ids.length};
  }
}
