import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import BodyClassSync from "./BodyClassSync";
import AdminLayout from "../components/admin/AdminLayout";
import PublicRoute from "./PublicRoute";
import PrivateRoute from "./PrivateRoute";
import AdminRoute from "./AdminRoute";
import SponsorRoute from "./SponsorRoute";

const Home = lazy(() => import("../pages/Home/Home"));
const Register = lazy(() => import("../pages/auth/Register/Register"));
const Login = lazy(() => import("../pages/auth/Login/Login"));
const Verify = lazy(() => import("../pages/auth/Verify/Verify"));
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/auth/ResetPassword/ResetPassword"));
const AdminEditMyProfile = lazy(() => import("../pages/admin/profile/AdminEditMyProfile"));
const AdminDashboard = lazy(() => import("../pages/admin/dashboard/AdminDashboard"));
const Players = lazy(() => import("../pages/admin/manage-users/Players"));
const PlayerDetail = lazy(() => import("../pages/admin/manage-users/PlayerDetail"));
const EditPlayer = lazy(() => import("../pages/admin/manage-users/EditPlayer"));
const Games = lazy(() => import("../pages/admin/manage-games/Games"));
const GameDetail = lazy(() => import("../pages/admin/manage-games/GameDetail"));
const AddGame = lazy(() => import("../pages/admin/manage-games/AddGame"));
const EditGame = lazy(() => import("../pages/admin/manage-games/EditGame"));
const AdminBadges = lazy(() => import("../pages/admin/manage-badges/Badges"));
const AddBadge = lazy(() => import("../pages/admin/manage-badges/AddBadge"));
const EditBadge = lazy(() => import("../pages/admin/manage-badges/EditBadge"));
const Moderation = lazy(() => import("../pages/admin/moderation/Moderation"));
const Statistics = lazy(() => import("../pages/admin/statistics/Statistics"));
const EducatorDashboard = lazy(() => import("../pages/educator/dashboard/EducatorDashboard"));
const AddQuestion = lazy(() => import("../pages/educator/questions/AddQuestion"));
const EditQuestion = lazy(() => import("../pages/educator/questions/EditQuestion"));
const EducatorGames = lazy(() => import("../pages/educator/games/EducatorGames"));
const EducatorManageGames = lazy(() => import("../pages/educator/games/manage-games/EducatorManageGames"));
const EducatorAddGame = lazy(() => import("../pages/educator/games/manage-games/EducatorAddGame"));
const EducatorEditGame = lazy(() => import("../pages/educator/games/manage-games/EducatorEditGame"));
const EducatorViewGame = lazy(() => import("../pages/educator/games/manage-games/EducatorViewGame"));
const EducatorGameTypeSection = lazy(() => import("../pages/educator/games/manage-games/EducatorGameTypeSection"));
const GameQuestions = lazy(() => import("../pages/educator/questions/GameQuestions"));
const ViewQuestion = lazy(() => import("../pages/educator/questions/ViewQuestion"));
const ConfigureMemoryGame = lazy(() => import("../pages/educator/games/ConfigureMemoryGame"));
const ConfigureReflexGame = lazy(() => import("../pages/educator/games/ConfigureReflexGame"));
const ConfigureLogicGame = lazy(() => import("../pages/educator/games/ConfigureLogicGame"));
const EducatorStatistics = lazy(() => import("../pages/educator/statistics/EducatorStatistics"));
const VoiceSeriesList = lazy(() => import("../pages/educator/voice/VoiceSeriesList"));
const VoiceSeriesEditor = lazy(() => import("../pages/educator/voice/VoiceSeriesEditor"));
const EducatorManageProfile = lazy(() => import("../pages/educator/profile/EducatorManageProfile"));
const PlayerDashboard = lazy(() => import("../pages/player/PlayerDashboard"));
const NewGame = lazy(() => import("../pages/player/NewGame"));
const WaitingRoom = lazy(() => import("../pages/player/WaitingRoom"));
const QuizGame = lazy(() => import("../pages/player/games/QuizGame"));
const MemoryGame = lazy(() => import("../pages/player/games/MemoryGame"));
const LogicGame = lazy(() => import("../pages/player/games/LogicGame"));
const ReflexGame = lazy(() => import("../pages/player/games/ReflexGame"));
const VoiceCatalog = lazy(() => import("../pages/player/voice/VoiceCatalog"));
const VoicePractice = lazy(() => import("../pages/player/voice/VoicePractice"));
const VoiceResult = lazy(() => import("../pages/player/voice/VoiceResult"));
const GameResult = lazy(() => import("../pages/player/GameResult"));
const PlayerProgress = lazy(() => import("../pages/player/Progress"));
const PlayerHistory = lazy(() => import("../pages/player/History"));
const PlayerBadges = lazy(() => import("../pages/player/Badges"));
const PlayerRewards = lazy(() => import("../pages/player/Rewards"));
const PlayerProfile = lazy(() => import("../pages/player/Profile"));
const PlayerRanking = lazy(() => import("../pages/player/Ranking"));
const ParentDashboard = lazy(() => import("../pages/parent/ParentDashboard"));
const ChildProgress = lazy(() => import("../pages/parent/ChildProgress"));
const ParentAnalytics = lazy(() => import("../pages/parent/Analytics"));
const ParentBadges = lazy(() => import("../pages/parent/ParentBadges"));
const ParentHistory = lazy(() => import("../pages/parent/ParentHistory"));
const SponsorDashboard = lazy(() => import("../pages/sponsor/SponsorDashboard"));

