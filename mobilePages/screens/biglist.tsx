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
import { Text, View } from "../components/Themed";
import { User, Food, MealPlan } from "../API/APIModels";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { SearchBar } from "react-native-screens";
import { GetUserMealPlan } from "../API/api";

export default function BigList() {
  const navigation = useNavigation();
  const route = useRoute();
  const response = route.params;
  const [selectedId, setSelectedId] = useState<string>();

  const UpdateMealPlan = (event: any) => {
    let food: Food;
    food = new Food("", 0, 0, 0, 0, "");
    let emptyFood = food;
    food = event;
    for (let i = 0; i < response.BigList.length; i++) {
      if (food.FoodName === response.BigList[i].FoodName)
        food = response.BigList[i];
    }
    if (food == emptyFood) {
      alert("error: unable to find the selected food");
    } else {
      alert("Successfully added selected food " + food.FoodName);
    }
  };
  type ItemProps = {
    item: Food;
    onPress: (food: Food) => void;
    backgroundColor: string;
    textColor: string;
  };
  const Item = ({ item, onPress, backgroundColor, textColor }: ItemProps) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor }]}
      onPress={() => UpdateMealPlan(item)}
    >
      <Text style={[styles.data, { color: textColor }]}>
        {item.FoodName}, Calories: {item.Calories}
      </Text>
    </TouchableOpacity>
  );
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
  const renderItem = ({ item }: { item: Food }) => {
    const backgroundColor = item.FoodName === selectedId ? "black" : "white";
    const color = item.FoodName === selectedId ? "white" : "black";
    return (
      <Item
        item={item}
        onPress={() => UpdateMealPlan(item)}
        backgroundColor={backgroundColor}
        textColor={color}
      />
    );
  };
  const navigateSettings = () => {
    let user = response.user;
    let BigList = response.BigList;
    let userMealPlan = response.userMealPlan;
    navigation.navigate("Settings", { user, BigList, userMealPlan });
  };
  const updateUserMealPlan = async () => {
    const date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let accessToken = response.user.accessToken;
    const MealPlanResult = await GetUserMealPlan(year, month, day, accessToken);
    if (MealPlanResult != null)
      response.userMealPlan = new MealPlan(
        MealPlanResult.nameResults,
        MealPlanResult.caloriesResults,
        MealPlanResult.proteinResults,
        MealPlanResult.fatResults,
        MealPlanResult.carbsResults,
        MealPlanResult.numServings,
        MealPlanResult.Fats,
        MealPlanResult.Protein,
        MealPlanResult.Carbs,
        MealPlanResult.Calories
      );
  };
  const navigateMealPlan = () => {
    let completedMealPlan: Food[] = [];
    updateUserMealPlan();
    let foodNameResults = response.userMealPlan.nameResults;
    let foodnumber = foodNameResults.length;
    for (let i = 0; i < foodnumber; i++) {
      completedMealPlan.push(
        new Food(
          response.userMealPlan.nameResults[i],
          response.userMealPlan.calorieResults[i],
          response.userMealPlan.proteinResults[i],
          response.userMealPlan.fatsResults[i],
          response.userMealPlan.carbsResults[i],
          response.userMealPlan.numServings[i]
        )
      );
    }
    let user = response.user;
    let BigList = response.BigList;
    let userMealPlan = response.userMealPlan;
    navigation.navigate("MealPlanPage", {
      user,
      BigList,
      userMealPlan,
      completedMealPlan,
    });
  };
  const addFood = () => {
    // Add food to list
  };

  // Removes back arrow
  useEffect(() => {
    const hideBackButton = () => {
      navigation.setOptions({
        headerLeft: () => null,
      });
    };

    hideBackButton();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={response.BigList}
        renderItem={renderItem}
        keyExtractor={(item) => item.FoodName}
        extraData={selectedId}
        ItemSeparatorComponent={myItemSeparator}
        ListEmptyComponent={myListEmpty}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Text style={styles.headerText}>All Foods</Text>
          </View>
        )}
      />
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={navigateMealPlan}
      >
        <Text style={styles.mealplanbuttonText}>Meal Plan</Text>
      </TouchableOpacity>
      {/* <TouchableOpacity
        style={styles.settingsButton}
        onPress={navigateSettings}
      >
        <Text style={styles.settingsButtonText}>Settings</Text>
      </TouchableOpacity> */}
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
  settingsButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "green",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  settingsButtonText: {
    color: "white",
    fontSize: 16,
  },
  mealplanbutton: {
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: "black",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  mealplanbuttonText: {
    color: "white",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerText: {
    fontSize: 30,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  addButton: {
    flex: 1,
  },
  addButtonText: {
    fontSize: 18,
    color: "green",
    fontWeight: "bold",
  },
});
