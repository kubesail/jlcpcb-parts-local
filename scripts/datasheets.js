import knex from 'knex'
import fetch from 'node-fetch'
import { createWriteStream } from 'fs'
import { stat, unlink, readFile } from 'fs/promises'
import async from 'async'

const db = knex({
  client: 'pg',
  connection: 'postgres://root:root@localhost:5432/root',
})

const errors = JSON.parse(await readFile('datasheet-errors.json', 'utf8'))

const PDF_DIR = '/root/media/jlcpcb-pdf'
let offset = 0

const parts = await db.select(['id', 'datasheet']).from('parts').where('id', '>', offset)
console.log(parts)

async.eachLimit(parts, 10, async part => {
  if (!part.datasheet) return
  const pdfPath = `${PDF_DIR}/${part.id}.pdf`
  const pdfUrl = part.datasheet
  let stats
  try {
    stats = await stat(pdfPath)
  } catch {}
  if (stats) return
  return new Promise(async (resolve, reject) => {
    const res = await fetch(pdfUrl)
    const dest = createWriteStream(pdfPath)
    res.body.pipe(dest)
    dest.on('error', async () => {
      await unlink(pdfPath)
      console.log(`error downloading ${part.id}`)
      errors.push({ id: part.id, datasheet: part.datasheet })
      await writeFile('datasheet-errors.json', JSON.stringify(errors))
      resolve()
    })
    dest.on('finish', () => {
      console.log(`downloaded ${part.id}`)
      resolve()
    })
  })
})
