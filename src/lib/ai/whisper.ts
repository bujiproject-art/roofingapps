// Whisper AI integration for voice transcription

import axios from 'axios'

export async function transcribeAudioWithWhisper(audioUrl: string) {
  const response = await axios.post('https://api.openai.com/v1/whisper', { audio_url: audioUrl }, {
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
  })

  return {
    transcript: response.data.transcript,
    confidence: response.data.confidence
  }
}