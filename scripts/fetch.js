import dotenv from 'dotenv'
dotenv.config()
import knex from 'knex'
import fetch from 'node-fetch'
import { existsSync, readFileSync, writeFileSync, createWriteStream } from 'fs'
import { promisify } from 'util'

const db = knex({
  client: 'pg',
  connection: process.env.PG_CONNECTION_STRING,
})

try {
  await db.raw('CREATE EXTENSION citext') // enable citext if not enabled
} catch {}

let results = [null]
let page = 0
let totalPage = 1
let catalog = 312
let pageSize = 100

while (page < totalPage) {
  page++

  // ==SAMPLE RESPONSE==
  // totalCount: 2238907,
  // currentPage: 1,
  // pageSize: 2000,
  // productList: []
  // totalPage: 1120,
  // lastPage: 5
  let res = await fetch('https://wwwapi.lcsc.com/v1/products/list', {
    headers: {
      accept: 'application/json',
      'accept-language': 'en',
      'content-type': 'application/json;charset=UTF-8',
    },
    body: JSON.stringify({
      catalogIdList: [catalog],
      currentPage: page,
      pageSize,
      paramNameValueMap: {},
      sortField: 'model',
      sortType: 'asc',
    }),
    method: 'POST',
  })

  const resObj = await res.json()
  const { totalCount, currentPage, productList, lastPage } = resObj
  totalPage = resObj.totalPage

  console.log(
    `[Catalog ${catalog}] ${(((currentPage * pageSize) / totalCount) * 100).toFixed(
      2
    )}% - Processed ${currentPage * pageSize} of ${totalCount}`
  )
  for (const product of productList) {
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

for (const productCode in products) {
  const imgPath = `img/${productCode}.jpg`
  const exists = await existsSync(imgPath)
  const imgUrl = products[productCode].productImageUrlBig
  if (!exists && imgUrl) {
    fetch(imgUrl).then(res => {
      const dest = createWriteStream(imgPath)
      res.body.pipe(dest)
    })
  }
  // products[productCode]
}

writeFileSync('products.json', JSON.stringify(products), 'utf8')
