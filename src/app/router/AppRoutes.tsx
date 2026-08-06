import { lazy, Suspense } from "react";
import { Box, Spinner } from "@chakra-ui/react";
import { Navigate, Route, Routes } from "react-router-dom";
import RouteGuard from "./RouteGuard";
import { AUTHENTICATED_ROUTE, ROUTE_DEFINITIONS, ROUTE_PATHS } from "./routeConfig";

const Home = lazy(() => import("../../components/Home"));
const Login = lazy(() => import("../../components/Login"));
const SignUp = lazy(() => import("../../components/SignUp"));
const Search = lazy(() => import("../../components/Search"));
const NotFound = lazy(() => import("../../components/NotFound"));
const MyProfile = lazy(() => import("../../components/MyProfile"));
const UserProfile = lazy(() => import("../../components/UserProfile"));
const EditProfile = lazy(() => import("../../components/EditProfile"));
const LoggedLayout = lazy(() => import("../../components/layouts/LoggedLayout"));
const EditPassword = lazy(() => import("../../components/EditPassword"));
const ConfirmSignUp = lazy(() => import("../../components/ConfirmSignUp"));
const ResetPassword = lazy(() => import("../../components/ResetPassword"));
const Notifications = lazy(() => import("../../components/Notifications"));
const Messages = lazy(() => import("../../components/Messages"));
const ForgotPassword = lazy(() => import("../../components/ForgotPassword"));
const ViewPublication = lazy(() => import("../../components/ViewPublication"));
const CreatePublication = lazy(() => import("../../components/CreatePublication"));
const PreviewPublication = lazy(() => import("../../components/PreviewPublication"));
const CreatorDashboard = lazy(() => import("../../components/creator/CreatorDashboard"));
const AdminCategories = lazy(() => import("../../components/admin/AdminCategories"));
const AdminReports = lazy(() => import("../../components/admin/AdminReports"));
const AdminSanctions = lazy(() => import("../../components/admin/AdminSanctions"));
const AdminAppeals = lazy(() => import("../../components/admin/AdminAppeals"));
const SetupMFA = lazy(() => import("../../components/SetupMFA"));
const VerifyMFA = lazy(() => import("../../components/VerifyMFA"));
const OAuthCallback = lazy(() => import("../../components/OAuthCallback"));

function RouteFallback() {
  return (
    <Box minH="50vh" display="flex" alignItems="center" justifyContent="center">
      <Spinner color="white" />
    </Box>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route
          path={ROUTE_PATHS.home}
          element={
            <RouteGuard routeDefinition={ROUTE_DEFINITIONS.home}>
              <Home />
            </RouteGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.login}
          element={
            <RouteGuard routeDefinition={ROUTE_DEFINITIONS.login}>
              <Login />
            </RouteGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.signUp}
          element={
            <RouteGuard routeDefinition={ROUTE_DEFINITIONS.signUp}>
              <SignUp />
            </RouteGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.search}
          element={
            <RouteGuard routeDefinition={ROUTE_DEFINITIONS.search}>
              <Search />
            </RouteGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.profile}
          element={
            <RouteGuard routeDefinition={ROUTE_DEFINITIONS.profile}>
              <UserProfile />
            </RouteGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.verifyMfa}
          element={
            <RouteGuard routeDefinition={ROUTE_DEFINITIONS.verifyMfa}>
              <VerifyMFA />
            </RouteGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.publication}
          element={
            <RouteGuard routeDefinition={ROUTE_DEFINITIONS.publication}>
              <ViewPublication />
            </RouteGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.confirmSignup}
          element={
            <RouteGuard routeDefinition={ROUTE_DEFINITIONS.confirmSignup}>
              <ConfirmSignUp />
            </RouteGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.resetPassword}
          element={
            <RouteGuard routeDefinition={ROUTE_DEFINITIONS.resetPassword}>
              <ResetPassword />
            </RouteGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.oauthCallback}
          element={
            <RouteGuard routeDefinition={ROUTE_DEFINITIONS.oauthCallback}>
              <OAuthCallback />
            </RouteGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.forgotPassword}
          element={
            <RouteGuard routeDefinition={ROUTE_DEFINITIONS.forgotPassword}>
              <ForgotPassword />
            </RouteGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.notFound}
          element={
            <RouteGuard routeDefinition={ROUTE_DEFINITIONS.notFound}>
              <NotFound />
            </RouteGuard>
          }
        />
        <Route path="*" element={<Navigate to={ROUTE_PATHS.notFound} replace />} />

        <Route
          element={
            <RouteGuard routeDefinition={AUTHENTICATED_ROUTE}>
              <LoggedLayout />
            </RouteGuard>
          }
        >
          <Route
            path={ROUTE_PATHS.setupMfa}
            element={
              <RouteGuard routeDefinition={ROUTE_DEFINITIONS.setupMfa}>
                <SetupMFA />
              </RouteGuard>
            }
          />
          <Route
            path={ROUTE_PATHS.myProfile}
            element={
              <RouteGuard routeDefinition={ROUTE_DEFINITIONS.myProfile}>
                <MyProfile />
              </RouteGuard>
            }
          />
          <Route
            path={ROUTE_PATHS.editProfile}
            element={
              <RouteGuard routeDefinition={ROUTE_DEFINITIONS.editProfile}>
                <EditProfile />
              </RouteGuard>
            }
          />
          <Route
            path={ROUTE_PATHS.editPassword}
            element={
              <RouteGuard routeDefinition={ROUTE_DEFINITIONS.editPassword}>
                <EditPassword />
              </RouteGuard>
            }
          />
          <Route
            path={ROUTE_PATHS.notifications}
            element={
              <RouteGuard routeDefinition={ROUTE_DEFINITIONS.notifications}>
                <Notifications />
              </RouteGuard>
            }
          />
          <Route
            path={ROUTE_PATHS.messages}
            element={
              <RouteGuard routeDefinition={ROUTE_DEFINITIONS.messages}>
                <Messages />
              </RouteGuard>
            }
          />
          <Route
            path={ROUTE_PATHS.createPublication}
            element={
              <RouteGuard routeDefinition={ROUTE_DEFINITIONS.createPublication}>
                <CreatePublication />
              </RouteGuard>
            }
          />
          <Route
            path={ROUTE_PATHS.previewPublication}
            element={
              <RouteGuard routeDefinition={ROUTE_DEFINITIONS.previewPublication}>
                <PreviewPublication />
              </RouteGuard>
            }
          />
          <Route
            path={ROUTE_PATHS.creatorDashboard}
            element={
              <RouteGuard routeDefinition={ROUTE_DEFINITIONS.creatorDashboard}>
                <CreatorDashboard />
              </RouteGuard>
            }
          />
          <Route
            path={ROUTE_PATHS.adminCategories}
            element={
              <RouteGuard routeDefinition={ROUTE_DEFINITIONS.adminCategories}>
                <AdminCategories />
              </RouteGuard>
            }
          />
          <Route
            path={ROUTE_PATHS.adminReports}
            element={
              <RouteGuard routeDefinition={ROUTE_DEFINITIONS.adminReports}>
                <AdminReports />
              </RouteGuard>
            }
          />
          <Route
            path={ROUTE_PATHS.adminSanctions}
            element={
              <RouteGuard routeDefinition={ROUTE_DEFINITIONS.adminSanctions}>
                <AdminSanctions />
              </RouteGuard>
            }
          />
          <Route
            path={ROUTE_PATHS.adminAppeals}
            element={
              <RouteGuard routeDefinition={ROUTE_DEFINITIONS.adminAppeals}>
                <AdminAppeals />
              </RouteGuard>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}
