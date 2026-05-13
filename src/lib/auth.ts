// Authentication and authorization logic

import { createClient } from '@/lib/supabase/server'

const supabase = createClient()

export async function getUserRole(userId: string): Promise<'rep' | 'manager' | 'admin'> {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data.role
}

export async function isAuthorized(userId: string, requiredRole: 'rep' | 'manager' | 'admin'): Promise<boolean> {
  const role = await getUserRole(userId)
  const rolesHierarchy = ['rep', 'manager', 'admin']
  return rolesHierarchy.indexOf(role) >= rolesHierarchy.indexOf(requiredRole)
}