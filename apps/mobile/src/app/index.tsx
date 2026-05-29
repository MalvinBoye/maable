import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { View, ActivityIndicator } from 'react-native'

export default function Index() {
  const [loading, setLoading] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-maable-bg">
        <ActivityIndicator color="#6366f1" />
      </View>
    )
  }

  return <Redirect href={hasSession ? '/(app)/dashboard' : '/(auth)/welcome'} />
}
