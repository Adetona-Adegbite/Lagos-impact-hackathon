import { executeSql } from "./database";
import { SyncService } from "./sync";

export interface User {
  id: string;
  phoneNumber: string;
  shopName: string | null;
}

export interface AuthData {
  token: string;
  user: User;
}

export const authStorage = {
  /**
   * Save authentication data to local database
   */
  saveAuthData: async (token: string, user: User): Promise<void> => {
    try {
      await executeSql("BEGIN TRANSACTION");

      // Save token
      await executeSql(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        ["token", token],
      );

      // Save user
      await executeSql(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        ["user", JSON.stringify(user)],
      );

      await executeSql("COMMIT");
    } catch (error) {
      await executeSql("ROLLBACK");
      console.error("Failed to save auth data:", error);
      throw error;
    }
  },

  /**
   * Retrieve authentication data from local database
   */
  getAuthData: async (): Promise<AuthData | null> => {
    try {
      const result = await executeSql(
        "SELECT key, value FROM settings WHERE key IN ('token', 'user')",
      );

      let token: string | null = null;
      let user: User | null = null;

      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        if (row.key === "token") {
          token = row.value;
        } else if (row.key === "user") {
          try {
            user = JSON.parse(row.value);
          } catch (e) {
            console.warn("Failed to parse stored user data");
          }
        }
      }

      if (token && user) {
        return { token, user };
      }

      return null;
    } catch (error) {
      console.error("Failed to get auth data:", error);
      return null;
    }
  },

  /**
   * Clear authentication data (Logout)
   */
  clearAuthData: async (): Promise<void> => {
    try {
      try {
        // Try to sync any pending data before logging out
        await SyncService.syncAll();
      } catch (syncError) {
        console.warn("Sync failed on logout, proceeding anyway:", syncError);
      }
      await executeSql("DELETE FROM settings WHERE key IN ('token', 'user')");
    } catch (error) {
      console.error("Failed to clear auth data:", error);
      throw error;
    }
  },

  /**
   * Get just the token (helper for API calls)
   */
  getToken: async (): Promise<string | null> => {
    try {
      const result = await executeSql(
        "SELECT value FROM settings WHERE key = ?",
        ["token"],
      );

      if (result.rows.length > 0) {
        return result.rows.item(0).value;
      }
      return null;
    } catch (error) {
      return null;
    }
  },
};
