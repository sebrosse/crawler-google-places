const Apify = require('apify');
const Puppeteer = require('puppeteer'); // eslint-disable-line
const { PlacePaginationData, Review } = require('./typedefs'); // eslint-disable-line

const { DEFAULT_TIMEOUT } = require('./consts');

const { log } = Apify.utils;

/**
 * Wait until google map loader disappear
 * @param {Puppeteer.Page} page
 * @return {Promise<void>}
 */
const waitForGoogleMapLoader = async (page) => {
    if (await page.$('#searchbox')) {
        // @ts-ignore
        await page.waitForFunction(() => !document.querySelector('#searchbox')
            .classList.contains('loading'), { timeout: DEFAULT_TIMEOUT });
    }
    // 2019-05-19: New progress bar
    await page.waitForFunction(() => !document.querySelector('.loading-pane-section-loading'), { timeout: DEFAULT_TIMEOUT });
};

/** @param {string} googleResponseString */
const stringifyGoogleXrhResponse = (googleResponseString) => {
    return JSON.parse(googleResponseString.replace(')]}\'', ''));
};

/** @param {number} float */
const fixFloatNumber = (float) => Number(float.toFixed(7));

/**
 * @param {any} result
 * @param {boolean} isAdvertisement
*/
const parsePaginationResult = (result, isAdvertisement) => {
    // index 14 has detailed data about each place
    const detailInfoIndex = isAdvertisement ? 15 : 14;
    const place = result[detailInfoIndex];
    if (!place) {
        return;
    }
    // Some places don't have any address
    const addressDetail = place[183] ? place[183][1] : undefined;
    const addressParsed = addressDetail ?  {
        neighborhood: addressDetail[1],
        street: addressDetail[2],
        city: addressDetail[3],
        postalCode: addressDetail[4],
        state: addressDetail[5],
        countryCode: addressDetail[6],
    } : undefined;
    return {
        placeId: place[78],
        coords: { lat: fixFloatNumber(place[9][2]), lng: fixFloatNumber(place[9][3]) },
        addressParsed,
        isAdvertisement,
    };
}

/**
 * Response from google xhr is kind a weird. Mix of array of array.
 * This function parse places from the response body.
 * @param {Buffer} responseBodyBuffer
 * @return {PlacePaginationData[]}
 */
const parseSearchPlacesResponseBody = (responseBodyBuffer) => {
    /** @type {PlacePaginationData[]} */
    const placePaginationData = [];
    const jsonString = responseBodyBuffer
        .toString('utf-8')
        .replace('/*""*/', '');
    const jsonObject = JSON.parse(jsonString);
    const data = stringifyGoogleXrhResponse(jsonObject.d);

    // We are paring ads but seems Google is not showing them to the scraper right now
    const ads = (data[2] && data[2][1] && data[2][1][0]) || [];

    ads.forEach((/** @type {any} */ ad) => {
        const placeData = parsePaginationResult(ad, true);
        if (placeData) {
            placePaginationData.push(placeData);
        } else {
            log.warning(`[SEARCH]: Cannot find place data for advertisement in search.`)
        }
    })

    /** @type {any} Too complex to type out*/
    let organicResults = data[0][1];
    // If the search goes to search results, the first one is not a place
    // If the search goes to a place directly, the first one is that place
    if (organicResults.length > 1) {
        organicResults = organicResults.slice(1)
    }
    organicResults.forEach((/** @type {any} */ result ) => {
        const placeData = parsePaginationResult(result, false);
        if (placeData) {
            placePaginationData.push(placeData);
        } else {
            log.warning(`[SEARCH]: Cannot find place data in search.`)
        }
    });
    return placePaginationData;
};

/**
 * Response from google xhr is kind a weird. Mix of array of array.
 * This function parse reviews from the response body.
 * @param {Buffer | string} responseBody
 * @param {string} reviewsTranslation
 * @return [place]
 */
