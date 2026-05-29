import { View, Text, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { supabase } from '@/lib/supabase'
import { xpProgress } from '@maable/core'

export default function DashboardScreen() {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      return data
    },
  })

  const { data: tasks } = useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'archived')
        .order('due_date', { ascending: true })
        .limit(5)
      return data ?? []
    },
  })

  const xp = xpProgress(profile?.total_xp ?? 0)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'

  return (
    <SafeAreaView className="flex-1 bg-maable-bg">
      <ScrollView className="flex-1" contentContainerClassName="px-5 py-6 gap-6">
        {/* Header */}
        <View>
          <Text className="text-2xl font-bold text-white">
            Good {greeting} 👋
          </Text>
          {profile && (
            <Text className="text-zinc-400 mt-0.5">{profile.display_name}</Text>
          )}
        </View>

        {/* XP Card */}
        <View className="bg-maable-surface rounded-card p-5 border border-maable-border">
          <View className="flex-row justify-between items-end mb-3">
            <View>
              <Text className="text-xs text-zinc-500 uppercase tracking-wide mb-0.5">Level {xp.level}</Text>
              <Text className="text-3xl font-bold text-amber-400">{profile?.total_xp.toLocaleString() ?? 0}</Text>
              <Text className="text-xs text-zinc-500">total XP</Text>
            </View>
            <Text className="text-zinc-500 text-sm">{xp.current}/{xp.required} XP</Text>
          </View>
          {/* XP bar */}
          <View className="h-3 bg-zinc-800 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${xp.percent}%`,
                backgroundColor: '#6366f1',
              }}
            />
          </View>
        </View>

        {/* Quick stats */}
        <View className="flex-row gap-3">
          {[
            { label: 'Tasks done', value: '–', color: '#10b981' },
            { label: 'Day streak', value: '–', color: '#f59e0b' },
            { label: 'Rank', value: '#–', color: '#6366f1' },
          ].map((stat) => (
            <View
              key={stat.label}
              className="flex-1 bg-maable-surface rounded-card p-4 border border-maable-border"
            >
              <Text className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</Text>
              <Text className="text-xs text-zinc-500 mt-0.5">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Today's tasks */}
        <View>
          <Text className="text-lg font-semibold text-white mb-3">Today&apos;s tasks</Text>
          {tasks && tasks.length > 0 ? (
            tasks.map((task) => (
              <Pressable
                key={task.id}
                className="bg-maable-surface rounded-card px-4 py-3 mb-2 flex-row items-center gap-3 border border-maable-border active:opacity-70"
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <View
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: PRIORITY_COLOR[task.priority as keyof typeof PRIORITY_COLOR],
                  }}
                />
                <Text className="flex-1 text-sm text-zinc-100 font-medium" numberOfLines={1}>
                  {task.title}
                </Text>
                <Text className="text-xs text-amber-400">+{task.xp_reward} XP</Text>
              </Pressable>
            ))
          ) : (
            <View className="bg-maable-surface rounded-card p-8 items-center border border-maable-border">
              <Text className="text-zinc-500 text-sm text-center">
                No tasks yet — add one and start earning XP!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const PRIORITY_COLOR = {
  low: '#71717a',
  medium: '#3b82f6',
  high: '#f97316',
  urgent: '#ef4444',
}
