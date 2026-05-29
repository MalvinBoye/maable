import { useState } from 'react'
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { Link, router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { supabase } from '@/lib/supabase'
import { isValidEmail } from '@maable/core'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email.trim() || !password) return

    if (!isValidEmail(email.trim())) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Invalid email', 'Please enter a valid email address.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    setLoading(false)

    if (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Sign in failed', 'Check your email and password and try again.')
      return
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    router.replace('/(app)/dashboard')
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-maable-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-8">
        <Text className="text-3xl font-bold text-white mb-1">Welcome back</Text>
        <Text className="text-zinc-400 mb-8">Sign in to continue your streak.</Text>

        <View className="gap-4">
          <View>
            <Text className="text-sm font-medium text-zinc-300 mb-1.5">Email</Text>
            <TextInput
              className="bg-zinc-900 border border-zinc-700 rounded-btn px-4 py-3 text-zinc-100 text-sm"
              placeholder="you@example.com"
              placeholderTextColor="#71717a"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-zinc-300 mb-1.5">Password</Text>
            <TextInput
              className="bg-zinc-900 border border-zinc-700 rounded-btn px-4 py-3 text-zinc-100 text-sm"
              placeholder="••••••••"
              placeholderTextColor="#71717a"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            className="bg-indigo-600 rounded-btn py-4 items-center mt-2 active:bg-indigo-500 disabled:opacity-50"
          >
            <Text className="text-white font-semibold text-base">
              {loading ? 'Signing in…' : 'Sign in'}
            </Text>
          </Pressable>
        </View>

        <View className="flex-row justify-center mt-8 gap-1">
          <Text className="text-zinc-500 text-sm">Don&apos;t have an account?</Text>
          <Link href="/(auth)/signup">
            <Text className="text-indigo-400 text-sm font-medium">Sign up</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
