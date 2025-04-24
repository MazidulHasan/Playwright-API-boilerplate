// src/utilities/excelUtils.js
import * as XLSX from 'xlsx'; // Import the xlsx library
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../support/commonUtility/API/logger'; // Import logger
import fs from 'fs'; // Import Node.js file system module

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename)); // Project root

/**
 * Reads data from a specified sheet in an Excel file and converts it to an array of JSON objects.
 * Handles nested properties indicated by dot notation in headers (e.g., 'prescriber.name').
 * Attempts basic type coercion for numbers and booleans.
 *
 * @param {string} relativeFilePath - Path to the Excel file relative to the project root (e.g., 'data/login_data.xlsx').
 * @param {string} sheetName - The name of the sheet to read.
 * @returns {Array<object>} An array of objects representing rows. Returns empty array on error or if sheet is empty/only header.
 * @throws {Error} If the file/sheet doesn't exist or cannot be parsed.
 */
export function readExcelData(relativeFilePath, sheetName) {
  const absoluteFilePath = path.resolve(__dirname, relativeFilePath);
  logger.info(`Reading Excel data from: ${absoluteFilePath}, Sheet: ${sheetName}`);

  try {
    // Verify file exists
    if (!fs.existsSync(absoluteFilePath)) {
      logger.error(`Excel file not found: ${absoluteFilePath}`);
      throw new Error(`Excel file not found: ${relativeFilePath}`);
    }

    // Read workbook
    const workbook = XLSX.readFile(absoluteFilePath, { cellDates: true, dense: true }); // dense: true might help with empty cells

    // Verify sheet exists
    if (!workbook.SheetNames.includes(sheetName)) {
      logger.error(`Sheet "${sheetName}" not found in workbook: ${absoluteFilePath}`);
      throw new Error(`Sheet "${sheetName}" not found in file: ${relativeFilePath}`);
    }
    const worksheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON array of arrays (header: 1)
    // Use raw: false to get formatted values (e.g., dates), defval: null for empty cells
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: false });

    // Check if sheet has at least a header and one data row
    if (!jsonData || jsonData.length < 2) {
      logger.warn(`Sheet "${sheetName}" in ${relativeFilePath} has no data rows (only header or empty). Returning empty array.`);
      return [];
    }

    // Extract headers (first row), filter out any potential null/empty header cells
    const headers = jsonData[0].filter(header => header !== null && header !== undefined && String(header).trim() !== '');
    if (headers.length === 0) {
         logger.warn(`Sheet "${sheetName}" in ${relativeFilePath} has no valid header row. Returning empty array.`);
         return [];
    }

    // Map header names to their original column index for reliable data extraction
    const headerIndexMap = {};
     jsonData[0].forEach((header, index) => {
         if (header !== null && header !== undefined && String(header).trim() !== '') {
             headerIndexMap[String(header)] = index;
         }
     });


    // Process data rows (starting from the second row)
    const dataRows = jsonData.slice(1).map((row, rowIndex) => {
      // Skip empty rows (rows where all cells are null or empty strings)
      if (row.every(cell => cell === null || String(cell).trim() === '')) {
          logger.debug(`Skipping empty row ${rowIndex + 2} in sheet "${sheetName}".`);
          return null; // Mark row to be filtered out
      }

      const rowData = {};
      headers.forEach((header) => {
        const headerStr = String(header); // Ensure header is treated as string
        const cellIndex = headerIndexMap[headerStr]; // Get index based on header map
        let value = (row && cellIndex !== undefined) ? row[cellIndex] : null; // Get value using mapped index, default to null

        // --- Basic Type Coercion ---
        if (value !== null && value !== undefined) {
            const valueStr = String(value).trim();
            // Booleans
            if (valueStr.toLowerCase() === 'true') value = true;
            else if (valueStr.toLowerCase() === 'false') value = false;
            // Numbers (only if it looks like a number and isn't just whitespace)
            else if (valueStr !== '' && !isNaN(valueStr) && !isNaN(parseFloat(valueStr))) value = Number(valueStr);
            // Dates (XLSX handles this with cellDates: true, but keep as Date object or format if needed)
            // else if (value instanceof Date) value = value.toISOString(); // Example: format date to ISO string
        } else {
            value = null; // Treat genuinely empty cells as null
        }

        // --- Handle Nested Properties (e.g., 'prescriber.name') ---
        if (headerStr.includes('.')) {
          const keys = headerStr.split('.');
          let currentLevel = rowData;
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (i === keys.length - 1) {
              // Last key: assign the value
              currentLevel[key] = value;
            } else {
              // Create nested object if it doesn't exist or isn't an object
              if (!currentLevel[key] || typeof currentLevel[key] !== 'object') {
                currentLevel[key] = {};
              }
              currentLevel = currentLevel[key]; // Move deeper
            }
          }
        } else {
          // Assign simple property
          rowData[headerStr] = value;
        }
      });
      return rowData;
    }).filter(row => row !== null); // Filter out skipped empty rows

    logger.info(`Successfully processed ${dataRows.length} data rows from sheet "${sheetName}" in ${absoluteFilePath}`);
    return dataRows;

  } catch (error) {
    logger.error(`Error reading/processing Excel file "${relativeFilePath}" sheet "${sheetName}": ${error.message}`, error.stack);
    throw new Error(`Failed to read/process data from Excel: ${error.message}`); // Re-throw
  }
}