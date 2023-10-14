import dotenv from 'dotenv'
dotenv.config()
import knex from 'knex'
import fetch from 'node-fetch'

const db = knex({
  client: 'pg',
  connection: 'postgres://root:root@localhost:5432/root',
})

let res = await fetch('https://wmsc.lcsc.com/wmsc/home/category', {
  headers: {
    accept: 'application/json',
    'accept-language': 'en',
    'content-type': 'application/json;charset=UTF-8',
  },
  method: 'GET',
})

const status = res.status
const { code, msg, result } = await res.json()
console.log({ status, code, msg })

for (const category of result) {
  await db('categories')
    .insert({
      id: category.categoryId,
      name: category.categoryNameEn,
      parent: category.parentId,
    })
    .onConflict('id')
    .merge()
  if (!category.childCategoryList) continue
  for (const childCategory of category.childCategoryList) {
    await db('categories')
      .insert({
        id: childCategory.categoryId,
        name: childCategory.categoryNameEn,
        parent: childCategory.parentId,
      })
      .onConflict('id')
      .merge()
  }
}
