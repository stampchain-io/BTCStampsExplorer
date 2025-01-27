import { useEffect, useState } from "preact/hooks";
import { SecurityService } from "$server/services/security/securityService.ts";

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
}

export function MusicSection() {
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
    // Initialize with some sample tracks
    setTracks([
      { id: "1", title: "Track 1", artist: "Artist 1", duration: "3:45" },
      { id: "2", title: "Track 2", artist: "Artist 2", duration: "4:20" },
      { id: "3", title: "Track 3", artist: "Artist 3", duration: "2:55" },
    ]);

    // Get CSRF token
    SecurityService.generateCSRFToken().then((token) => setCsrfToken(token));
  }, []);

  const playTrack = async (track: Track) => {
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
          {tracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center justify-between p-4 bg-stamp-card-bg rounded-lg cursor-pointer hover:bg-stamp-card-bg-hover transition-colors"
              onClick={() => playTrack(track)}
            >
              <div className="flex flex-col">
                <span className={bodyTextLight}>{track.title}</span>
                <span className="text-sm text-stamp-grey">{track.artist}</span>
              </div>
              <span className="text-sm text-stamp-grey">{track.duration}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
