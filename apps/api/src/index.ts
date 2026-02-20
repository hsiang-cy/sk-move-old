import { Hono } from 'hono'

const app = new Hono()

app
  .get('/', (c) => {
    return c.text('Hello Honononono!, hhhhhhhhhhh')
  })


  .get('/version', (c) => {
    return c.text('0.1.0')
  })
export default app
