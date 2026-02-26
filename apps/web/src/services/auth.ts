import { gql } from './api'
import type { AuthResponse, LoginCredentials, RegisterCredentials } from '@/types'

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const data = await gql<{
      login: { token: string; account: { account_id: string; account: string; account_role: string } }
    }>(
      `mutation Login($account: String!, $password: String!) {
        login(account: $account, password: $password) {
          token
          account { account_id account account_role }
        }
      }`,
      { account: credentials.account, password: credentials.password },
    )
    return {
      token: data.login.token,
      user: {
        id: String(data.login.account.account_id),
        account: data.login.account.account,
        account_role: data.login.account.account_role,
      },
    }
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const data = await gql<{
      register: { token: string; account: { account_id: string; account: string; account_role: string } }
    }>(
      `mutation Register($account: String!, $email: String!, $password: String!, $people_name: String!) {
        register(account: $account, email: $email, password: $password, people_name: $people_name) {
          token
          account { account_id account account_role }
        }
      }`,
      { ...credentials },
    )
    return {
      token: data.register.token,
      user: {
        id: String(data.register.account.account_id),
        account: data.register.account.account,
        account_role: data.register.account.account_role,
      },
    }
  },
}
