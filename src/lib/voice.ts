// Voice note handling and AI transcription

import { createClient } from '@/lib/supabase/server'
import axios from 'axios'

const supabase = createClient()

export async function transcribeVoiceNote(voiceNoteId: string) {
  const { data, error } = await supabase
    .from('voice_notes')
    .select('audio_storage_path')
    .eq('id', voiceNoteId)
    .single()

  if (error) throw error

  const audioUrl = data.audio_storage_path
  const response = await axios.post('https://api.openai.com/v1/whisper', { audio_url: audioUrl }, {
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
  })

  const transcript = response.data.transcript
  await supabase
    .from('voice_notes')
    .update({ transcript, transcription_confidence: response.data.confidence })
    .eq('id', voiceNoteId)
}