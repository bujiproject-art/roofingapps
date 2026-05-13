// Notification logic for sending alerts and reminders

import { createClient } from '@/lib/supabase/server'
import { sendSMS, sendEmail } from '@/lib/integrations'

const supabase = createClient()

export async function sendInspectionReminder(userId: string, inspectionId: string) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('phone_number, email')
    .eq('id', userId)
    .single()

  if (userError) throw userError

  const message = `Reminder: You have an upcoming inspection. Please check your app for details.`

  if (user.phone_number) {
    await sendSMS(user.phone_number, message)
  }

  if (user.email) {
    await sendEmail(user.email, 'Inspection Reminder', `<p>${message}</p>`)
  }
}