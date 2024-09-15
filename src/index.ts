import { crawlMultipleSearches } from "./lib/puppeteer";
import { crawlUrls } from "./seed/input";

const main = async (): Promise<void> => {
  await crawlMultipleSearches(crawlUrls);
};

main()
  .then(() => {
    console.log("Crawling in progress...");
  })
  .catch((err: any) => {
    console.error("Error while crawling: ", err);
    process.exit(1);
  });
