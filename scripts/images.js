import dotenv from 'dotenv'
dotenv.config()
import knex from 'knex'
import fetch from 'node-fetch'
import { existsSync, createWriteStream } from 'fs'

const db = knex({
  client: 'pg',
  connection: process.env.PG_CONNECTION_STRING,
})

let offset = 0

while (true) {
  const rows = await db.select('*').from('parts').where('id', '>', offset).limit(100).orderBy('id')
  if (!rows.length) break

  for (const row of rows) {
    if (!row.images) continue
    const imgPath = `img/${row.id}.jpg`
    const exists = await existsSync(imgPath)
    const imgUrl = row.images.split(',')[0]
    console.log(`downloading ${row.id}`)
    if (!exists) {
      const res = await fetch(`https://assets.lcsc.com/images/lcsc/900x900${imgUrl}`)
      const dest = createWriteStream(imgPath)
      res.body.pipe(dest)
    }
  }

  offset = rows[rows.length - 1].id
}
