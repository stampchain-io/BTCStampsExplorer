import { useEffect, useState } from "preact/hooks";
import { SecurityService } from "$server/services/security/securityService.ts";

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  requiredToken?: string; // The SRC20 token required to play this track
  requiredAmount?: string; // The minimum amount required
  stampId?: string; // The stamp ID required to play this track
}

interface MusicSectionProps {
  balances?: any[]; // SRC20 token balances
}

export function MusicSection({ balances = [] }: MusicSectionProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>("");

  const titleGreyDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black gray-gradient3";
  const subTitleGrey =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl font-extralight text-stamp-grey-light mb-1.5 mobileLg:mb-3";
  const bodyTextLight =
    "text-base mobileLg:text-lg font-medium text-stamp-grey-light";

  useEffect(() => {
    // Initialize with tracks that require specific tokens
    setTracks([
      {
        id: "no-funk",
        title: "No Funk with Viagra",
        artist: "Artist 1",
        duration: "3:45",
        stampId: "A18429515139172954198",
      },
      {
        id: "money-maniacs",
        title: "Money Maniacs",
        artist: "Artist 2",
        duration: "4:20",
        requiredToken: "$BALD",
        requiredAmount: "100",
      },
    ]);

    // Get CSRF token
    SecurityService.generateCSRFToken().then((token) => setCsrfToken(token));
  }, []);

  const canPlayTrack = (track: Track) => {
    // If track requires a specific stamp ID
    if (track.stampId) {
      // TODO: Check if user owns the stamp
      // For now, return true for testing
      return true;
    }

    // If track requires a token
    if (track.requiredToken && track.requiredAmount) {
      const balance = balances.find((b) => b.tick === track.requiredToken);
      if (!balance) return false;
      return BigInt(balance.amt) >= BigInt(track.requiredAmount);
    }

    return true;
  };

  const playTrack = async (track: Track) => {
    if (!canPlayTrack(track)) {
      if (track.requiredToken && track.requiredAmount) {
        alert(
          `You need at least ${track.requiredAmount} ${track.requiredToken} tokens to play this track`,
        );
      } else if (track.stampId) {
        alert(`You need to own stamp #${track.stampId} to play this track`);
      }
      return;
    }
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const getAudioUrl = (trackId: string) => {
    const url = `/api/internal/secure-audio/${trackId}`;
    const audio = new Audio(url);
    audio.addEventListener("loadstart", () => {
      if (csrfToken) {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
          if (
            typeof args[0] === "string" && args[0].includes("/secure-audio/")
          ) {
            const [resource, config] = args;
            const newConfig = {
              ...config,
              headers: {
                ...config?.headers,
                "x-csrf-token": csrfToken,
              },
            };
            return originalFetch(resource, newConfig);
          }
          return originalFetch(...args);
        };
      }
    });
    return url;
  };

  return (
    <section>
      <h1 className={titleGreyDL}>MUSIC</h1>
      <h2 className={subTitleGrey}>FEATURED TRACKS</h2>

      <div className="flex flex-col gap-6">
        {/* Current track player */}
        {currentTrack && (
          <div className="stamp-audio-container">
            <audio
              className="stamp-audio-player"
              src={getAudioUrl(currentTrack.id)}
              controls
              autoPlay={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
          </div>
        )}

        {/* Track list */}
        <div className="grid grid-cols-1 gap-3">
          {tracks.map((track) => {
            const isPlayable = canPlayTrack(track);
            return (
              <div
                key={track.id}
                className={`flex items-center justify-between p-4 bg-stamp-card-bg rounded-lg ${
                  isPlayable
                    ? "cursor-pointer hover:bg-stamp-card-bg-hover"
                    : "opacity-50"
                } transition-colors`}
                onClick={() => isPlayable && playTrack(track)}
              >
                <div className="flex flex-col">
                  <span className={bodyTextLight}>{track.title}</span>
                  <span className="text-sm text-stamp-grey">
                    {track.artist}
                  </span>
                  {track.requiredToken && (
                    <span className="text-xs text-stamp-grey-light mt-1">
                      Requires {track.requiredAmount} {track.requiredToken}
                    </span>
                  )}
                  {track.stampId && (
                    <span className="text-xs text-stamp-grey-light mt-1">
                      Requires Stamp #{track.stampId}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm text-stamp-grey">
                    {track.duration}
                  </span>
                  {!isPlayable && (
                    <span className="text-xs text-red-400">Locked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
