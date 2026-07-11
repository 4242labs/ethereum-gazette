import { AppShell } from "@/components/layout/AppShell";
import { MatomoTracker } from "@/components/analytics/MatomoTracker";
import { useThemeInit } from "@/hooks/useThemeInit";

function App() {
  useThemeInit();
  return (
    <>
      <MatomoTracker />
      <AppShell />
    </>
  );
}

export default App;
