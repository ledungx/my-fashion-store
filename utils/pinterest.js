/**
 * Pinterest API v5 Helper
 * Handles OAuth2 flow, token management, board listing, and pin creation.
 */

const PINTEREST_API_BASE = 'https://api.pinterest.com/v5';
const PINTEREST_OAUTH_BASE = 'https://www.pinterest.com/oauth';

/**
 * Generate the Pinterest OAuth2 authorization URL.
 */
export function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.PINTEREST_APP_ID,
    redirect_uri: process.env.PINTEREST_REDIRECT_URI,
    response_type: 'code',
    scope: 'user_accounts:read,pins:read,pins:write,boards:read,boards:write',
    state: 'pinterest_oauth_' + Date.now(),
  });
  return `${PINTEREST_OAUTH_BASE}/?${params.toString()}`;
}

/**
 * Exchange authorization code for access + refresh tokens.
 */
export async function exchangeCodeForTokens(code) {
  const credentials = Buffer.from(
    `${process.env.PINTEREST_APP_ID}:${process.env.PINTEREST_APP_SECRET}`
  ).toString('base64');

  const res = await fetch(`${PINTEREST_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.PINTEREST_REDIRECT_URI,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pinterest token exchange failed: ${err}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in, // seconds
    scope: data.scope,
  };
}

/**
 * Refresh an expired access token.
 */
export async function refreshAccessToken(refreshToken) {
  const credentials = Buffer.from(
    `${process.env.PINTEREST_APP_ID}:${process.env.PINTEREST_APP_SECRET}`
  ).toString('base64');

  const res = await fetch(`${PINTEREST_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pinterest token refresh failed: ${err}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken, // Pinterest may not return a new refresh token
    expiresIn: data.expires_in,
  };
}

/**
 * Get the authenticated user's info.
 */
export async function getUserInfo(accessToken) {
  const res = await fetch(`${PINTEREST_API_BASE}/user_account`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error('Pinterest getUserInfo error:', res.status, errText);
    throw new Error(`Failed to get Pinterest user info: ${res.status} ${errText}`);
  }
  return res.json();
}

/**
 * List all boards for the authenticated user.
 */
export async function listBoards(accessToken) {
  const boards = [];
  let bookmark = null;

  do {
    const url = new URL(`${PINTEREST_API_BASE}/boards`);
    url.searchParams.set('page_size', '100');
    if (bookmark) url.searchParams.set('bookmark', bookmark);

    const res = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to list boards: ${err}`);
    }

    const data = await res.json();
    boards.push(...(data.items || []));
    bookmark = data.bookmark || null;
  } while (bookmark);

  return boards;
}

/**
 * Create a pin on a board.
 */
export async function createPin(accessToken, { boardId, title, description, link, imageUrl, altText }) {
  const body = {
    board_id: boardId,
    title: title?.substring(0, 100) || '',
    description: description?.substring(0, 500) || '',
    link: link || '',
    alt_text: altText?.substring(0, 500) || title?.substring(0, 500) || '',
    media_source: {
      source_type: 'image_url',
      url: imageUrl,
    },
  };

  const res = await fetch(`${PINTEREST_API_BASE}/pins`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create pin: ${err}`);
  }

  return res.json();
}

/**
 * Get a valid access token for an account, refreshing if expired.
 */
export async function getValidToken(account, prisma) {
  if (new Date() < new Date(account.tokenExpiry)) {
    return account.accessToken;
  }

  // Token expired, refresh it
  const refreshed = await refreshAccessToken(account.refreshToken);
  
  await prisma.pinterestAccount.update({
    where: { id: account.id },
    data: {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      tokenExpiry: new Date(Date.now() + refreshed.expiresIn * 1000),
    },
  });

  return refreshed.accessToken;
}
