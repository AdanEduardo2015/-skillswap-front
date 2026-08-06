import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    coverage: {
      provider: "v8",
      include: [
        "src/features/publications/publicationForm.ts",
        "src/features/admin/categories/categoryForm.ts",
        "src/features/reports/reportForm.ts",
        "src/features/search/searchFilters.ts",
        "src/features/social/socialInteractions.ts",
        "src/domain/roles.ts",
        "src/app/auth/session.ts",
        "src/app/router/routeAccess.ts",
        "src/app/router/routeConfig.ts",
        "src/app/router/routeLayout.ts",
        "src/shared/ui/AppButton.tsx",
        "src/shared/ui/AppIconButton.tsx",
        "src/shared/ui/AppModal.tsx",
        "src/shared/ui/CategoryBadge.tsx",
        "src/shared/ui/ConfirmDialog.tsx",
        "src/shared/ui/EmptyState.tsx",
        "src/shared/ui/FilePicker.tsx",
        "src/shared/ui/LoadingState.tsx",
        "src/shared/ui/RatingStars.tsx",
        "src/shared/ui/RoleBadge.tsx",
        "src/shared/ui/TextField.tsx",
        "src/shared/ui/TextareaField.tsx",
        "src/utils/GlobalVariables.ts",
        "src/utils/UserStore.tsx",
      ],
      thresholds: {
        statements: 95,
        branches: 85,
        functions: 95,
        lines: 95,
      },
    },
  },
});
