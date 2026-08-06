import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Sanction } from "../types";

export interface UserData {
  email: string | null;
  name: string | null;
  role: string | null;
  profilePictureUrl: string | null;
  bio: string | null;
  location: string | null;
  interests: string[];
  specialty: string | null;
  followersCount: number;
  followingCount: number;
  ratingAvg: number;
  ratingCount: number;
  isBanned: boolean;
  isVerified: boolean;
  activeSanctions?: Sanction[];
}

export interface UserStore extends UserData {
  setEmail: (email: string | null) => void;
  setName: (name: string | null) => void;
  setRole: (role: string | null) => void;
  setProfilePictureUrl: (url: string | null) => void;
  setProfileData: (profile: Partial<UserData>) => void;
  resetUser: () => void;
}

export const useUserData = create<UserStore>()(
  persist(
    (set) => ({
      email: null,
      name: null,
      role: null,
      profilePictureUrl: null,
      bio: null,
      location: null,
      interests: [],
      specialty: null,
      followersCount: 0,
      followingCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
      isBanned: false,
      isVerified: false,
      activeSanctions: [],

      setEmail: (email) => set({ email }),
      setName: (name) => set({ name }),
      setRole: (role) => set({ role }),
      setProfilePictureUrl: (profilePictureUrl) => set({ profilePictureUrl }),
      setProfileData: (profile) => set(profile),

      resetUser: () =>
        set({
          email: null,
          name: null,
          role: null,
          profilePictureUrl: null,
          bio: null,
          location: null,
          interests: [],
          specialty: null,
          followersCount: 0,
          followingCount: 0,
          ratingAvg: 0,
          ratingCount: 0,
          isBanned: false,
          isVerified: false,
          activeSanctions: [],
        }),
    }),
    {
      name: "user-store",
    }
  )
);
