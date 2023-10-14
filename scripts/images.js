import knex from 'knex'
import fetch from 'node-fetch'
import { existsSync, createWriteStream } from 'fs'

const db = knex({
  client: 'pg',
  connection: 'postgres://root:root@localhost:5432/root',
})

let offset = 0

while (true) {
  const rows = await db.select('*').from('parts').where('id', '>', offset).limit(10).orderBy('id')
  if (!rows.length) break
  const promises = []

  for (const row of rows) {
    if (!row.images) continue
    const imgPath = `img/${row.id}.jpg`
    const exists = await existsSync(imgPath)
    const imgUrl = row.images.split(',')[0]
    if (!exists) {
      console.log(`downloading ${row.id}`)
      promises.push(
        new Promise(async (resolve, reject) => {
          const res = await fetch(`https://assets.lcsc.com/images/lcsc/900x900${imgUrl}`)
          const dest = createWriteStream(imgPath)
          res.body.pipe(dest)
          resolve()
        })
      )
    }
  }

  await Promise.all(promises)

  offset = rows[rows.length - 1].id
}
