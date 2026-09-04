import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { z } from 'zod';
import { api } from '../../src/services/api/client';
import { useSessionStore } from '../../src/store/session';
const schema = z.object({ email: z.email(), password: z.string().min(12) });
type Form = z.infer<typeof schema>;
export default function Login() {
  const setTokens = useSessionStore((s) => s.setTokens);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });
  const submit = handleSubmit(async (values) => { const tokens = await api<{accessToken:string;refreshToken:string}>('/v1/auth/login', { method: 'POST', body: JSON.stringify(values) }); await setTokens(tokens); router.replace('/(tabs)/home'); });
  return <SafeAreaView style={styles.page}><View style={styles.card}><Text style={styles.eyebrow}>LEAD CRM</Text><Text style={styles.title}>Welcome back</Text><Text style={styles.subtitle}>Your leads, conversations, and next actions in one place.</Text>
    <Controller control={control} name="email" render={({field}) => <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Work email" style={styles.input} value={field.value} onChangeText={field.onChange} />} />
    {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
    <Controller control={control} name="password" render={({field}) => <TextInput secureTextEntry placeholder="Password" style={styles.input} value={field.value} onChangeText={field.onChange} />} />
    {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
    <Pressable disabled={isSubmitting} onPress={submit} style={styles.button}><Text style={styles.buttonText}>{isSubmitting ? 'Signing in…' : 'Sign in'}</Text></Pressable>
    <Pressable onPress={() => router.push('/(auth)/forgot-password')}><Text style={styles.link}>Forgot password?</Text></Pressable>
    <Pressable onPress={() => router.push('/(auth)/signup')}><Text style={styles.link}>Create a business account</Text></Pressable>
  </View></SafeAreaView>;
}
const styles = StyleSheet.create({page:{flex:1,backgroundColor:'#F4F7F5',justifyContent:'center',padding:24},card:{gap:14},eyebrow:{color:'#16805B',fontWeight:'800',letterSpacing:2},title:{fontSize:36,fontWeight:'800',color:'#13231D'},subtitle:{fontSize:16,color:'#617069',lineHeight:24,marginBottom:16},input:{backgroundColor:'#FFF',borderColor:'#DCE5E1',borderWidth:1,borderRadius:14,padding:16,fontSize:16},button:{backgroundColor:'#16805B',padding:17,borderRadius:14,alignItems:'center',marginTop:6},buttonText:{color:'#FFF',fontWeight:'700',fontSize:16},link:{textAlign:'center',color:'#16805B',fontWeight:'600',padding:10},error:{color:'#B42318'}});
