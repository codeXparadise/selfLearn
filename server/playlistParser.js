/**
 * YouTube Playlist Parser
 * Parses YouTube public/unlisted playlists without requiring an API key.
 */

export function extractPlaylistId(urlOrId) {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  
  // If it's already a playlist ID
  if (/^(PL|UU|LL|RD|OLAK)[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const listParam = url.searchParams.get('list');
    if (listParam) return listParam;
  } catch {
    // If not a full URL, try regex matching for ?list= or &list=
    const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  }

  return null;
}

export function parseDurationToSeconds(durationStr) {
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

export async function fetchPlaylistData(playlistId) {
  const url = `https://www.youtube.com/playlist?list=${playlistId}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch YouTube playlist (HTTP ${response.status})`);
  }

  const html = await response.text();
  const marker = 'ytInitialData = ';
  const idx = html.indexOf(marker);
  if (idx === -1) {
    throw new Error('Unable to parse YouTube playlist page. Please verify the URL.');
  }

  const jsonStart = idx + marker.length;
  const endIdx = html.indexOf(';</script>', jsonStart);
  if (endIdx === -1) {
    throw new Error('Unable to extract playlist metadata from YouTube response.');
  }

  const jsonStr = html.slice(jsonStart, endIdx);
  let data;
  try {
    data = JSON.parse(jsonStr);
  } catch (err) {
    throw new Error('Failed to parse YouTube playlist JSON data.');
  }

  if (data.alerts && data.alerts.length > 0) {
    const alertMsg = data.alerts[0]?.alertRenderer?.text?.runs?.[0]?.text ||
                     data.alerts[0]?.alertRenderer?.text?.simpleText;
    if (alertMsg) {
      throw new Error(`YouTube: ${alertMsg}`);
    }
  }

  const playlistTitle = data.metadata?.playlistMetadataRenderer?.title ||
                        data.header?.playlistHeaderRenderer?.title?.simpleText ||
                        'Untitled Course';
                        
  const channelTitle = data.header?.playlistHeaderRenderer?.ownerText?.runs?.[0]?.text ||
                       data.metadata?.playlistMetadataRenderer?.ownerText ||
                       'YouTube Creator';

  const description = data.metadata?.playlistMetadataRenderer?.description ||
                      data.header?.playlistHeaderRenderer?.descriptionText?.simpleText || '';

  const videos = [];
  const seenIds = new Set();

  // Search through sectionListRenderer
  const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
  for (const tab of tabs) {
    const secContents = tab.tabRenderer?.content?.sectionListRenderer?.contents || [];
    for (const sec of secContents) {
      const itemContents = sec.itemSectionRenderer?.contents || [];
      for (const item of itemContents) {
        // Modern lockupViewModel (2024+)
        if (item.lockupViewModel && item.lockupViewModel.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO') {
          const v = item.lockupViewModel;
          const videoId = v.contentId;
          if (videoId && !seenIds.has(videoId)) {
            seenIds.add(videoId);
            const title = v.metadata?.lockupMetadataViewModel?.title?.content || 'Untitled Video';
            const badges = v.contentImage?.thumbnailViewModel?.overlays?.[0]?.thumbnailBottomOverlayViewModel?.badges || [];
            const duration = badges[0]?.thumbnailBadgeViewModel?.text || '';
            const sources = v.contentImage?.thumbnailViewModel?.image?.sources || [];
            const thumbnail = sources.length > 0
              ? sources[sources.length - 1].url
              : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
              
            videos.push({
              id: videoId,
              title: title.trim(),
              duration: duration.trim(),
              durationSeconds: parseDurationToSeconds(duration),
              thumbnail
            });
          }
        }

        // Classic playlistVideoListRenderer
        if (item.playlistVideoListRenderer?.contents) {
          for (const plItem of item.playlistVideoListRenderer.contents) {
            const v = plItem.playlistVideoRenderer;
            if (v && v.videoId && !seenIds.has(v.videoId)) {
              seenIds.add(v.videoId);
              const videoId = v.videoId;
              const title = v.title?.runs?.[0]?.text || v.title?.simpleText || 'Untitled Video';
              const duration = v.lengthText?.simpleText || '';
              const sources = v.thumbnail?.thumbnails || [];
              const thumbnail = sources.length > 0
                ? sources[sources.length - 1].url
                : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

              videos.push({
                id: videoId,
                title: title.trim(),
                duration: duration.trim(),
                durationSeconds: parseDurationToSeconds(duration),
                thumbnail
              });
            }
          }
        }
      }
    }
  }

  // Fallback: If no videos found via structured renderer, scan for videoId regex
  if (videos.length === 0) {
    const regex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
    let match;
    while ((match = regex.exec(jsonStr)) !== null) {
      const vid = match[1];
      if (!seenIds.has(vid)) {
        seenIds.add(vid);
        videos.push({
          id: vid,
          title: `Video ${videos.length + 1}`,
          duration: '',
          durationSeconds: 0,
          thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`
        });
      }
    }
  }

  const playlistThumbnail = videos[0]?.thumbnail || `https://i.ytimg.com/vi/placeholder/hqdefault.jpg`;

  return {
    playlistId,
    title: playlistTitle,
    channelTitle,
    description,
    thumbnail: playlistThumbnail,
    videoCount: videos.length,
    videos
  };
}

