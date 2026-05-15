import React, { createContext, useContext, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "payment" | "info" | "success";
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, "id">) => void;
  notifications: Notification[];
}

const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
  notifications: [],
});

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = `${Date.now()}_${Math.random()}`;
      const notif = { ...notification, id };
      setNotifications((prev) => [...prev, notif]);

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 5000);
    },
    [],
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, notifications }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {notifications.map((notif) => (
          <NotificationToast
            key={notif.id}
            notification={notif}
            onDismiss={() => removeNotification(notif.id)}
          />
        ))}
      </View>
    </NotificationContext.Provider>
  );
}

function NotificationToast({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: () => void;
}) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(-20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onDismiss());
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  const iconColor =
    notification.type === "payment"
      ? "#dd4f05"
      : notification.type === "success"
        ? "#dd4f05"
        : "#60A5FA";

  const iconName =
    notification.type === "payment"
      ? "payments"
      : notification.type === "success"
        ? "check-circle"
        : "info";

  return (
    <Animated.View
      style={[styles.toast, { opacity, transform: [{ translateY }] }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${iconColor}22` }]}>
        <MaterialIcons name={iconName as any} size={20} color={iconColor} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message}>{notification.message}</Text>
      </View>
      <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
        <MaterialIcons name="close" size={16} color="#9CA3AF" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
    gap: 8,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c1c",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#333333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  closeBtn: {
    padding: 4,
  },
});
