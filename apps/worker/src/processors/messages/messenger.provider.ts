import type { MessagingProvider,SendResult } from './provider.js';
export class MessengerProvider implements MessagingProvider{
 constructor(private readonly graphVersion:string){}
 async sendText(recipientId:string,content:string,accessToken:string):Promise<SendResult>{const response=await fetch(`https://graph.facebook.com/${this.graphVersion}/me/messages`,{method:'POST',headers:{authorization:`Bearer ${accessToken}`,'content-type':'application/json'},body:JSON.stringify({recipient:{id:recipientId},messaging_type:'RESPONSE',message:{text:content}})});const body=await response.json() as {message_id?:string;error?:unknown};if(!response.ok||body.error||!body.message_id)throw new Error('Messenger send failed');return{externalMessageId:body.message_id,delivered:false};}
}
