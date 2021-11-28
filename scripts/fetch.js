import fetch from 'node-fetch'
import { existsSync, readFileSync, writeFileSync, createWriteStream } from 'fs'
import { promisify } from 'util'

const products = JSON.parse(readFileSync('products.json', 'utf8'))

let results = [null]
let page = 0
let totalPage = 1

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
      catalogIdList: [11082],
      currentPage: page,
      pageSize: 100,
      paramNameValueMap: {},
      sortField: 'model',
      sortType: 'asc',
    }),
    method: 'POST',
  })

  const resObj = await res.json()
  const { totalCount, currentPage, pageSize, productList, lastPage } = resObj
  totalPage = resObj.totalPage

  console.log({
    totalPage,
    lastPage,
    totalCount,
    currentPage,
    pageSize,
  })
  productList.map(product => (products[product.productCode] = product))
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
