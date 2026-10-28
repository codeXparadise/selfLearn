import { fetchPlaylistData } from './playlistParser';

export interface RecommendedPlaylist {
  rank: number;
  badge: string;
  playlistId: string;
  title: string;
  channelTitle: string;
  totalVideos: number;
  thumbnail: string;
  overview: string;
  playlistUrl: string;
}

const CURATED_TOPIC_FALLBACKS: Record<string, string[]> = {
  python: [
    'PL-osiE80TeTt2d9bfVymT8YZLAZyPhVD9', // Corey Schafer Python
    'PLsyeobzWxl7poL9JTVyndKe62ieoNx-MZ', // Telusko Python
    'PL4cUxeGkcC9idu6GZ8EU_5B6WpKTdYt3K', // Net Ninja Python 3
  ],
  datascience: [
    'PLWKjhJtqVAbnupwRFOq9zGOWjdvY13O_u', // freeCodeCamp Data Analysis
    'PLKnIAK60-MBn8E9P2j5fGfH8v_oQeYk_2', // CampusX 100 Days ML
    'PLeo1K3hjS3us_Qqmt9wzp_Wdn5E59Y5Y', // Codebasics Data Science
  ],
  'data science': [
    'PLWKjhJtqVAbnupwRFOq9zGOWjdvY13O_u',
    'PLKnIAK60-MBn8E9P2j5fGfH8v_oQeYk_2',
    'PLeo1K3hjS3us_Qqmt9wzp_Wdn5E59Y5Y',
  ],
  react: [
    'PLC3y8-rFHvwgg3vaYJgHGnModB54rxOk3', // Codevolution React
    'PL4cUxeGkcC9gZD-Tvwfod2gaISzfRiP9d', // Net Ninja React
    'PLZlA0Gpn_vH_NT5zPVcqhRLchkZ4RRnVz', // Web Dev Simplified React
  ],
  javascript: [
    'PLillGF-RfqbbnEGy3ROiLWk7JMCuSyurX', // Traversy JS
    'PL4cUxeGkcC9haFPT7J25Q9GRB_Z32QWXP', // Net Ninja JS
    'PLlasXeu85E9cQ32gLCvAvr9vNaUccPVNP', // Akshay Saini Namaste JS
  ],
  'machine learning': [
    'PLkDaE6sCZn6FNC6YRfRQc_FbeQrF8BwGI', // Andrew Ng ML
    'PLKnIAK60-MBn8E9P2j5fGfH8v_oQeYk_2', // CampusX ML
    'PLZbbT5o_s2xq7LwI2V8_QtvuXZedL6tQU', // Deeplizard
  ],
};

/**
 * Searches YouTube for playlists matching the topic without requiring an API key.
 * Extracts playlist IDs from HTML and fetches metadata for the top 3.
 */
export async function searchYouTubePlaylists(query: string): Promise<RecommendedPlaylist[]> {
  const searchQuery = `${query.trim()} full course playlist`;
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

  let uniqueIds: string[] = [];

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (res.ok) {
      const html = await res.text();
      // Extract from both URL params and JSON payload
      const allMatches: string[] = [];
      const urlRegex = /[?&]list=([a-zA-Z0-9_-]{10,})/g;
      const jsonRegex = /"playlistId":"([a-zA-Z0-9_-]{10,})"/g;
      let m: RegExpExecArray | null;
      while ((m = urlRegex.exec(html)) !== null) {
        allMatches.push(m[1]);
      }
      while ((m = jsonRegex.exec(html)) !== null) {
        allMatches.push(m[1]);
      }
      uniqueIds = Array.from(new Set(allMatches.filter((id) => id.startsWith('PL') || id.startsWith('UU'))));
    }
  } catch (err) {
    console.warn('YouTube playlist scraping notice:', err);
  }

  // If no IDs scraped (e.g. anti-bot challenge or offline), consult curated fallback catalog
  if (uniqueIds.length === 0) {
    const qLower = query.toLowerCase().trim();
    for (const [topicKey, fallbackIds] of Object.entries(CURATED_TOPIC_FALLBACKS)) {
      if (qLower.includes(topicKey) || topicKey.includes(qLower)) {
        uniqueIds = fallbackIds;
        break;
      }
    }
  }

  // If still none, try default top programming tracks
  if (uniqueIds.length === 0) {
    uniqueIds = [
      'PL-osiE80TeTt2d9bfVymT8YZLAZyPhVD9', // Python
      'PLC3y8-rFHvwgg3vaYJgHGnModB54rxOk3', // React
      'PLWKjhJtqVAbnupwRFOq9zGOWjdvY13O_u', // Data Science
    ];
  }

  const topIds = uniqueIds.slice(0, 5);
  const recommendations: RecommendedPlaylist[] = [];

  const rankBadges = [
    { rank: 1, badge: '🏆 Top Rated' },
    { rank: 2, badge: '⭐ Most In-Depth' },
    { rank: 3, badge: '⚡ Fast Track' },
  ];

  for (const playlistId of topIds) {
    if (recommendations.length >= 3) break;
    try {
      const data = await fetchPlaylistData(playlistId);
      if (data && data.videos && data.videos.length > 0) {
        const rankInfo = rankBadges[recommendations.length] || {
          rank: recommendations.length + 1,
          badge: 'Recommended',
        };

        const lessonCount = data.videos.length;
        const channel = data.channelTitle || 'Instructor';
        let overview = `Curated by ${channel} featuring ${lessonCount} structured lessons covering foundational to advanced concepts.`;
        if (data.description) {
          const firstSentence = data.description.split('.')[0];
          if (firstSentence && firstSentence.length > 20 && firstSentence.length < 150) {
            overview = firstSentence + '.';
          }
        }

        recommendations.push({
          rank: rankInfo.rank,
          badge: rankInfo.badge,
          playlistId,
          title: data.title,
          channelTitle: channel,
          totalVideos: lessonCount,
          thumbnail: data.thumbnail,
          overview,
          playlistUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
        });
      }
    } catch (err) {
      continue;
    }
  }

  if (recommendations.length === 0) {
    throw new Error(`Could not load playlist lessons for "${query}". Please try another keyword.`);
  }

  return recommendations;
}
