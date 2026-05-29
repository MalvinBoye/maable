import { View, Text, Pressable } from 'react-native'
import { Link } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'

export default function WelcomeScreen() {
  return (
    <View className="flex-1 bg-maable-bg items-center justify-center px-8">
      {/* Hero gradient text area */}
      <View className="items-center mb-12">
        <Text className="text-6xl font-bold text-white tracking-tight">Maable</Text>
        <Text className="text-zinc-400 text-lg mt-3 text-center leading-relaxed">
          Make life manageable.{'\n'}Actually enjoy the process.
        </Text>
      </View>

      {/* Feature pills */}
      <View className="flex-row flex-wrap gap-2 justify-center mb-16">
        {['✅ Tasks', '🔥 Habits', '📓 Notes', '🏆 XP & Levels', '🎮 Leaderboards'].map((f) => (
          <View key={f} className="bg-zinc-800 rounded-full px-4 py-2">
            <Text className="text-zinc-300 text-sm">{f}</Text>
          </View>
        ))}
      </View>

      {/* CTAs */}
      <View className="w-full gap-3">
        <Link href="/(auth)/signup" asChild>
          <Pressable className="bg-indigo-600 rounded-btn py-4 items-center active:bg-indigo-500">
            <Text className="text-white font-semibold text-base">Get started free</Text>
          </Pressable>
        </Link>
        <Link href="/(auth)/login" asChild>
          <Pressable className="border border-zinc-700 rounded-btn py-4 items-center active:border-zinc-500">
            <Text className="text-zinc-300 font-semibold text-base">Sign in</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  )
}
