import { useInfiniteQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import { Stack,useLocalSearchParams } from 'expo-router';
import { useEffect,useState } from 'react';
import { ActivityIndicator,FlatList,Pressable,SafeAreaView,StyleSheet,Text,TextInput,View } from 'react-native';
import { api } from '../../src/services/api/client';

type Message={id:string;content:string;direction:'INBOUND'|'OUTBOUND';status:string;createdAt:string};
type Page={data:Message[];nextCursor:string|null};

export default function Conversation(){
  const{id}=useLocalSearchParams<{id:string}>();const client=useQueryClient();const[text,setText]=useState('');
  const query=useInfiniteQuery({queryKey:['conversations',id,'messages'],queryFn:({pageParam})=>api<Page>(`/v1/conversations/${id}/messages${pageParam?`?cursor=${pageParam}`:''}`),initialPageParam:null as string|null,getNextPageParam:p=>p.nextCursor,enabled:!!id});
  useEffect(()=>{if(id)void api(`/v1/conversations/${id}/read`,{method:'POST'});},[id]);
  const refresh=()=>client.invalidateQueries({queryKey:['conversations',id,'messages']});
  const send=useMutation({mutationFn:(content:string)=>api<Message>(`/v1/conversations/${id}/messages`,{method:'POST',body:JSON.stringify({content})}),onSuccess:()=>{setText('');void refresh()}});
  const retry=useMutation({mutationFn:(messageId:string)=>api<Message>(`/v1/conversations/${id}/messages/${messageId}/retry`,{method:'POST'}),onSuccess:()=>void refresh()});
  const messages=query.data?.pages.flatMap(p=>p.data)??[];
  return <SafeAreaView style={s.page}><Stack.Screen options={{headerShown:true,title:'Conversation'}}/>{query.isLoading?<ActivityIndicator/>:<FlatList inverted data={messages} keyExtractor={x=>x.id} contentContainerStyle={s.list} onEndReached={()=>{if(query.hasNextPage)void query.fetchNextPage()}} renderItem={({item})=><View style={[s.bubble,item.direction==='OUTBOUND'?s.outbound:s.inbound]}><Text style={item.direction==='OUTBOUND'?s.outText:undefined}>{item.content}</Text>{item.direction==='OUTBOUND'&&<Text style={[s.state,item.status==='FAILED'&&s.failed]}>{item.status}</Text>}{item.status==='FAILED'&&<Pressable disabled={retry.isPending} onPress={()=>retry.mutate(item.id)}><Text style={s.retry}>Retry</Text></Pressable>}</View>}/>}<View style={s.composer}><TextInput style={s.input} value={text} onChangeText={setText} placeholder="Write a reply" multiline/><Pressable disabled={!text.trim()||send.isPending} style={s.send} onPress={()=>send.mutate(text.trim())}><Text style={s.sendText}>Send</Text></Pressable></View>{send.isError&&<Text style={s.error}>Message could not be queued. Try again.</Text>}</SafeAreaView>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#F4F7F5'},list:{padding:16,gap:8},bubble:{maxWidth:'82%',padding:12,borderRadius:16,gap:4},inbound:{backgroundColor:'#fff',alignSelf:'flex-start'},outbound:{backgroundColor:'#16805B',alignSelf:'flex-end'},outText:{color:'#fff'},state:{fontSize:10,color:'#D7F5E9',textAlign:'right'},failed:{color:'#FFD0CC'},retry:{color:'#fff',fontWeight:'800',textDecorationLine:'underline',marginTop:4},composer:{flexDirection:'row',padding:12,gap:8,backgroundColor:'#fff'},input:{flex:1,backgroundColor:'#F4F7F5',borderRadius:14,padding:12,maxHeight:120},send:{backgroundColor:'#16805B',borderRadius:14,paddingHorizontal:18,justifyContent:'center'},sendText:{color:'#fff',fontWeight:'700'},error:{color:'#B42318',padding:8,textAlign:'center'}});
