'use strict';

const VOICES = new Set(['zh-CN-XiaoxiaoNeural', 'zh-CN-YunxiNeural']);
const RATES = new Map([[0.55, '-45%'], [0.72, '-28%'], [0.85, '-15%'], [1, '+0%']]);

function headers(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'Cache-Control': 'private, max-age=2592000'
  };
}

function escapeXml(value) {
  return value.replace(/[<>&'\"]/g, ch => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
  })[ch]);
}

module.exports = async function (context, req) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://maxchan103-a11y.github.io';
  const requestOrigin = req.headers?.origin || req.headers?.Origin || '';
  const cors = headers(allowedOrigin);

  if (requestOrigin && requestOrigin !== allowedOrigin && !/^https?:\/\/localhost(?::\d+)?$/.test(requestOrigin)) {
    return { status: 403, headers: cors, jsonBody: { error: 'ORIGIN_NOT_ALLOWED' } };
  }
  if ((req.method || '').toUpperCase() === 'OPTIONS') return { status: 204, headers: cors };

  const body = req.body || {};
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const voice = VOICES.has(body.voice) ? body.voice : '';
  const rateNumber = Number(body.rate);
  const rate = RATES.get(rateNumber);

  if (!text || text.length > 800 || !/[\u3400-\u9fff]/u.test(text)) {
    return { status: 400, headers: cors, jsonBody: { error: 'INVALID_TEXT' } };
  }
  if (!voice || !rate) {
    return { status: 400, headers: cors, jsonBody: { error: 'INVALID_VOICE_OR_RATE' } };
  }

  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) {
    return { status: 503, headers: cors, jsonBody: { error: 'SPEECH_NOT_CONFIGURED' } };
  }

  const ssml = `<speak version="1.0" xml:lang="zh-CN"><voice name="${voice}"><prosody rate="${rate}">${escapeXml(text)}</prosody></voice></speak>`;
  try {
    const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'ai-reading-coach'
      },
      body: ssml
    });

    if (response.status === 429 || response.status === 402) {
      return { status: 429, headers: cors, jsonBody: { error: 'MONTHLY_FREE_LIMIT_REACHED' } };
    }
    if (!response.ok) {
      context.log.error(`Azure Speech error ${response.status}`);
      return { status: 502, headers: cors, jsonBody: { error: 'SPEECH_PROVIDER_ERROR' } };
    }

    const audio = Buffer.from(await response.arrayBuffer());
    return {
      status: 200,
      headers: { ...cors, 'Content-Type': 'audio/mpeg', 'Content-Length': String(audio.length) },
      body: audio
    };
  } catch (error) {
    context.log.error(error);
    return { status: 503, headers: cors, jsonBody: { error: 'SPEECH_TEMPORARILY_UNAVAILABLE' } };
  }
};
