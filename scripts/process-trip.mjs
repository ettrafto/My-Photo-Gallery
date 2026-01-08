#!/usr/bin/env node

/**
 * Process trip CSV files - converts CSV of lat/lng points into JSON polyline format
 * Reads all .csv files from content/trips/ and generates matching *-map.json files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const TRIPS_DIR = path.join(ROOT, 'content', 'trips');

/**
 * Strip quotes and convert string to number
 */
function parseValue(value) {
  // Remove surrounding quotes if present
  const unquoted = value.trim().replace(/^"|"$/g, '');
  const num = parseFloat(unquoted);
  if (isNaN(num)) {
    throw new Error(`Invalid number: ${value}`);
  }
  return num;
}

/**
 * Parse CSV line and extract lat/lng
 */
function parseCSVLine(line) {
  // Skip empty lines
  if (!line || line.trim() === '') {
    return null;
  }

  // Simple CSV parser: split on comma, handle quoted values
  const parts = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last part
  if (current || parts.length > 0) {
    parts.push(current);
  }

  // Expect exactly 2 values: lat, lng
  if (parts.length !== 2) {
    throw new Error(`Expected 2 columns (lat, lng), got ${parts.length} in line: ${line}`);
  }

  return {
    lat: parseValue(parts[0]),
    lng: parseValue(parts[1])
  };
}

/**
 * Process a single CSV file
 */
function processCSVFile(csvPath) {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split(/\r?\n/);
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Skip header row (first line should be "lat","lng")
  const dataLines = lines.slice(1);
  
  const polyline = [];
  
  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    const point = parseCSVLine(line);
    
    if (point) {
      // Every point must have an empty label
      polyline.push({
        lat: point.lat,
        lng: point.lng,
        label: ""
      });
    }
  }

  if (polyline.length === 0) {
    throw new Error('No valid data points found in CSV (only header or empty lines)');
  }

  return {
    polyline: polyline,
    gpxFile: null
  };
}

/**
 * Main function
 */
function main() {
  console.log('🔄 Processing trip CSV files...\n');

  // Check if trips directory exists
  if (!fs.existsSync(TRIPS_DIR)) {
    console.error(`❌ Trips directory not found: ${TRIPS_DIR}`);
    process.exit(1);
  }

  // Find all CSV files in trips directory
  const files = fs.readdirSync(TRIPS_DIR);
  const csvFiles = files.filter(file => file.toLowerCase().endsWith('.csv'));

  if (csvFiles.length === 0) {
    console.log('⚠ No CSV files found in content/trips/');
    return;
  }

  console.log(`Found ${csvFiles.length} CSV file(s):`);

  let processedCount = 0;
  let errorCount = 0;

  for (const csvFile of csvFiles) {
    const csvPath = path.join(TRIPS_DIR, csvFile);
    
    try {
      console.log(`\n  Processing: ${csvFile}`);
      
      // Generate output filename: remove .csv extension, add -map.json
      const baseName = path.basename(csvFile, '.csv');
      const outputFileName = `${baseName}-map.json`;
      const outputPath = path.join(TRIPS_DIR, outputFileName);
      
      // Process CSV to JSON
      const jsonData = processCSVFile(csvPath);
      
      // Write output file
      fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
      
      console.log(`    ✅ Generated: ${outputFileName} (${jsonData.polyline.length} points)`);
      processedCount++;
      
    } catch (err) {
      console.error(`    ❌ Error processing ${csvFile}:`, err.message);
      errorCount++;
    }
  }

  console.log(`\n✅ Processed ${processedCount} file(s) successfully`);
  if (errorCount > 0) {
    console.error(`❌ ${errorCount} file(s) failed`);
    process.exit(1);
  }
}

main();
