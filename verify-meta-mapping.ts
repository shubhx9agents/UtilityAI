import { mapToMetaAdsCSV, AdVariation } from './lib/ai/meta-ads-mapping';

const sampleAds: AdVariation[] = [
    {
        platform: 'Facebook',
        angle: 'Test Angle',
        headline: 'Test Headline',
        body: 'Test Body',
        cta: 'Learn More'
    }
];

const csv = mapToMetaAdsCSV(sampleAds, 'Test Business');
const lines = csv.split('\n');
const headers = lines[0].split(',');

console.log('Total Headers:', headers.length);
if (headers.length === 114) {
    console.log('SUCCESS: Correct number of columns (114).');
} else {
    console.error('FAILURE: Expected 114 columns, got', headers.length);
}

const firstHeader = headers[0];
const lastHeader = headers[headers.length - 1];

console.log('First Header:', firstHeader);
console.log('Last Header:', lastHeader);

if (firstHeader === 'Campaign ID' && lastHeader === 'Story ID') {
    console.log('SUCCESS: Column order matches meta_columns.json.');
} else {
    console.error('FAILURE: Column order mismatch.');
}

const dataRow = lines[1].split(',');
console.log('Data Row Length:', dataRow.length);

// Check if placeholders are gone
const budgetIndex = headers.indexOf('Ad Set Daily Budget');
const linkIndex = headers.indexOf('Link');
console.log('Budget Value:', dataRow[budgetIndex]);
console.log('Link Value:', dataRow[linkIndex]);

if (dataRow[budgetIndex] === '' && dataRow[linkIndex] === '') {
    console.log('SUCCESS: Placeholders removed.');
} else {
    console.error('FAILURE: Placeholders still present.');
}