function ScrollToTopOnRouteChange() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return null;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <BodyClassSync />
      <ScrollToTopOnRouteChange />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-600">Chargement...</div>}>
      <Routes>
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="players" element={<Players />} />
          <Route path="players/:id" element={<PlayerDetail />} />
          <Route path="players/:id/edit" element={<EditPlayer />} />
          <Route path="games" element={<Games />} />
          <Route path="games/:id" element={<GameDetail />} />
          <Route path="badges" element={<AdminBadges />} />
          <Route path="badges/add" element={<AddBadge />} />
          <Route path="badges/:id/edit" element={<EditBadge />} />
          <Route path="moderation" element={<Moderation />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="me/edit" element={<AdminEditMyProfile />} />
        </Route>
        <Route path="/educator/dashboard" element={<PrivateRoute><EducatorDashboard /></PrivateRoute>} />
        <Route path="/educator/questions" element={<Navigate to="/educator/games/manage" replace />} />
        <Route path="/educator/questions/add" element={<PrivateRoute><AddQuestion /></PrivateRoute>} />
        <Route path="/educator/questions/:id/edit" element={<PrivateRoute><EditQuestion /></PrivateRoute>} />
        <Route path="/educator/questions/:id/view" element={<PrivateRoute><ViewQuestion /></PrivateRoute>} />
        <Route path="/educator/games" element={<PrivateRoute><EducatorGames /></PrivateRoute>} />
        <Route path="/educator/games/manage" element={<PrivateRoute><EducatorManageGames /></PrivateRoute>} />
        <Route path="/educator/games/manage/add" element={<PrivateRoute><EducatorAddGame /></PrivateRoute>} />
        <Route path="/educator/games/manage/:id/edit" element={<PrivateRoute><EducatorEditGame /></PrivateRoute>} />
        <Route path="/educator/games/manage/:id/view" element={<PrivateRoute><EducatorViewGame /></PrivateRoute>} />
        <Route path="/educator/games/type/:type" element={<PrivateRoute><EducatorGameTypeSection /></PrivateRoute>} />
        <Route path="/educator/games/quiz/:gameId/questions" element={<PrivateRoute><GameQuestions /></PrivateRoute>} />
        <Route path="/educator/games/memory/:gameId/configure" element={<PrivateRoute><ConfigureMemoryGame /></PrivateRoute>} />
        <Route path="/educator/games/reflex/:gameId/configure" element={<PrivateRoute><ConfigureReflexGame /></PrivateRoute>} />
        <Route path="/educator/games/logic/:gameId/configure" element={<PrivateRoute><ConfigureLogicGame /></PrivateRoute>} />
        <Route path="/educator/statistics" element={<PrivateRoute><EducatorStatistics /></PrivateRoute>} />
        <Route path="/educator/voice/series" element={<PrivateRoute><VoiceSeriesList /></PrivateRoute>} />
        <Route path="/educator/voice/series/add" element={<PrivateRoute><VoiceSeriesEditor /></PrivateRoute>} />
        <Route path="/educator/voice/series/:id/edit" element={<PrivateRoute><VoiceSeriesEditor /></PrivateRoute>} />
        <Route path="/educator/profile" element={<PrivateRoute><EducatorManageProfile /></PrivateRoute>} />
        <Route path="/player/dashboard" element={<PrivateRoute><PlayerDashboard /></PrivateRoute>} />
        <Route path="/player/new-game" element={<PrivateRoute><NewGame /></PrivateRoute>} />
        <Route path="/player/waiting-room/:gameId" element={<PrivateRoute><WaitingRoom /></PrivateRoute>} />
        <Route path="/player/game/quiz/:gameId" element={<PrivateRoute><QuizGame /></PrivateRoute>} />
        <Route path="/player/game/memory/:gameId" element={<PrivateRoute><MemoryGame /></PrivateRoute>} />
        <Route path="/player/game/logic/:gameId" element={<PrivateRoute><LogicGame /></PrivateRoute>} />
        <Route path="/player/game/reflex/:gameId" element={<PrivateRoute><ReflexGame /></PrivateRoute>} />
        <Route path="/player/voice" element={<PrivateRoute><VoiceCatalog /></PrivateRoute>} />
        <Route path="/player/voice/result" element={<PrivateRoute><VoiceResult /></PrivateRoute>} />
        <Route path="/player/voice/:seriesId" element={<PrivateRoute><VoicePractice /></PrivateRoute>} />
        <Route path="/player/game-result" element={<PrivateRoute><GameResult /></PrivateRoute>} />
        <Route path="/player/progress" element={<PrivateRoute><PlayerProgress /></PrivateRoute>} />
        <Route path="/player/history" element={<PrivateRoute><PlayerHistory /></PrivateRoute>} />
        <Route path="/player/badges" element={<PrivateRoute><PlayerBadges /></PrivateRoute>} />
        <Route path="/player/rewards" element={<PrivateRoute><PlayerRewards /></PrivateRoute>} />
        <Route path="/player/profile" element={<PrivateRoute><PlayerProfile /></PrivateRoute>} />
        <Route path="/player/ranking" element={<PrivateRoute><PlayerRanking /></PrivateRoute>} />
        <Route path="/parent/dashboard" element={<PrivateRoute><ParentDashboard /></PrivateRoute>} />
        <Route path="/parent/child-progress" element={<PrivateRoute><ChildProgress /></PrivateRoute>} />
        <Route path="/parent/analytics" element={<PrivateRoute><ParentAnalytics /></PrivateRoute>} />
        <Route path="/parent/badges" element={<PrivateRoute><ParentBadges /></PrivateRoute>} />
        <Route path="/parent/history" element={<PrivateRoute><ParentHistory /></PrivateRoute>} />
        <Route path="/sponsor/dashboard" element={<SponsorRoute><SponsorDashboard /></SponsorRoute>} />
        <Route path="/" element={<Home />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default AppRoutes;