const parseReviewFromResponseBody = (responseBody, reviewsTranslation) => {
    /** @type {Review[]} */
    const reviews = [];
    const stringBody = typeof responseBody === 'string'
        ? responseBody
        : responseBody.toString('utf-8');
    const results = stringifyGoogleXrhResponse(stringBody);
    if (!results || !results[2]) return reviews;
    results[2].forEach((/** @type {any} */ reviewArray) => {
        let text = reviewArray[3];

        // Optionally remove translation
        // TODO: Perhaps the text is differentiated in the JSON
        if (typeof text === 'string' && reviewsTranslation !== 'originalAndTranslated') {
            const splitReviewText = text.split('\n\n(Original)\n');

            if (reviewsTranslation === 'onlyOriginal') {
                // Fallback if there is no translation
                text = splitReviewText[1] || splitReviewText[0];
            } else if (reviewsTranslation === 'onlyTranslated') {
                text = splitReviewText[0];
            }
            text = text.replace('(Translated by Google)', '').replace('\n\n(Original)\n', '').trim();
        }

        /** @type {Review} */
        const reviewData = {
            name: reviewArray[0][1],
            text,
            publishAt: reviewArray[1],
            timestamp: reviewArray[27],
            likesCount: reviewArray[15],
            reviewId: reviewArray[10],
            reviewUrl: reviewArray[18],
            reviewerId: reviewArray[6],
            reviewerUrl: reviewArray[0][0],
            reviewerNumberOfReviews: reviewArray[12] && reviewArray[12][1] && reviewArray[12][1][1],
            isLocalGuide: reviewArray[12] && reviewArray[12][1] && Array.isArray(reviewArray[12][1][0]),
            stars: undefined,
            rating: undefined,
            responseFromOwnerText: undefined,
            responseFromOwnerTimestamp: undefined,
        };
        // On some places google shows reviews from other services like booking
        // There isn't stars but rating for this places reviews
        if (reviewArray[4]) {
            reviewData.stars = reviewArray[4];
        }
        // Trip advisor
        if (reviewArray[25]) {
            reviewData.rating = reviewArray[25][1];
        }
        if (reviewArray[9]) {
            reviewData.responseFromOwnerText = reviewArray[9][1];
            reviewData.responseFromOwnerTimestamp = reviewArray[9][3];
        }
        reviews.push(reviewData);
    });
    return reviews;
};

/**
 * Method scrolls page to xpos, ypos.
 * @param {Puppeteer.Page} page
 * @param {string} selectorToScroll
 * @param {number} scrollToHeight
 */
const scrollTo = async (page, selectorToScroll, scrollToHeight) => {
    try {
        await page.waitForSelector(selectorToScroll);
    } catch (e) {
        log.warning(`Could not find selector ${selectorToScroll} to scroll to - ${page.url()}`);
    }
    await page.evaluate((selector, height) => {
        const scrollable = document.querySelector(selector);
        scrollable.scrollTop = height;
    }, selectorToScroll, scrollToHeight);
};

/** @param {string} url */
const parseZoomFromUrl = (url) => {
    const zoomMatch = url.match(/@[0-9.-]+,[0-9.-]+,([0-9.]+)z/);
    return zoomMatch ? Number(zoomMatch[1]) : null;
};

/** @param {string[]} imageUrls */
const enlargeImageUrls = (imageUrls) => {
    // w1920-h1080
    const FULL_RESOLUTION = {
        width: 1920,
        height: 1080,
    };
    return imageUrls.map((imageUrl) => {
        const sizeMatch = imageUrl.match(/=s\d+/);
        const widthHeightMatch = imageUrl.match(/=w\d+-h\d+/);
        if (sizeMatch) {
            return imageUrl.replace(sizeMatch[0], `=s${FULL_RESOLUTION.width}`);
        }
        if (widthHeightMatch) {
            return imageUrl.replace(widthHeightMatch[0], `=w${FULL_RESOLUTION.width}-h${FULL_RESOLUTION.height}`);
        }
        return imageUrl;
    });
};

/**
 * Waits until a predicate (funcion that returns bool) returns true
 *
 * ```
 * let eventFired = false;
 * await waiter(() => eventFired, { timeout: 120000, pollInterval: 1000 })
 * // Something happening elsewhere that will set eventFired to true
 * ```
 *
 * @param {function} predicate
 * @param {object} [options]
 * @param {number} [options.timeout]
 * @param {number} [options.pollInterval]
 * @param {string} [options.timeoutErrorMeesage]
 * @param {string} [options.successMessage]
 */
const waiter = async (predicate, options = {}) => {
    const { timeout = 120000, pollInterval = 1000, timeoutErrorMeesage, successMessage } = options;
    const start = Date.now();
    for (;;) {
        if (await predicate()) {
            if (successMessage) {
                log.info(successMessage);
            }
            return;
        }
        const waitingFor = Date.now() - start;
        if (waitingFor > timeout) {
            throw new Error(timeoutErrorMeesage || `Timeout reached when waiting for predicate for ${waitingFor} ms`);
        }
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
};

/**
 * @param {Puppeteer.Page} page
 * @param {string} url
 */
const waitAndHandleConsentFrame = async (page, url) => {
    const predicate = async () => {
        for (const frame of page.mainFrame().childFrames()) {
            if (frame.url().includes('consent.google.com')) {
                await frame.click('#introAgreeButton');
                return true;
            }
        }
    };
    await waiter(predicate, {
        timeout: 60000,
        pollInterval: 500,
        timeoutErrorMeesage: `Waiting for consent screen frame timeouted after 60000ms on URL: ${url}`,
        successMessage: `Aproved consent screen on URL: ${url}`,
    });
};

module.exports = {
    waitForGoogleMapLoader,
    parseSearchPlacesResponseBody,
    parseReviewFromResponseBody,
    scrollTo,
    parseZoomFromUrl,
    enlargeImageUrls,
    waiter,
    waitAndHandleConsentFrame,
};
