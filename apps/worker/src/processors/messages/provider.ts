export type SendResult={externalMessageId:string;delivered:boolean};
export interface MessagingProvider{sendText(recipientId:string,content:string,accessToken:string):Promise<SendResult>;}
