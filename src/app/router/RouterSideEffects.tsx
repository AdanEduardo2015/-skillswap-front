import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { useLocation, useNavigate } from "react-router-dom";
import { usePushNotifications } from "../../components/hooks/usePushNotifications";
import { setPathLayoutState } from "../../utils/GlobalVariables";
import type { RouteLayoutState } from "./routeLayout";

interface RouterSideEffectsProps {
  onLayoutChange: (pathsState: RouteLayoutState) => void;
}

export default function RouterSideEffects({ onLayoutChange }: RouterSideEffectsProps) {
  const location = useLocation();
  const navigate = useNavigate();

  usePushNotifications(location.pathname);

  useEffect(() => {
    window.scrollTo(0, 0);
    onLayoutChange(setPathLayoutState(location.pathname));
  }, [location.pathname, onLayoutChange]);

  useEffect(() => {
    const urlListener = CapacitorApp.addListener("appUrlOpen", (data) => {
      if (!data.url) return;

      try {
        const url = new URL(data.url);
        navigate(url.pathname + url.search);
      } catch {
        // Ignore malformed app links; the native listener can receive non-URL payloads.
      }
    });

    return () => {
      urlListener.then((listener) => listener.remove());
    };
  }, [navigate]);

  return null;
}
