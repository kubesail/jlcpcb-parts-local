import dotenv from 'dotenv'
dotenv.config()
import knex from 'knex'
import fetch from 'node-fetch'
import { existsSync, readFileSync, writeFileSync, createWriteStream } from 'fs'
import { promisify } from 'util'

const db = knex({
  client: 'pg',
  connection: 'postgres://root:root@localhost:5432/root',
})

// TODO move to fixture file
try {
  await db.raw('CREATE EXTENSION citext') // enable case insensitive text columns if not enabled
} catch {}

let results = [null]
let page = 0
let totalPage = 1
let pageSize = 100

const categories = await db.select('id').from('categories')

console.log(categories)

for (const category of categories) {
  while (page < totalPage) {
    page++
    const body = {
      currentPage: page,
      pageSize: pageSize,
      catalogIdList: [category.id],
      paramNameValueMap: {},
      brandIdList: [],
      isStock: false,
      isEnvironment: false,
      isHot: false,
      isDiscount: false,
      encapValueList: [],
    }
    let res = await fetch('https://wmsc.lcsc.com/wmsc/product/search/list', {
      headers: {
        accept: 'application/json',
        'accept-language': 'en',
        'content-type': 'application/json;charset=UTF-8',
      },
      body: JSON.stringify(body),
      method: 'POST',
    })

    const status = res.status

    const { code, result, msg } = await res.json()
    console.log({ status, code, msg })
    const { dataList, totalRow, currPage } = result

    totalPage = result.totalPage

    const percent = (((currPage * pageSize) / totalRow) * 100).toFixed(2)
    console.log(`[Catalog ${category.id}] ${percent}% - Processed ${page} of ${totalPage}`)
    for (const product of dataList) {
      await db('parts')
        .insert({
          id: product.productCode,
          description: product.productIntroEn,
          images: product.productImages?.join(','),
          package: product.encapStandard,
          mfr: product.brandNameEn,
          stock: product.stockNumber,
          mfr_part: product.productModel,
          datasheet: product.pdfUrl,
        })
        .onConflict('id')
        .merge()
    }
  }
  page = 0
}
