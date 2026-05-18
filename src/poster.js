// src/poster.js
// X API v2 投稿モジュール（OAuth 1.0a）

import crypto from 'crypto';

const API_KEY         = process.env.X_API_KEY;
const API_SECRET      = process.env.X_API_SECRET;
const ACCESS_TOKEN    = process.env.X_ACCESS_TOKEN;
const ACCESS_SECRET   = process.env.X_ACCESS_SECRET;

/**
 * OAuth 1.0a 署名を生成
 */
function buildOAuthHeader(method, url, params = {}) {
  const oauthParams = {
    oauth_consumer_key:     API_KEY,
    oauth_nonce:            crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        String(Math.floor(Date.now() / 1000)),
    oauth_token:            ACCESS_TOKEN,
    oauth_version:          '1.0',
  };

  const allParams = { ...oauthParams, ...params };
  const sortedParams = Object.keys(allParams).sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join('&');

  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams),
  ].join('&');

  const signingKey = `${encodeURIComponent(API_SECRET)}&${encodeURIComponent(ACCESS_SECRET)}`;
  const signature  = crypto.createHmac('sha1', signingKey)
    .update(baseString).digest('base64');

  oauthParams.oauth_signature = signature;

  const headerValue = 'OAuth ' + Object.keys(oauthParams).sort()
    .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
    .join(', ');

  return headerValue;
}

/**
 * 画像を X にアップロードして media_id を返す
 */
export async function uploadMedia(imageUrl) {
  const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';

  try {
    // 画像を取得
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`画像取得失敗: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mediaType = imageUrl.endsWith('.webp') ? 'image/webp' : 'image/jpeg';

    // FormData でアップロード
    const body = new URLSearchParams({
      media_data:     base64,
      media_category: 'tweet_image',
    });

    const authHeader = buildOAuthHeader('POST', uploadUrl);
    const uploadRes  = await fetch(uploadUrl, {
      method:  'POST',
      headers: {
        Authorization:  authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data = await uploadRes.json();
    if (data.media_id_string) {
      console.log(`✅ 画像アップロード成功: ${data.media_id_string}`);
      return data.media_id_string;
    } else {
      console.error('❌ 画像アップロード失敗:', JSON.stringify(data));
      return null;
    }
  } catch (err) {
    console.error('❌ uploadMedia エラー:', err.message);
    return null;
  }
}

/**
 * X にツイートを投稿
 */
export async function postTweet(text, mediaId = null) {
  const tweetUrl = 'https://api.twitter.com/2/tweets';
  const payload  = { text };
  if (mediaId) payload.media = { media_ids: [mediaId] };

  const authHeader = buildOAuthHeader('POST', tweetUrl);

  try {
    const res = await fetch(tweetUrl, {
      method:  'POST',
      headers: {
        Authorization:  authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.data?.id) {
      console.log(`✅ 投稿成功 [${data.data.id}]: ${text.substring(0, 50)}...`);
      return data.data.id;
    } else {
      console.error('❌ 投稿失敗:', JSON.stringify(data));
      return null;
    }
  } catch (err) {
    console.error('❌ postTweet エラー:', err.message);
    return null;
  }
}
