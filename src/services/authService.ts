import { supabase } from "../lib/supabase";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "teacher";
  department?: string;
}

class AuthService {
  private currentUser: AuthUser | null = null;

  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Authentication failed");
      }

      // Get staff details from the database
      const { data: staffData, error: staffError } = await supabase
        .from("staff_details")
        .select("*")
        .eq("user_id", authData.user.id)
        .single();

      if (staffError) {
        console.error("Error fetching staff details:", staffError);
        // If staff details not found, create a basic user object
        const user: AuthUser = {
          id: authData.user.id,
          email: authData.user.email || "",
          name: authData.user.email?.split("@")[0] || "User",
          role: "teacher", // Default role
        };
        this.currentUser = user;
        return user;
      }

      // Create user object from staff details
      const user: AuthUser = {
        id: authData.user.id, // Use authentication UID
        email: staffData.email,
        name: staffData.name,
        role: staffData.role as "admin" | "teacher",
        department: staffData.department,
      };

      this.currentUser = user;
      return user;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
      }
      this.currentUser = null;
    } catch (error) {
      console.error("Sign out error:", error);
      this.currentUser = null;
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      // Check if there's an active session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        this.currentUser = null;
        return null;
      }

      // If we already have the current user cached, return it
      if (this.currentUser) {
        return this.currentUser;
      }

      // Get staff details from the database
      const { data: staffData, error: staffError } = await supabase
        .from("staff_details")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (staffError) {
        console.error("Error fetching staff details:", staffError);
        return null;
      }

      // Create user object from staff details
      const user: AuthUser = {
        id: session.user.id, // Use authentication UID
        email: staffData.email,
        name: staffData.name,
        role: staffData.role as "admin" | "teacher",
        department: staffData.department,
      };

      this.currentUser = user;
      return user;
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  }

  // Helper method to check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}

export const authService = new AuthService();
