import { launch } from 'puppeteer'

(async () => {
    const browser = await launch(
        {
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ],
        }
    );
    const page = await browser.newPage();
    await page.goto('https://www.canyon.com/ja-jp/outlet/road-bikes/', {
        waitUntil: 'networkidle2',
    });

    const productCountElement = await page.$('span.js-productCount')
    if (productCountElement !== null) {

        const productCount = parseInt(await (await productCountElement.getProperty('textContent')).jsonValue() as string)
        console.log(productCount)
    }

    await browser.close();
})()
