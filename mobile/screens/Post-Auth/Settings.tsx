import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Modal, // Add Modal import
  FlatList, // Add FlatList import
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { t, localizationService } from "../../utils/localization"; // Import localizationService
import { SafeAreaView } from "react-native-safe-area-context";
import { authStorage } from "../../services/authStorage";
import { clearDatabase, initDatabase } from "../../services/database";

export default function SettingsScreen({ navigation }: { navigation: any }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [shopName, setShopName] = useState("My Shop");
  const [showLanguageModal, setShowLanguageModal] = useState(false); // New state for modal visibility
  const [currentLanguageCode, setCurrentLanguageCode] = useState(
    localizationService.getCurrentLanguage(), // Initialize with current language
  );

  const handleLogout = () => {
    Alert.alert(t("logOut"), t("logOutConfirmation"), [
      {
        text: t("cancel"),
        style: "cancel",
      },
      {
        text: t("logOut"),
        style: "destructive",
        onPress: async () => {
          try {
            await authStorage.clearAuthData();
            await clearDatabase();
            await initDatabase();
            // Try to reset the root navigator (Settings -> HomeStack -> Tabs -> RootStack)
            const rootNav = navigation.getParent()?.getParent();
            if (rootNav) {
              rootNav.reset({
                index: 0,
                routes: [{ name: "WelcomeScreen" }],
              });
            } else {
              navigation.navigate("WelcomeScreen");
            }
          } catch (error) {
            console.error("Logout failed:", error);
            Alert.alert(t("errorTitle"), t("couldNotLogOut"));
          }
        },
      },
    ]);
  };

  useEffect(() => {
    const loadSettings = async () => {
      const authData = await authStorage.getAuthData();
      if (authData?.user?.shopName) {
        setShopName(authData.user.shopName);
      }
      setCurrentLanguageCode(localizationService.getCurrentLanguage()); // Update current language on load
    };
    loadSettings();
  }, []); // Depend on [] so it runs once on mount

  const languageOptions = [
    { code: "en", name: t("english") },
    { code: "pcm", name: t("pidgin") },
    { code: "hausa", name: t("hausa") },
    { code: "yoruba", name: t("yoruba") },
    { code: "igbo", name: t("igbo") },
  ];

  const handleLanguageChange = async (newLangCode: string) => {
    try {
      await localizationService.setLanguage(newLangCode);
      setCurrentLanguageCode(newLangCode);
      setShowLanguageModal(false);
      // A simple way to trigger a re-render of the screen with new translations
      // This is a common pattern for localization changes in React Native
      // without doing a full app reload.
      navigation.navigate(
        navigation.getState().routes[navigation.getState().index].name,
      );
    } catch (error) {
      console.error("Failed to change language:", error);
      Alert.alert(t("errorTitle"), "Failed to change language.");
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#112117" : "#f6f8f7" },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: isDarkMode ? "#112117" : "#f6f8f7" },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={isDarkMode ? "#9ca3af" : "#4b5563"}
            />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: isDarkMode ? "#fff" : "#111827" },
            ]}
          >
            {t("settings")}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageWrapper}>
            <View style={styles.profileImageBorder}>
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuB550YN3lKxry9QOC4oNfn0aeV1_1TIjXV7PtMxqTBp_uJQvFNPrSWF9gmqQ3jqpv8T1u44drXmEY4x3UPXpm4SwD2zSqyW2OYhSz1naNXMHb9M18RzshGRIPXbsYl6TOPzluRLQPbJ_vucMcPrPY0Ud4GKXVfIOUiFr8yn8f4HmNKjJ1Edqt4pXFgTpK0-P2UtbkbSGS4-PHJEAoP_66lMleAIMSkc6OpPuT4z2fCMRknEgSCE_lh2kvU8W3zyXkdp40CsdUgceu8",
                }}
                style={styles.profileImage}
              />
            </View>
          </View>
          <View>
            <Text
              style={[
                styles.shopName,
                { color: isDarkMode ? "#fff" : "#111827" },
              ]}
            >
              {shopName}
            </Text>
            <Text
              style={[
                styles.planText,
                { color: isDarkMode ? "#9ca3af" : "#6b7280" },
              ]}
            >
              {t("standardPlan")}
            </Text>
            <TouchableOpacity>
              <Text style={[styles.editProfile, { color: "#36e27b" }]}>
                {t("editProfile")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* General Section */}
        <SettingsSection
          title={t("general")}
          items={[
            {
              icon: "storefront",
              iconBg: "#DBEAFE",
              label: t("shopProfile"),
              subtitle: t("shopProfileSubtitle"),
            },
            {
              icon: "group",
              iconBg: "#F5F3FF",
              label: t("manageStaff"),
              subtitle: t("manageStaffSubtitle"),
            },
          ]}
          isDarkMode={isDarkMode}
        />

        {/* App Preferences */}
        <SettingsSection
          title={t("appPreferences")}
          items={[
            {
              icon: "palette",
              iconBg: "#FFF7ED",
              label: t("appTheme"),
              subtitle: t("appThemeSubtitle"),
              rightContent: (
                <View style={styles.themeTag}>
                  <Text style={styles.themeTagText}>
                    {isDarkMode ? t("dark") : t("light")}
                  </Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color="#9ca3af"
                  />
                </View>
              ),
            },
            {
              icon: "language", // Material icon for language
              iconBg: "#E0F2F7", // A light blue color, similar to other iconBgs
              label: t("language"),
              subtitle: t("languageSubtitle"),
              onPress: () => setShowLanguageModal(true), // Open language modal
              rightContent: (
                <View style={styles.themeTag}>
                  <Text style={styles.themeTagText}>
                    {
                      languageOptions.find(
                        (lang) => lang.code === currentLanguageCode,
                      )?.name
                    }
                  </Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color="#9ca3af"
                  />
                </View>
              ),
            },
            {
              icon: "notifications",
              iconBg: "#FCE7F3",
              label: t("notifications"),
              subtitle: t("notificationsSubtitle"),
              rightContent: (
                <Switch
                  value={true}
                  onValueChange={() => {}}
                  thumbColor="#fff"
                  trackColor={{ false: "#e5e7eb", true: "#36e27b" }}
                />
              ),
            },
          ]}
          isDarkMode={isDarkMode}
        />

        {/* Data Management */}
        <SettingsSection
          title={t("dataManagement")}
          items={[
            {
              icon: "download",
              iconBg: "#ECFEFF",
              label: t("exportSalesData"),
              subtitle: t("exportSalesDataSubtitle"),
              rightContent: (
                <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
              ),
            },
          ]}
          isDarkMode={isDarkMode}
        />

        {/* Logout */}
        <View style={{ marginVertical: 16 }}>
          <TouchableOpacity
            style={[
              styles.logoutButton,
              { backgroundColor: isDarkMode ? "#3f2d2d" : "#fee2e2" },
            ]}
            onPress={handleLogout}
          >
            <MaterialIcons
              name="logout"
              size={20}
              color={isDarkMode ? "#fca5a5" : "#b91c1c"}
            />
            <Text
              style={[
                styles.logoutText,
                { color: isDarkMode ? "#fca5a5" : "#b91c1c" },
              ]}
            >
              {t("logOut")}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.versionText, { color: "#9ca3af" }]}>
            {t("appVersion")
              .replace("{version}", "2.4.1")
              .replace("{build}", "204")}
          </Text>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLanguageModal}
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDarkMode ? "#1c2e24" : "#fff" },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: isDarkMode ? "#fff" : "#111827" },
                ]}
              >
                {t("selectLanguage")}
              </Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={isDarkMode ? "#9ca3af" : "#4b5563"}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={languageOptions}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.languageOption}
                  onPress={() => handleLanguageChange(item.code)}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      { color: isDarkMode ? "#fff" : "#111827" },
                    ]}
                  >
                    {item.name}
                  </Text>
                  {currentLanguageCode === item.code && (
                    <MaterialIcons name="check" size={24} color="#36e27b" />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: isDarkMode ? "#253b30" : "#e5e7eb" },
                  ]}
                />
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

