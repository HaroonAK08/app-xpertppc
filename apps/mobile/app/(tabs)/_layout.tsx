import { Tabs } from 'expo-router';
export default function TabsLayout() { return <Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:'#16805B'}}><Tabs.Screen name="home" options={{title:'Home'}}/><Tabs.Screen name="leads" options={{title:'Leads'}}/><Tabs.Screen name="inbox" options={{title:'Inbox'}}/><Tabs.Screen name="settings" options={{title:'Settings'}}/></Tabs>; }
