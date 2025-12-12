import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import OnboardingScreen from "./screens/Pre-Auth/WelcomeScreen";
import LoginScreen from "./screens/Auth/LoginScreen";
import VerifyOtpScreen from "./screens/Auth/OTPVerification";
import RetailHomeScreen from "./screens/Post-Auth/HomeScreen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import ScanSellScreen from "./screens/Post-Auth/SalesPage";
import InventoryScreen from "./screens/Post-Auth/InventoryPage";
import AIInsightsScreen from "./screens/Post-Auth/AiInsightScreen";
import TopSellersScreen from "./screens/Post-Auth/TopMovers";
import SlowMovingProducts from "./screens/Post-Auth/RestockAlert";
import SettingsScreen from "./screens/Post-Auth/Settings";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const HomeScreens = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RetailHome" component={RetailHomeScreen} />
      <Stack.Screen name="SalesScreen" component={ScanSellScreen} />
      <Stack.Screen name="InventoryScreen" component={InventoryScreen} />
      <Stack.Screen name="AIInsightsScreen" component={AIInsightsScreen} />
      <Stack.Screen name="TopSellers" component={TopSellersScreen} />
      <Stack.Screen name="SlowMovingProducts" component={SlowMovingProducts} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />

    </Stack.Navigator>
  );
};

const Tabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#122117" },
        tabBarActiveTintColor: "#36e27b",
      }}
    >
      <Tab.Screen name="Home" component={HomeScreens} />
      <Tab.Screen name="Report" component={RetailHomeScreen} />
      <Tab.Screen name="Profile" component={RetailHomeScreen} />
    </Tab.Navigator>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="WelcomeScreen" component={OnboardingScreen} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
        <Stack.Screen name="HomeScreen" component={Tabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
