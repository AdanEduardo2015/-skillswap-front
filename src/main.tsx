import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
import './index.css';
import './awsConfig.ts';
import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, useLocation, useNavigate } from "react-router-dom";
import { PathsInitializer, paths } from "./utils/GlobalVariables.tsx";
import { useMediaQuery } from "./components/hooks/UseMediaQuery.ts";

import RootLayout from './components/layouts/RootLayout.tsx';
import AppLinkPrompt from './components/AppLinkPrompt.tsx';
import NetworkLoader from './components/NetworkLoader.tsx';
import { useNotificationPolling } from './components/hooks/useNotificationPolling.ts';
import { usePushNotifications } from './components/hooks/usePushNotifications.ts';

import { App as CapacitorApp } from '@capacitor/app';

const system = createSystem(defaultConfig, {
    theme: {
        tokens: {
            colors: {
                brand: {
                    100: { value: '#f7fafc' },
                    900: { value: '#171923' },
                },
            },
        },
    },
    globalCss: {
        body: {
            bg: 'var(--bg-color)',
            color: 'var(--text-color)',
        },
    },
});

function NavigatorAndPaths({ setPathsState }: { setPathsState: any }) {
    const location = useLocation();
    const navigate = useNavigate();

    usePushNotifications(location.pathname);

    useEffect(() => {
        setPathsState({ ...paths });
        const urlListener = CapacitorApp.addListener('appUrlOpen', data => {
            if (data.url) {
                try {
                    const url = new URL(data.url);
                    const path = url.pathname + url.search;
                    navigate(path);
                } catch {
                }
            }
        });

        return () => {
            urlListener.then(listener => listener.remove());
        };
    }, [location, navigate, setPathsState]);

    return <PathsInitializer />;
}

function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}

function App() {
    const [pathsState, setPathsState] = useState(paths);
    const isDesktop = useMediaQuery("(min-width: 1024px)");

    useNotificationPolling();

    return (
        <Router>
            <ScrollToTop />
            <NavigatorAndPaths setPathsState={setPathsState} />
            <AppLinkPrompt />
            <NetworkLoader />

            <RootLayout isDesktop={isDesktop} pathsState={pathsState} />
        </Router>
    );
}

createRoot(document.getElementById("root")!).render(
        <ChakraProvider value={system}>
            <App />
        </ChakraProvider>
);
