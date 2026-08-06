import { useState } from "react";
import RootLayout from "../components/layouts/RootLayout";
import AppLinkPrompt from "../components/AppLinkPrompt";
import NetworkLoader from "../components/NetworkLoader";
import { useNotificationPolling } from "../components/hooks/useNotificationPolling";
import RouterSideEffects from "./router/RouterSideEffects";
import { getRouteLayoutState, type RouteLayoutState } from "./router/routeLayout";

interface AppSideEffectsProps {
  onLayoutChange: (state: RouteLayoutState) => void;
}

function AppSideEffects({ onLayoutChange }: AppSideEffectsProps) {
  useNotificationPolling();

  return <RouterSideEffects onLayoutChange={onLayoutChange} />;
}

export default function App() {
  const [pathsState, setPathsState] = useState(() => getRouteLayoutState(window.location.pathname));

  return (
    <>
      <AppSideEffects onLayoutChange={setPathsState} />
      <AppLinkPrompt />
      <NetworkLoader />
      <RootLayout pathsState={pathsState} />
    </>
  );
}
