import { Tabs } from "expo-router";
import { View, Text } from "react-native";

function TabIcon({
  label,
  focused,
}: {
  label: string;
  focused: boolean;
}) {
  return (
    <View className="items-center justify-center">
      <Text
        className={focused ? "text-primary text-xs font-semibold" : "text-foreground-muted text-xs"}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#1C1C1E",
          borderTopColor: "#3A3A3C",
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 28,
          paddingTop: 12,
        },
        tabBarActiveTintColor: "#C0694A",
        tabBarInactiveTintColor: "#6E6E68",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Séance",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="⚡" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historique",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="📊" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Réglages",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="⚙️" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
