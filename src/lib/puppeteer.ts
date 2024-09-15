import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Page } from "puppeteer";
import { appendToCSV, initializeCSV } from "./csv";
import { DEFAULT_URL_PATTERNS } from "../constants/url";

puppeteer.use(StealthPlugin());

export const scrollToStoredHeight = async (
  page: Page,
  storedHeight: number
) => {
  await page.evaluate(async (storedHeight) => {
    return new Promise<void>((resolve, reject) => {
      const scrollToHeight = () => {
        const scrollTop = window.scrollY;

        if (scrollTop >= storedHeight) {
          resolve();
        } else {
          window.scrollTo(0, storedHeight);

          setTimeout(() => {
            resolve();
          }, 1000);
        }
      };

      scrollToHeight();
    });
  }, storedHeight);
};

export const fetchProductsFromPage = async (
  page: Page,
  urlPatterns: RegExp[]
): Promise<any[]> => {
  return page.evaluate(
    (patterns) => {
      return Array.from(document.querySelectorAll("a"))
        .map((a) => a.href)
        .filter((href) =>
          patterns.some((pattern: string) => new RegExp(pattern).test(href))
        )
        .map((href) => ({ url: href }));
    },
    urlPatterns.map((p) => p.source)
  );
};

export const crawlSearchPage = async (
  baseUrl: string,
  keyword: string,
  siteName: string,
  urlPatterns: RegExp[] = DEFAULT_URL_PATTERNS,
  infiniteScroll: boolean = false
): Promise<void> => {
  const fileName = await initializeCSV(keyword, siteName);
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  );

  const existingUrls = new Set<string>();

  try {
    if (infiniteScroll) {
      let hasMoreProducts = true;
      await page.goto(baseUrl, { waitUntil: "networkidle2" });

      let storedHeight = await page.evaluate(() => document.body.scrollHeight);

      while (hasMoreProducts) {
        console.log(`Fetching products...`);

        const products = await fetchProductsFromPage(page, urlPatterns);

        const newProducts = products.filter((product) => {
          if (existingUrls.has(product.url)) {
            return false;
          }
          existingUrls.add(product.url);
          return true;
        });

        if (newProducts.length > 0) {
          await appendToCSV(
            fileName,
            newProducts.map((p) => ({ keyword, ...p, site: siteName }))
          );
        }

        await scrollToStoredHeight(page, storedHeight);

        const newHeight = await page.evaluate(() => document.body.scrollHeight);

        if (newHeight <= storedHeight) {
          hasMoreProducts = false;
        }

        storedHeight = newHeight;
      }
    } else {
      let pageNum = 1;

      while (true) {
        const searchUrl = `${baseUrl}&page=${pageNum}`;
        console.log(`Crawling: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: "networkidle2" });

        const products = await fetchProductsFromPage(page, urlPatterns);

        const newProducts = products.filter((product) => {
          if (existingUrls.has(product.url)) {
            return false;
          }
          existingUrls.add(product.url);
          return true;
        });

        if (newProducts.length === 0) {
          console.log(`No more products found on page ${pageNum}. Stopping...`);
          break;
        }

        await appendToCSV(
          fileName,
          newProducts.map((p) => ({ keyword, ...p, site: siteName }))
        );
        pageNum++;
      }
    }
  } catch (error) {
    console.error(`Failed to crawl ${baseUrl}: `, error);
  } finally {
    await browser.close();
  }
};

const crawlSite = async (
  searchUrl: string,
  keyword: string,
  siteName: string,
  infiniteScroll: boolean = false,
  urlPatterns?: RegExp[]
): Promise<void> => {
  await crawlSearchPage(
    searchUrl,
    keyword,
    siteName,
    urlPatterns,
    infiniteScroll
  );
};

export const crawlMultipleSearches = async (
  searchUrls: {
    keyword: string;
    url: string;
    siteName: string;
    infiniteScroll: boolean;
  }[]
): Promise<void> => {
  await Promise.all(
    searchUrls.map(({ keyword, url, siteName, infiniteScroll }) =>
      crawlSite(url, keyword, siteName, infiniteScroll)
    )
  );
};
