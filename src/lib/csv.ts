import { createObjectCsvWriter } from "csv-writer";
import fs from "fs";

import { getFileName } from "./file";
import { ProductInfo } from "../types";

export const initializeCSV = async (keyword: string, siteName: string) => {
  const outputDir = "./out";
  const fileName = `${outputDir}/${getFileName(keyword, siteName)}`;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  if (!fs.existsSync(fileName)) {
    const csvWriter = createObjectCsvWriter({
      path: fileName,
      header: [
        { id: "keyword", title: "Product Keyword" },
        { id: "url", title: "URL" },
        { id: "site", title: "Site" },
      ],
    });
    await csvWriter.writeRecords([]);
  }

  return fileName;
};

export const appendToCSV = async (
  fileName: string,
  products: ProductInfo[]
) => {
  const csvWriter = createObjectCsvWriter({
    path: fileName,
    header: [
      { id: "keyword", title: "Product Keyword" },
      { id: "url", title: "URL" },
      { id: "site", title: "Site" },
    ],
    append: true,
  });

  await csvWriter.writeRecords(products);
  console.log(`Data appended to ${fileName}`);
};
