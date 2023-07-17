import {
  ImageBackground,
  StyleSheet,
  Button,
  TextInput,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import * as React from "react";
import { Text, View } from "../../components/Themed";
import { User, Food } from "../../API/APIModels";
import { useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

type ItemProps = {
  item: Food;
  onPress: () => void;
  backgroundColor: string;
  textColor: string;
};

const Item = ({ item, onPress, backgroundColor, textColor }: ItemProps) => (
  <TouchableOpacity
    //change this to send the food item to the user's meal plan through an API call
    onPress={onPress}
    style={[styles.item, { backgroundColor }]}
  >
    <Text style={[styles.data, { color: textColor }]}>
      {item.FoodName}, Calories: {item.Calories}
    </Text>
  </TouchableOpacity>
);

export default function BigList(foods: Food[], user: User) {
  const myItemSeparator = () => {
    return (
      <View
        style={{ height: 1, backgroundColor: "gray", marginHorizontal: 10 }}
      />
    );
  };
  const myListEmpty = () => {
    return (
      <View style={{ alignItems: "center" }}>
        <Text style={styles.item}>No data found</Text>
      </View>
    );
  };

  const [selectedId, setSelectedId] = useState<string>();
  let totalCalories = 0;
  let totalCarbs = 0;
  let totalFats = 0;
  let totalProtein = 0;
  const calculateTotalValues = () => {
    for (let i = 0; i < foods.length; i++) {
      totalCalories += foods[i].Calories;
      totalCarbs += foods[i].Carbs;
      totalFats += foods[i].Fats;
      totalProtein += foods[i].Protein;
    }
  };
  const caloriecolor = totalCalories > user.CalorieGoal ? "red" : "black";
  const renderItem = ({ item }: { item: Food }) => {
    const backgroundColor = item.FoodName === selectedId ? "black" : "white";
    const color = item.FoodName === selectedId ? "white" : "black";
    return (
      <Item
        item={item}
        onPress={() => setSelectedId(item.FoodName)}
        backgroundColor={backgroundColor}
        textColor={color}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={foods}
        renderItem={renderItem}
        keyExtractor={(item) => item.FoodName}
        extraData={selectedId}
        ItemSeparatorComponent={myItemSeparator}
        ListEmptyComponent={myListEmpty}
        ListHeaderComponent={() => (
          <Text
            style={{
              fontSize: 30,
              textAlign: "center",
              marginTop: 20,
              fontWeight: "bold",
              textDecorationLine: "underline",
            }}
          >
            All Food Items
          </Text>
        )}
      />
      <View>
        <Text>Calorie total: {totalCalories}</Text>
        <Text style={}>Calorie Goal: {user.CalorieGoal}</Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
  item: {
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 32,
  },
  data: {
    fontSize: 16,
  },
});