type SettingsItem = {
  icon: string;
  iconBg: string;
  label: string;
  subtitle: string;
  rightContent?: React.ReactNode;
  onPress?: () => void; // Add optional onPress handler
};

function SettingsSection({
  title,
  items,
  isDarkMode,
}: {
  title: string;
  items: SettingsItem[];
  isDarkMode: boolean;
}) {
  return (
    <View style={{ marginVertical: 8 }}>
      <Text
        style={[
          styles.sectionTitle,
          { color: isDarkMode ? "#9ca3af" : "#6b7280" },
        ]}
      >
        {title}
      </Text>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: isDarkMode ? "#1c2e24" : "#fff" },
        ]}
      >
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={item.onPress}
            >
              <View
                style={[styles.iconWrapper, { backgroundColor: item.iconBg }]}
              >
                <MaterialIcons
                  name={item.icon as any}
                  size={24}
                  color={item.iconBg ? item.iconBg : "#000"}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text
                  style={[
                    styles.settingsLabel,
                    { color: isDarkMode ? "#fff" : "#111827" },
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.settingsSubtitle,
                    { color: isDarkMode ? "#9ca3af" : "#6b7280" },
                  ]}
                >
                  {item.subtitle}
                </Text>
              </View>
              {item.rightContent || (
                <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
              )}
            </TouchableOpacity>
            {index < items.length - 1 && (
              <View
                style={[
                  styles.divider,
                  { backgroundColor: isDarkMode ? "#253b30" : "#e5e7eb" },
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "bold" },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
  profileSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  profileImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageBorder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#fff",
    overflow: "hidden",
  },
  profileImage: { width: "100%", height: "100%", borderRadius: 36 },
  shopName: { fontSize: 18, fontWeight: "bold" },
  planText: { fontSize: 12 },
  editProfile: { fontSize: 14, marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: "600", marginVertical: 4 },
  sectionCard: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  settingsButton: { flexDirection: "row", alignItems: "center", padding: 12 },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsLabel: { fontSize: 14, fontWeight: "600" },
  settingsSubtitle: { fontSize: 10 },
  divider: { height: 1, marginLeft: 50 },
  themeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  themeTagText: { fontSize: 10, fontWeight: "500", color: "#6b7280" },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
  },
  logoutText: { fontWeight: "600", marginLeft: 6 },
  versionText: { fontSize: 10, textAlign: "center", marginTop: 8 },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end", // Align to bottom
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%", // Limit modal height
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  languageOptionText: {
    fontSize: 16,
    marginRight: 10,
  },
});
