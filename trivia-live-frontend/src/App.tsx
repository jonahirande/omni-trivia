import { Route, Routes } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { ProfilePicker } from './components/ProfilePicker';
import { HomePage } from './pages/HomePage';
import { QuickPlayPage } from './pages/QuickPlayPage';
import { LiveLobbyPage } from './pages/LiveLobbyPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { UserProfile } from './types';

export default function App() {
  const [profile, setProfile] = useLocalStorage<UserProfile | null>('trivio.profile', null);

  return (
    <div className="min-h-screen pb-16 sm:pb-0">
      <NavBar profile={profile} />

      {!profile ? (
        <ProfilePicker onSave={setProfile} />
      ) : (
        <Routes>
          <Route path="/" element={<HomePage profile={profile} />} />
          <Route path="/quick-play" element={<QuickPlayPage profile={profile} />} />
          <Route path="/live" element={<LiveLobbyPage profile={profile} />} />
          <Route path="/leaderboard" element={<LeaderboardPage profile={profile} />} />
        </Routes>
      )}
    </div>
  );
}
