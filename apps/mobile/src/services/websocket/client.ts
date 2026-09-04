import { QueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
const baseUrl=process.env.EXPO_PUBLIC_API_BASE_URL??'http://localhost:3000';
const events=['lead.created','lead.updated','lead.assigned','message.created','message.updated','notification.created'] as const;
export function connectRealtime(accessToken:string,queryClient:QueryClient):()=>void{
  const socket:Socket=io(`${baseUrl}/realtime`,{auth:{token:accessToken},transports:['websocket'],reconnection:true});
  for(const event of events) socket.on(event,()=>{ if(event.startsWith('lead.'))void queryClient.invalidateQueries({queryKey:['leads']}); if(event.startsWith('message.'))void queryClient.invalidateQueries({queryKey:['conversations']}); if(event==='notification.created')void queryClient.invalidateQueries({queryKey:['notifications']}); });
  socket.on('connect',()=>{void queryClient.invalidateQueries();});
  return()=>socket.disconnect();
}
