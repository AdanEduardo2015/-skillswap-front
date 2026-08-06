import { describe, expect, it } from "vitest";
import { useUserData } from "./UserStore";

describe("UserStore Zustand Store", () => {
  it("allows setting single properties", () => {
    const { setEmail, setName, setRole, setProfilePictureUrl } = useUserData.getState();

    setEmail("user@example.com");
    expect(useUserData.getState().email).toBe("user@example.com");

    setName("John Doe");
    expect(useUserData.getState().name).toBe("John Doe");

    setRole("admin");
    expect(useUserData.getState().role).toBe("admin");

    setProfilePictureUrl("http://image.png");
    expect(useUserData.getState().profilePictureUrl).toBe("http://image.png");
  });

  it("allows setting multiple profile properties and resetting user data", () => {
    const { setProfileData, resetUser } = useUserData.getState();

    setProfileData({
      bio: "Software developer",
      location: "Mexico",
      interests: ["React", "TypeScript"],
      isBanned: false,
    });

    expect(useUserData.getState().bio).toBe("Software developer");
    expect(useUserData.getState().location).toBe("Mexico");
    expect(useUserData.getState().interests).toEqual(["React", "TypeScript"]);

    resetUser();
    expect(useUserData.getState().email).toBeNull();
    expect(useUserData.getState().name).toBeNull();
    expect(useUserData.getState().role).toBeNull();
    expect(useUserData.getState().bio).toBeNull();
    expect(useUserData.getState().interests).toEqual([]);
  });
});
