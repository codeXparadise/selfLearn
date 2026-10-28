/**
 * YouTube Playlist Parser
 * Parses YouTube public/unlisted playlists without requiring an API key.
 */

export function extractPlaylistId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If already a playlist ID
  if (/^(PL|UU|LL|RD|OLAK)[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const listParam = url.searchParams.get('list');
    if (listParam) return listParam;
  } catch {
    const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  }

  return null;
}

export function parseDurationToSeconds(durationStr: string): number {
  if (!durationStr || typeof durationStr !== 'string') return 0;
  const parts = durationStr.split(':').map(Number);
  if (parts.some(isNaN)) return 0;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

export async function fetchPlaylistData(playlistId: string) {
  const url = `https://www.youtube.com/playlist?list=${playlistId}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch YouTube playlist (HTTP ${response.status})`);
  }

  const html = await response.text();
  const marker = 'ytInitialData = ';
  const idx = html.indexOf(marker);
  if (idx === -1) {
    throw new Error('Failed to parse YouTube playlist HTML structure.');
  }

  const jsonStart = idx + marker.length;
  let depth = 0;
  let inString = false;
  let escape = false;
  let jsonEnd = -1;

  for (let i = jsonStart; i < html.length; i++) {
    const char = html[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') depth++;
      else if (char === '}') {
        depth--;
        if (depth === 0) {
          jsonEnd = i + 1;
          break;
        }
      }
    }
  }

  if (jsonEnd === -1) {
    throw new Error('Could not extract playlist JSON tree from response.');
  }

  const jsonText = html.substring(jsonStart, jsonEnd);
  const data = JSON.parse(jsonText);

  // Extract playlist metadata
  const header = data.header?.playlistHeaderRenderer || {};
  const meta = data.metadata?.playlistMetadataRenderer || {};
  const microformat = data.microformat?.microformatDataRenderer || {};

  const title =
    header.title?.simpleText ||
    header.title?.runs?.[0]?.text ||
    meta.title ||
    'Custom Playlist Course';

  const description =
    header.descriptionText?.simpleText ||
    header.descriptionText?.runs?.[0]?.text ||
    microformat.description ||
    '';

  const channelTitle =
    header.ownerText?.runs?.[0]?.text ||
    header.ownerText?.simpleText ||
    'YouTube Instructor';

  const thumbnail =
    header.playlistHeaderBanner?.heroPlaylistThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
    microformat.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800';

  // Extract video items (support both classic playlistVideoRenderer and modern lockupViewModel)
  const videos: any[] = [];
  let index = 1;

  function extractVideosFromTree(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    if (obj.playlistVideoRenderer && obj.playlistVideoRenderer.videoId) {
      const v = obj.playlistVideoRenderer;
      const vidId = v.videoId;
      const vTitle = v.title?.runs?.[0]?.text || v.title?.simpleText || `Lesson ${index}`;
      const vDuration = v.lengthText?.simpleText || '00:00';
      const vDurationSec = parseDurationToSeconds(vDuration);
      const vThumb =
        v.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
        `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`;

      videos.push({
        id: vidId,
        youtubeId: vidId,
        title: vTitle,
        duration: vDuration,
        durationSeconds: vDurationSec,
        thumbnail: vThumb,
        completed: false,
        currentTime: 0,
        progressPercent: 0,
        notes: [],
        order: index++,
      });
      return;
    }

    if (obj.lockupViewModel && (obj.lockupViewModel.contentId || obj.lockupViewModel.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO')) {
      const lockup = obj.lockupViewModel;
      const vidId = lockup.contentId || lockup.rendererContext?.commandContext?.onTap?.innertubeCommand?.watchEndpoint?.videoId;
      if (vidId) {
        const vTitle = lockup.metadata?.lockupMetadataViewModel?.title?.content || `Lesson ${index}`;
        let vDuration = '00:00';
        const badges = lockup.contentImage?.thumbnailViewModel?.overlays?.[0]?.thumbnailBottomOverlayViewModel?.badges;
        if (badges && badges[0]?.thumbnailBadgeViewModel?.text) {
          vDuration = badges[0].thumbnailBadgeViewModel.text;
        }
        const vDurationSec = parseDurationToSeconds(vDuration);
        const vThumb =
          lockup.contentImage?.thumbnailViewModel?.image?.sources?.slice(-1)[0]?.url ||
          `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`;

        videos.push({
          id: vidId,
          youtubeId: vidId,
          title: vTitle,
          duration: vDuration,
          durationSeconds: vDurationSec,
          thumbnail: vThumb,
          completed: false,
          currentTime: 0,
          progressPercent: 0,
          notes: [],
          order: index++,
        });
      }
      return;
    }

    for (const key of Object.keys(obj)) {
      extractVideosFromTree(obj[key]);
    }
  }

  extractVideosFromTree(data.contents);

  if (videos.length === 0) {
    throw new Error('No videos found in this playlist. Please verify the playlist is public or unlisted.');
  }

  return {
    playlistId,
    title,
    description,
    channelTitle,
    thumbnail,
    videos,
  };
}

