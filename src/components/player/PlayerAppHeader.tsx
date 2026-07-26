import type { GameDTO } from '@/api/types/api.types';
import PlayerHeaderActions from '@/components/player/PlayerHeaderActions';
import PlayerGameSearch from '@/components/player/PlayerGameSearch';
import PlayerNotificationsBell from '@/components/player/PlayerNotificationsBell';

type PlayerAppHeaderProps = {
  searchGames: GameDTO[];
  notificationGames: GameDTO[];
  onSelectGame: (game: GameDTO) => void;
};

export default function PlayerAppHeader({
  searchGames,
  notificationGames,
  onSelectGame,
}: PlayerAppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-indigo-400/20 bg-[#060918]/85 backdrop-blur-2xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 shrink-0 items-center">
          <img
            src="/logo-edugame.png"
            alt="EduGame"
            className="h-16 w-auto max-w-[140px] object-contain object-left sm:h-20 sm:max-w-[200px]"
          />
        </div>

        <div className="hidden min-w-0 flex-1 lg:block">
          <PlayerGameSearch games={searchGames} onSelectGame={onSelectGame} />
        </div>

        <div className="ml-auto flex shrink-0 items-center">
          <PlayerHeaderActions />
          <PlayerNotificationsBell games={notificationGames} className="ml-4 sm:ml-6" />
        </div>
      </div>

      <div className="border-t border-white/5 px-4 pb-3 lg:hidden">
        <PlayerGameSearch games={searchGames} onSelectGame={onSelectGame} />
      </div>
    </header>
  );
}
