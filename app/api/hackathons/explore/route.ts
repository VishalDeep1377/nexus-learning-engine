import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/hackathons/explore
 *
 * Fetches live hackathon listings from Brabble AI and maps them into
 * the shape expected by the HackathonCard component.
 */
export async function GET(req: NextRequest) {
  const apiKey = process.env.BRABBLE_API_KEY;
  const refresh = req.nextUrl.searchParams.get('refresh') === 'true';

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'Brabble API key is not configured.' },
      { status: 500 }
    );
  }

  try {
    const fetchOptions: RequestInit = {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    };

    if (refresh) {
      fetchOptions.cache = 'no-store';
    } else {
      fetchOptions.next = { revalidate: 1800 };
    }

    const response = await fetch(
      'https://brabble.ai/api/listings?hub=hackathons&limit=9',
      fetchOptions
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('[Brabble] API error:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: `Brabble API error: ${response.status}` },
        { status: 502 }
      );
    }

    const raw = await response.json();

    // Brabble returns { data: [...], refreshedAt, registered, ... }
    const listings: any[] = raw?.data ?? raw?.listings ?? (Array.isArray(raw) ? raw : []);

    const mapped = listings.map((item: any, index: number) => ({
      _id: item.id ?? item._id ?? `brabble-${index}`,
      name: item.title ?? item.name ?? 'Unnamed Hackathon',
      organizer: item.organizer ?? item.host ?? item.platform ?? 'Unknown Organizer',
      description: item.description ?? item.summary ?? 'Explore this hackathon for exciting challenges and prizes.',
      deadline: item.application_deadline ?? item.deadline ?? item.ends_at ?? null,
      themes: item.themes ?? item.tags ?? item.categories ?? [],
      technologies: item.technologies ?? item.tech_stack ?? [],
      status: deriveStatus(item),
      difficulties: item.difficulty ?? 'INTERMEDIATE',
      prizeInfo: item.prize ?? item.prize_pool ?? item.rewards ?? null,
      externalUrl: item.url ?? item.link ?? null,
      platform: item.platform ?? null,
      location: item.location ?? item.city ?? null,
      isOnline: item.mode === 'online' || item.is_online === true || !item.location,
      createdAt: item.created_at ?? new Date().toISOString(),
      updatedAt: item.updated_at ?? new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, data: mapped, count: mapped.length });
  } catch (error: any) {
    console.error('[Brabble] Fetch failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hackathons from Brabble.' },
      { status: 500 }
    );
  }
}

function deriveStatus(item: any): 'ACTIVE' | 'UPCOMING' | 'ENDED' {
  if (item.status) {
    const s = String(item.status).toUpperCase();
    if (s === 'ACTIVE' || s === 'OPEN' || s === 'ONGOING') return 'ACTIVE';
    if (s === 'UPCOMING' || s === 'ANNOUNCED') return 'UPCOMING';
    if (s === 'ENDED' || s === 'CLOSED' || s === 'COMPLETED') return 'ENDED';
  }

  // Derive from deadline if status not present
  const deadline = item.application_deadline ?? item.deadline ?? item.ends_at;
  if (deadline) {
    const deadlineDate = new Date(deadline).getTime();
    const now = Date.now();
    if (deadlineDate < now) return 'ENDED';
    if (deadlineDate - now < 7 * 24 * 60 * 60 * 1000) return 'ACTIVE'; // within 7 days → active
    return 'UPCOMING';
  }

  return 'ACTIVE';
}
