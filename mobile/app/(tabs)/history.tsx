import { View, Text, SafeAreaView } from "react-native";

export default function HistoryScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-foreground text-2xl font-bold">Historique</Text>
        <Text className="text-foreground-muted text-sm mt-2 text-center">
          Visualisation des progressions — à venir
        </Text>
      </View>
    </SafeAreaView>
  );
}
