import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentAuth,type AuthContext } from '../common/auth-context.js';
import { Roles } from '../common/roles.decorator.js';
import { ConversationFiltersDto,SendMessageDto,UpdateConversationDto } from './conversations.dto.js';
import { ConversationsService } from './conversations.service.js';
@Controller('v1')
export class ConversationsController{
 constructor(private readonly conversations:ConversationsService){}
 @Get('conversations')list(@CurrentAuth()auth:AuthContext,@Query()q:ConversationFiltersDto){return this.conversations.list(auth,q.filter,q.cursor)}
 @Get('conversations/:id')get(@CurrentAuth()auth:AuthContext,@Param('id')id:string){return this.conversations.get(auth,id)}
 @Get('conversations/:id/messages')messages(@CurrentAuth()auth:AuthContext,@Param('id')id:string,@Query('cursor')cursor?:string){return this.conversations.messages(auth,id,cursor)}
 @Roles('OWNER','ADMIN','MANAGER','AGENT')@Post('conversations/:id/messages')send(@CurrentAuth()auth:AuthContext,@Param('id')id:string,@Body()body:SendMessageDto){return this.conversations.send(auth,id,body.content)}
 @Roles('OWNER','ADMIN','MANAGER','AGENT')@Post('conversations/:id/messages/:messageId/retry')retry(@CurrentAuth()auth:AuthContext,@Param('id')id:string,@Param('messageId')messageId:string){return this.conversations.retry(auth,id,messageId)}
 @Post('conversations/:id/read')read(@CurrentAuth()auth:AuthContext,@Param('id')id:string){return this.conversations.read(auth,id)}
 @Roles('OWNER','ADMIN','MANAGER')@Patch('conversations/:id')update(@CurrentAuth()auth:AuthContext,@Param('id')id:string,@Body()body:UpdateConversationDto){return this.conversations.update(auth,id,body)}
 @Get('inbox/unread-count')unread(@CurrentAuth()auth:AuthContext){return this.conversations.unreadCount(auth)}
}
