const Apify = require('apify'); // eslint-disable-line no-unused-vars

/**
 * Options for the scraping process
 * @typedef ScrapingOptions
 * @property {boolean} includeHistogram
 * @property {boolean} includeOpeningHours
 * @property {boolean} includePeopleAlsoSearch
 * @property {number} maxReviews
 * @property {number} maxImages
 * @property {number} [maxCrawledPlaces]
 * @property {number} [maxAutomaticZoomOut]
 * @property {boolean} exportPlaceUrls
 * @property {boolean} additionalInfo
 * @property {PlacesCache} placesCache
 * @property {string} reviewsSort
 * @property {string} language
 * @property {number} multiplier
 * @property {object} geo
 * @property {string} reviewsTranslation
 */

/**
 * Options to set up the crawler
 * @typedef CrawlerOptions
 * @property {Apify.RequestQueue} requestQueue
 * @property {Apify.ProxyConfiguration} [proxyConfiguration]
 * @property {Apify.PuppeteerPoolOptions} puppeteerPoolOptions
 * @property {number} [maxConcurrency]
 * @property {Apify.LaunchPuppeteerFunction} launchPuppeteerFunction
 * @property {boolean} useSessionPool
 * @property {number} pageLoadTimeoutSec
 * @property {number} handlePageTimeoutSecs
 * @property {number} maxRequestRetries
 */

/**
 * Options you can pass to the actor run
 * @typedef Input
 * @property {Apify.RequestOptions[]} [startUrls]
 * @property {string[]} [searchStringsArray]
 * @property {string} [lat]
 * @property {string} [lng]
 * @property {string} [country]
 * @property {string} [state]
 * @property {string} [city]
 * @property {string} [postalCode]
 * @property {number} [zoom]
 * @property {number} [pageLoadTimeoutSec]
 * @property {boolean} [useChrome]
 * @property {number} [maxConcurrency]
 * @property {number} [maxPagesPerBrowser]
 * @property {number} [maxPageRetries]
 * @property {Apify.ProxyConfigurationOptions} [proxyConfig]
 * @property {boolean} [debug]
 * @property {string} [language]
 * @property {boolean} [useStealth]
 * @property {boolean} [headless]
 * @property {any} [walker]
 * @property {boolean} [includeHistogram]
 * @property {boolean} [includeOpeningHours]
 * @property {boolean} [includePeopleAlsoSearch]
 * @property {number} [maxReviews]
 * @property {number} [maxImages]
 * @property {boolean} [exportPlaceUrls]
 * @property {boolean} [additionalInfo]
 * @property {number} [maxCrawledPlaces]
 * @property {number} [maxAutomaticZoomOut]
 * @property {boolean} [cachePlaces]
 * @property {string} [reviewsSort]
 * @property {string} [reviewsTranslation]
 */

/**
 * @typedef Review
 * @property {string} name
 * @property {string} text
 * @property {string} publishAt
 * @property {number} timestamp
 * @property {number} likesCount
 * @property {string} reviewId
 * @property {string} reviewUrl
 * @property {string} reviewerId
 * @property {string} reviewerUrl
 * @property {number} reviewerNumberOfReviews
 * @property {boolean} isLocalGuide
 * @property {number | undefined} stars
 * @property {number | undefined} rating
 * @property {string | undefined} responseFromOwnerText
 * @property {number} responseFromOwnerTimestamp
 */

/**
 * @typedef GeolocationOptions
 * @property {string | undefined} city
 * @property {string | undefined} state
 * @property {string | undefined} country
 * @property {string | undefined} postalCode
 */

/**
 * @typedef {{
 * failed: number,
 * ok: number,
 * outOfPolygon: number,
 * outOfPolygonCached: number,
 * places: number,
 * maps: number,
 * }} InnerStats
 */

/**
 * @typedef {{
 * lat: number,
 * lng: number,
 * }} Coordinates
 */

/**
 * @typedef {{
 * placeId: string,
 * coords: Coordinates,
 * addressParsed: AddressParsed | undefined,
 * isAdvertisement: boolean,
 * }} PlacePaginationData
 */

/**
 * @typedef {{
 * rank: number,
 * searchPageUrl: string,
 * addressParsed: AddressParsed | undefined,
 * isAdvertisement: boolean
 * }} PlaceUserData
 */

/**
 * @typedef {{
 * neighborhood: string,
 * street: string,
 * city: string,
 * postalCode: string,
 * state: string,
 * countryCode: string,
 * }} AddressParsed
 */

/**
 * @typedef {{
 * url: string,
 * searchPageUrl: string,
 * coordinates: Coordinates,
 * }} PlaceOutOfPolygon
 */

/**
 * @typedef {{
 * keywords: string[],
 * location: Coordinates,
 * }} CachedPlace
 */

/**
 * @typedef {{
 * geojson: {
 *     type: string,
 *     coordinates: number[][]
 * }
 * }} GeoJson
 */

module.exports = {};
