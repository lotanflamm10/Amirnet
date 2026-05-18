export type MockUser = {
  id: string;
  email: string;
  name: string;
  role: "student" | "admin";
  plan: "free" | "pro" | "unlimited";
};

const MOCK_ADMIN_USER: MockUser = {
  id: "mock-admin-001",
  email: "admin@amirnet.local",
  name: "Mock Admin",
  role: "admin",
  plan: "unlimited",
};

const MOCK_STUDENT_USER: MockUser = {
  id: "mock-student-001",
  email: "student@amirnet.local",
  name: "Guest Student",
  role: "student",
  plan: "free",
};

// In mock mode, always return admin so all features are accessible during development.
// Replace with real auth (NextAuth / Supabase) when ready.
export function getMockUser(): MockUser {
  return MOCK_ADMIN_USER;
}

export function getMockStudent(): MockUser {
  return MOCK_STUDENT_USER;
}

export function isMockAdmin(): boolean {
  return true;
}
