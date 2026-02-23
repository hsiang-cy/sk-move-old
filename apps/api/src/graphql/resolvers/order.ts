import { and, eq } from 'drizzle-orm'
import { order as orderTable, compute as computeTable } from '../../db/schema'
import { requireAuth, type Context } from '../context'

export const orderTypeDefs = /* GraphQL */ `
  type Order {
    id:                   ID!
    account_id:           Int!
    status:               Status!
    data:                 JSON
    created_at:           Float
    updated_at:           Float
    destination_snapshot: JSON!
    vehicle_snapshot:     JSON!
    comment_for_account:  String
    computes:             [Compute!]!
  }

  extend type Query {
    orders(status: Status): [Order!]!
    order(id: ID!): Order
  }

  extend type Mutation {
    createOrder(destination_snapshot: JSON!, vehicle_snapshot: JSON!, data: JSON, comment_for_account: String): Order!
    deleteOrder(id: ID!): Order!
  }
`

export const orderResolvers = {
  Query: {
    orders: async (_: any, args: { status?: string }, { db, user }: Context) => {
      requireAuth(user)
      const conditions: any[] = [eq(orderTable.account_id, user!.account_id)]
      if (args.status) conditions.push(eq(orderTable.status, args.status as any))
      return db.select().from(orderTable).where(and(...conditions))
    },
    order: async (_: any, args: { id: string }, { db, user }: Context) => {
      requireAuth(user)
      const [found] = await db
        .select()
        .from(orderTable)
        .where(and(
          eq(orderTable.id, parseInt(args.id)),
          eq(orderTable.account_id, user!.account_id)
        ))
        .limit(1)
      return found ?? null
    }
  },
  Mutation: {
    createOrder: async (
      _: any,
      args: { destination_snapshot: any; vehicle_snapshot: any; data?: any; comment_for_account?: string },
      { db, user }: Context
    ) => {
      requireAuth(user, 'normal')
      const [created] = await db.insert(orderTable).values({
        account_id: user!.account_id,
        destination_snapshot: args.destination_snapshot,
        vehicle_snapshot: args.vehicle_snapshot,
        data: args.data,
        comment_for_account: args.comment_for_account,
      }).returning()
      return created
    },
    deleteOrder: async (_: any, args: { id: string }, { db, user }: Context) => {
      requireAuth(user, 'normal')
      const [deleted] = await db
        .update(orderTable)
        .set({ status: 'deleted', updated_at: Math.floor(Date.now() / 1000) })
        .where(and(
          eq(orderTable.id, parseInt(args.id)),
          eq(orderTable.account_id, user!.account_id)
        ))
        .returning()
      if (!deleted) throw new Error('Order not found')
      return deleted
    }
  },
  Order: {
    computes: (parent: { id: number }, _: any, { db }: Context) =>
      db.select().from(computeTable).where(eq(computeTable.order_id, parent.id))
  }
}
