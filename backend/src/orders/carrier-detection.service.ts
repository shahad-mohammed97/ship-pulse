import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';

@Injectable()
export class CarrierDetectionService implements OnModuleInit {
    private carriers: any[] = [];

    async onModuleInit() {
        await this.loadCarriers();
    }

    private parseCsv(filePath: string, onData: (data: any) => void): Promise<void> {
        return new Promise((resolve) => {
            if (!fs.existsSync(filePath)) {
                console.warn(`File not found: ${filePath}`);
                return resolve();
            }
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', onData)
                .on('end', () => resolve())
                .on('error', (err) => {
                    console.error(`Error parsing ${filePath}:`, err);
                    resolve();
                });
        });
    }

    private async loadCarriers(): Promise<void> {
        const carriersData = new Map<string, any>();

        const normalizeName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

        // 1. Load Primary CSV (Arabic with many fields)
        const mainCsv = path.join(process.cwd(), 'src/orders/data/carriers.csv');
        await this.parseCsv(mainCsv, (row) => {
            const keys = Object.keys(row);
            const nameKey = keys.find(k => k.includes('الشركة') || k.includes('Carrier'));
            let name = nameKey ? row[nameKey] : '';
            if (!name) return;

            const prefixKey = keys.find(k => k.includes('البادئات') || k.includes('Prefixes'));
            const suffixKey = keys.find(k => k.includes('اللاحقات') || k.includes('Suffixes'));
            const regexKey = keys.find(k => k.includes('التعبير النمطي') || k.includes('Regex'));
            const url = Object.values(row).find((v: any) => v?.toString().startsWith('http')) || '';

            const normalizedName = normalizeName(name);
            carriersData.set(normalizedName, {
                name,
                prefixes: (prefixKey && row[prefixKey] !== 'لا يوجد' && row[prefixKey] !== '') ? row[prefixKey].split(',').map((p: string) => p.trim().toUpperCase()) : [],
                suffixes: (suffixKey && row[suffixKey] !== 'لا يوجد' && row[suffixKey] !== '') ? row[suffixKey].split(',').map((s: string) => s.trim().toUpperCase()) : [],
                regex: regexKey ? row[regexKey].split(' (')[0].trim() : '',
                url: url as string
            });
        });

        // 2. Load Supplemental CSV (English/Simple)
        const suppCsv = path.join(process.cwd(), 'src/orders/data/carriers_supplement.csv');
        await this.parseCsv(suppCsv, (row) => {
            const name = row['carrier name']?.trim();
            if (!name) return;

            const normalizedName = normalizeName(name);
            let pattern = row['pattern']?.trim().toUpperCase();
            const url = row['Link']?.trim();

            const existing = carriersData.get(normalizedName) || {
                name,
                prefixes: [],
                suffixes: [],
                regex: '',
                url: ''
            };

            // Parse pattern
            if (pattern && pattern !== 'NO' && pattern !== 'لا يوجد' && pattern !== '') {
                if (pattern.includes('DIGIT')) {
                    const match = pattern.match(/(\d+)\s*DIGIT/);
                    if (match) {
                        const digits = match[1];
                        const digitRegex = `^\\d{${digits}}$`;
                        // Only set if no specific regex exists, or combine?
                        // For now, let's add it to a list of digit-based rules
                        if (!existing.regex || existing.regex.includes('\\d{')) {
                            // If primary was also digit-based, this one might be more specific
                            existing.regex = digitRegex;
                        }
                    }
                } else if (!existing.prefixes.includes(pattern)) {
                    existing.prefixes.push(pattern);
                }
            }
            if (url && !existing.url) existing.url = url;

            carriersData.set(normalizedName, existing);
        });

        this.carriers = Array.from(carriersData.values());
        
        // Sort prefixes by length (longest first) to avoid shadowing (e.g. "ES1" before "E")
        this.carriers.forEach(c => {
            c.prefixes.sort((a: string, b: string) => b.length - a.length);
        });
    }

    detect(trackingNumber: string): { carrier: string | null, country: string | null, url: string | null } {
        if (!trackingNumber) return { carrier: null, country: null, url: null };
        
        const cleanTracking = trackingNumber.trim().toUpperCase();

        // 1. PHASE 1: Try All Explicit Prefixes first (Longest First)
        // We need to check all carriers' prefixes together and find the longest match overall
        let bestMatch: { carrier: any, prefixLength: number } | null = null;

        for (const carrier of this.carriers) {
            for (const p of carrier.prefixes) {
                if (cleanTracking.startsWith(p)) {
                    if (!bestMatch || p.length > bestMatch.prefixLength) {
                        bestMatch = { carrier, prefixLength: p.length };
                    }
                }
            }
        }

        if (bestMatch) {
            return { 
                carrier: bestMatch.carrier.name, 
                country: this.detectCountry(cleanTracking), 
                url: bestMatch.carrier.url 
            };
        }

        // 2. PHASE 2: Try All Specific Suffixes
        for (const carrier of this.carriers) {
            if (carrier.suffixes.some((s: string) => cleanTracking.endsWith(s))) {
                return { carrier: carrier.name, country: this.detectCountry(cleanTracking), url: carrier.url };
            }
        }

        // 3. PHASE 3: Try Regex Matching
        const sortedForRegex = [...this.carriers].sort((a, b) => {
            const aIsBroad = a.regex.includes('\\d{') && !/[A-Z]/.test(a.regex);
            const bIsBroad = b.regex.includes('\\d{') && !/[A-Z]/.test(b.regex);
            if (aIsBroad && !bIsBroad) return 1;
            if (!aIsBroad && bIsBroad) return -1;
            return 0;
        });

        for (const carrier of sortedForRegex) {
            if (carrier.regex) {
                try {
                    const pattern = carrier.regex.includes('|') && !carrier.regex.startsWith('(') 
                        ? `^(${carrier.regex.replace(/^\^/, '').replace(/\$$/, '')})$` 
                        : carrier.regex;
                        
                    const re = new RegExp(pattern, 'i');
                    if (re.test(cleanTracking)) {
                        return { carrier: carrier.name, country: this.detectCountry(cleanTracking), url: carrier.url };
                    }
                } catch (e) { }
            }
        }
        return { carrier: null, country: null, url: null };
    }

    private detectCountry(trackingNumber: string): string | null {
        const clean = trackingNumber.trim().toUpperCase();
        
        // International Suffix Map
        const countryMap: Record<string, string> = {
            'US': 'USA',
            'GB': 'United Kingdom',
            'CN': 'China',
            'HK': 'Hong Kong',
            'SG': 'Singapore',
            'DE': 'Germany',
            'FR': 'France',
            'AE': 'UAE',
            'SA': 'Saudi Arabia',
        };

        const suffix = clean.slice(-2);
        if (countryMap[suffix]) {
            return countryMap[suffix];
        }

        return null;
    }
}
