import { launch } from 'puppeteer'
import { Client, TextMessage } from '@line/bot-sdk'

// check environment variables
if (process.env.LINE_TOKEN == null) {
    throw new Error('LINE access token ($LINE_TOKEN) is not defined in the environment variable.')
}
const lineUserId = process.env.LINE_USERID
if (lineUserId == null) {
    throw new Error('LINE user id ($LINE_USERID) is not defined in the environment variable.')
}

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
        console.log(productCount)

        const message: TextMessage = {
            type: 'text',
            text: `message: ${productCount}`,
        }
        lineClient.pushMessage(lineUserId, message)
    }

    await browser.close()
}

crawl()
