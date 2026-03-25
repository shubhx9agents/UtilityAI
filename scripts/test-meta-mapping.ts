import { mapToMetaAdsCSV, AdVariation } from '../lib/ai/meta-ads-mapping';

const sampleAds: AdVariation[] = [
    {
        platform: 'Facebook',
        angle: 'Problem-Solution',
        headline: 'Stop Wasting Money on Ads',
        body: 'Are you tired of zero ROI? Our expert team can help you scale your business with ease.',
        cta: 'Learn More'
    },
    {
        platform: 'Instagram',
        angle: 'Benefit-Driven',
        headline: 'Scale Your Business Faster',
        body: 'Unlock the secrets to 10x growth with our proven strategies. Join 1000+ happy clients.',
        cta: 'Sign Up'
    }
];

const businessName = 'TechFlow Solutions';
const csv = mapToMetaAdsCSV(sampleAds, businessName);

console.log('--- Generated Meta Ads CSV ---');
console.log(csv);
console.log('------------------------------');

const lines = csv.split('\n');
const headers = lines[0].split(',');

// Basic Assertions
if (lines.length !== 3) {
    console.error(`Error: Expected 3 lines, got ${lines.length}`);
} else {
    console.log('Success: Correct number of rows.');
}

if (headers[0] !== 'Campaign ID') {
    console.error(`Error: Header mismatch. Expected "Campaign ID", got "${headers[0]}"`);
} else {
    console.log('Success: Headers look correct.');
}

const firstRow = lines[1].split(',');
if (!firstRow[1].includes('TechFlow Solutions')) {
    console.error(`Error: Business name not found in Campaign Name: ${firstRow[1]}`);
} else {
    console.log(`Success: Business name found in Campaign Name: ${firstRow[1]}`);
}

console.log('Verification Complete!');
