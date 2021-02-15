import { OutletDocument, Product } from './outlet-document'

import { launch } from 'puppeteer'
import { Client, TextMessage } from '@line/bot-sdk'
import { schedule } from 'node-cron'
import Nedb from 'nedb-promises'

// check environment variables
const cronExpression = process.env.CRON_EXPRESSION
if (cronExpression == null) {
    throw new Error('cront expression ($CRON_EXPRESSION) is not defined in the environment variable.')
}
if (process.env.LINE_TOKEN == null) {
    throw new Error('LINE access token ($LINE_TOKEN) is not defined in the environment variable.')
}
const lineUserId = process.env.LINE_USERID
if (lineUserId == null) {
    throw new Error('LINE user id ($LINE_USERID) is not defined in the environment variable.')
}

const db = new Nedb({ filename: 'line-notify-canyon-outlet.db', autoload: true })

const lineClient = new Client({ channelAccessToken: process.env.LINE_TOKEN })

/**
 * Scrap the canyon outlets and send notifications to LINE as needed
 */
const crawl = async () => {
    const browser = await launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.goto('https://www.canyon.com/ja-jp/outlet/road-bikes/', {
        waitUntil: 'networkidle2',
    })

    // get outlet bikes count
    const productCountElement = await page.$('span.js-productCount')
    if (productCountElement !== null) {
        const productCount = parseInt(
            (await (await productCountElement.getProperty('textContent')).jsonValue()) as string
        )
        console.log(`Number of outlet products: ${productCount}`)

        // notify by LINE only at the first execution or when there is an update
        const recentDoc = (await db.find<OutletDocument>({}).sort({ time: -1 }).limit(1))
        if (recentDoc.length === 0 || productCount > recentDoc[0].productCount) {
            const text = `CanyonOutletに更新があります
商品数： ${productCount}`

            const message: TextMessage = {
                type: 'text',
                text: text,
            }
            lineClient.pushMessage(lineUserId, message)
        } else {
            console.log('Outlet was not updated.')
        }

        const currentDoc: OutletDocument = {
            productCount: productCount,
            products: Array<Product>(),
            time: new Date(),
        }
        db.insert(currentDoc)
    }

    await browser.close()
}

// perform checks regularly
schedule(cronExpression, crawl)
