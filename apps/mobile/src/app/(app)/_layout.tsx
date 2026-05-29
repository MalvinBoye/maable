import { Tabs } from 'expo-router'
import { CheckSquare, Flame, BookOpen, Trophy, LayoutDashboard } from 'lucide-react-native'

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#18181b',
          borderTopColor: '#27272a',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#71717a',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ color, size }) => <Flame color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Rank',
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
