import dotenv from 'dotenv'
dotenv.config()
import knex from 'knex'
import fetch from 'node-fetch'

const db = knex({
  client: 'pg',
  connection: process.env.PG_CONNECTION_STRING,
})

let res = await fetch('https://wwwapi.lcsc.com/v1/all-products/category', {
  headers: {
    accept: 'application/json',
    'accept-language': 'en',
    'content-type': 'application/json;charset=UTF-8',
  },
  method: 'GET',
})
console.log('HELLO1')

const catalogs = await res.json()
for (const catalog of catalogs) {
  await db('catalogs')
    .insert({
      id: catalog.catalogId,
      name: catalog.catalogNameEn,
      parent: catalog.parentId,
    })
    .onConflict('id')
    .merge()
  if (!catalog.childCatelogs) continue
  for (const childCatalog of catalog.childCatelogs) {
    await db('catalogs')
      .insert({
        id: childCatalog.catalogId,
        name: childCatalog.catalogNameEn,
        parent: childCatalog.parentId,
      })
      .onConflict('id')
      .merge()
  }
}
console.log('HELLO')
