const BASE = (import.meta.env.VITE_API_BASE_URL ?? '') + '/graphql'

interface GqlResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

export async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const token = localStorage.getItem('auth_token')
  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    throw new Error(`HTTP ${res.status}`)
  }

  const json: GqlResponse<T> = await res.json()
  if (json.errors?.length) {
    const msg = json.errors[0].message
    if (msg === 'Unauthorized') {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    throw new Error(msg)
  }

  return json.data as T
}
