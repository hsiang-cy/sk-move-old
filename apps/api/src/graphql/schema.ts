import { createSchema } from 'graphql-yoga'
import { user } from '../db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { sign } from 'hono/jwt'
import { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema_db from '../db/schema'

export type Context = {
  db: NeonHttpDatabase<typeof schema_db>
  user: any | null
  env: {
    DATABASE_URL: string
    JWT_SECRET: string
  }
}

export const schema = createSchema<Context>({
  typeDefs: /* GraphQL */ `
    type User {
      user_id: ID!
      account: String!
      email: String!
      people_name: String!
      user_role: String!
    }

    type AuthPayload {
      token: String!
      user: User!
    }

    type Query {
      me: User
    }

    type Mutation {
      register(account: String!, email: String!, password: String!, name: String!): AuthPayload!
      login(account: String!, password: String!): AuthPayload!
    }
  `,
  resolvers: {
    Query: {
      me: async (_, __, { db, user: currentUser }) => {
        if (!currentUser || !currentUser.user_id) return null

        const [foundUser] = await db
          .select()
          .from(user)
          .where(eq(user.user_id, currentUser.user_id))
          .limit(1)

        return foundUser || null
      }
    },
    Mutation: {
      register: async (_, { account, email, password, name }, { db, env }) => {
        const hashedPassword = await bcrypt.hash(password, 10)

        const [newUser] = await db.insert(user).values({
          account,
          email,
          password: hashedPassword,
          people_name: name,
          user_role: 'user',
          status: 'active'
        }).returning()

        if (!newUser) throw new Error('Failed to create user')

        const token = await sign({ user_id: newUser.user_id, role: newUser.user_role }, env.JWT_SECRET)

        return {
          token,
          user: newUser
        }
      },
      login: async (_, { account, password }, { db, env }) => {
        const [existingUser] = await db.select().from(user).where(eq(user.account, account)).limit(1)
        if (!existingUser) throw new Error('User not found')

        const isValid = await bcrypt.compare(password, existingUser.password)
        if (!isValid) throw new Error('Invalid password')

        const token = await sign({ user_id: existingUser.user_id, role: existingUser.user_role }, env.JWT_SECRET)

        return {
          token,
          user: existingUser
        }
      }
    }
  }
})
