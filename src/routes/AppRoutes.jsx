import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import BodyClassSync from "./BodyClassSync";
// Pages existantes (auth + home + dashboard)
import Home from "../pages/Home/Home";
import Register from "../pages/auth/Register/Register";
import Login from "../pages/auth/Login/Login";
import Verify from "../pages/auth/Verify/Verify";
import ForgotPassword from "../pages/auth/ForgotPassword/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword/ResetPassword";
import Dashboard from "../pages/dashboard/Dashboard";
import UserProfile from "../pages/dashboard/UserProfile";
import DashboardLayout from "../components/layout/DashboardLayout";
import AdminEditMyProfile from "../pages/admin/profile/AdminEditMyProfile";
import AdminLayout from "../components/admin/AdminLayout";
import PublicRoute from "./PublicRoute";
import PrivateRoute from "./PrivateRoute";
import AdminRoute from "./AdminRoute";

// Pages EduGame (admin, educator, player, parent)
import AdminDashboard from "../pages/admin/dashboard/AdminDashboard";
import Players from "../pages/admin/manage-users/Players";
import PlayerDetail from "../pages/admin/manage-users/PlayerDetail";
import EditPlayer from "../pages/admin/manage-users/EditPlayer";
import Games from "../pages/admin/manage-games/Games";
import GameDetail from "../pages/admin/manage-games/GameDetail";
import AddGame from "../pages/admin/manage-games/AddGame";
import EditGame from "../pages/admin/manage-games/EditGame";
import AdminBadges from "../pages/admin/manage-badges/Badges";
import AddBadge from "../pages/admin/manage-badges/AddBadge";
import EditBadge from "../pages/admin/manage-badges/EditBadge";
import Moderation from "../pages/admin/moderation/Moderation";
import Statistics from "../pages/admin/statistics/Statistics";

import EducatorDashboard from "../pages/educator/EducatorDashboard";
import EducatorQuestions from "../pages/educator/Questions";
import AddQuestion from "../pages/educator/AddQuestion";
import EditQuestion from "../pages/educator/EditQuestion";
import EducatorGames from "../pages/educator/EducatorGames";
import GameQuestions from "../pages/educator/GameQuestions";
import ConfigureMemoryGame from "../pages/educator/ConfigureMemoryGame";
import EducatorStatistics from "../pages/educator/EducatorStatistics";

import PlayerDashboard from "../pages/player/PlayerDashboard";
import NewGame from "../pages/player/NewGame";
import WaitingRoom from "../pages/player/WaitingRoom";
import QuizGame from "../pages/player/games/QuizGame";
import MemoryGame from "../pages/player/games/MemoryGame";
import LogicGame from "../pages/player/games/LogicGame";
import ReflexGame from "../pages/player/games/ReflexGame";
import GameResult from "../pages/player/GameResult";
import PlayerProgress from "../pages/player/Progress";
import PlayerHistory from "../pages/player/History";
import PlayerBadges from "../pages/player/Badges";
import PlayerProfile from "../pages/player/Profile";
import PlayerRanking from "../pages/player/Ranking";

import ParentDashboard from "../pages/parent/ParentDashboard";
import ChildProgress from "../pages/parent/ChildProgress";
import ParentAnalytics from "../pages/parent/Analytics";

function AppRoutes() {
  return (
    <BrowserRouter>
      <BodyClassSync />
      <Routes>
        {/* Auth – interfaces conservées */}
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route path="/verify" element={<Verify />} />

        {/* Dashboard utilisateur existant */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<UserProfile />} />
        </Route>

        {/* Admin – layout commun (sidebar + barre recherche/notifications/avatar) + pages */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="players" element={<Players />} />
          <Route path="players/:id" element={<PlayerDetail />} />
          <Route path="players/:id/edit" element={<EditPlayer />} />
          <Route path="games" element={<Games />} />
          <Route path="games/add" element={<AddGame />} />
          <Route path="games/:id/edit" element={<EditGame />} />
          <Route path="games/:id" element={<GameDetail />} />
          <Route path="badges" element={<AdminBadges />} />
          <Route path="badges/add" element={<AddBadge />} />
          <Route path="badges/:id/edit" element={<EditBadge />} />
          <Route path="moderation" element={<Moderation />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="me/edit" element={<AdminEditMyProfile />} />
        </Route>

        {/* Éducateur – template EduGame */}
        <Route path="/educator/dashboard" element={<PrivateRoute><EducatorDashboard /></PrivateRoute>} />
        <Route path="/educator/questions" element={<PrivateRoute><EducatorQuestions /></PrivateRoute>} />
        <Route path="/educator/questions/add" element={<PrivateRoute><AddQuestion /></PrivateRoute>} />
        <Route path="/educator/questions/:id/edit" element={<PrivateRoute><EditQuestion /></PrivateRoute>} />
        <Route path="/educator/games" element={<PrivateRoute><EducatorGames /></PrivateRoute>} />
        <Route path="/educator/games/quiz/:gameId/questions" element={<PrivateRoute><GameQuestions /></PrivateRoute>} />
        <Route path="/educator/games/memory/:gameId/configure" element={<PrivateRoute><ConfigureMemoryGame /></PrivateRoute>} />
        <Route path="/educator/statistics" element={<PrivateRoute><EducatorStatistics /></PrivateRoute>} />

        {/* Joueur – template EduGame */}
        <Route path="/player/dashboard" element={<PrivateRoute><PlayerDashboard /></PrivateRoute>} />
        <Route path="/player/new-game" element={<PrivateRoute><NewGame /></PrivateRoute>} />
        <Route path="/player/waiting-room/:gameId" element={<PrivateRoute><WaitingRoom /></PrivateRoute>} />
        <Route path="/player/game/quiz/:gameId" element={<PrivateRoute><QuizGame /></PrivateRoute>} />
        <Route path="/player/game/memory/:gameId" element={<PrivateRoute><MemoryGame /></PrivateRoute>} />
        <Route path="/player/game/logic/:gameId" element={<PrivateRoute><LogicGame /></PrivateRoute>} />
        <Route path="/player/game/reflex/:gameId" element={<PrivateRoute><ReflexGame /></PrivateRoute>} />
        <Route path="/player/game-result" element={<PrivateRoute><GameResult /></PrivateRoute>} />
        <Route path="/player/progress" element={<PrivateRoute><PlayerProgress /></PrivateRoute>} />
        <Route path="/player/history" element={<PrivateRoute><PlayerHistory /></PrivateRoute>} />
        <Route path="/player/badges" element={<PrivateRoute><PlayerBadges /></PrivateRoute>} />
        <Route path="/player/profile" element={<PrivateRoute><PlayerProfile /></PrivateRoute>} />
        <Route path="/player/ranking" element={<PrivateRoute><PlayerRanking /></PrivateRoute>} />

        {/* Parent – template EduGame */}
        <Route path="/parent/dashboard" element={<PrivateRoute><ParentDashboard /></PrivateRoute>} />
        <Route path="/parent/child-progress" element={<PrivateRoute><ChildProgress /></PrivateRoute>} />
        <Route path="/parent/analytics" element={<PrivateRoute><ParentAnalytics /></PrivateRoute>} />
        <Route path="/parent/badges" element={<PrivateRoute><PlayerBadges /></PrivateRoute>} />
        <Route path="/parent/history" element={<PrivateRoute><PlayerHistory /></PrivateRoute>} />

        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
