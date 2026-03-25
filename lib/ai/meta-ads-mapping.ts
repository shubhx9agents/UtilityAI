export interface AdVariation {
    platform: string;
    angle: string;
    headline: string;
    body: string;
    cta: string;
}

/**
 * Maps structured ad variations to the Meta Ads Bulk CSV Template format.
 * Follows the "partial but correct" principle.
 */
export function mapToMetaAdsCSV(adVariations: AdVariation[], businessName: string = 'My Business'): string {
    // Standard Meta Ads Template Column Headers from meta_columns.json (total 114 columns)
    const headers = [
        "Campaign ID", "Campaign Name", "Campaign Status", "Special Ad Categories", "Special Ad Category Country",
        "Campaign Objective", "Buying Type", "Campaign Spend Limit", "Campaign Daily Budget", "Campaign Lifetime Budget",
        "Campaign Bid Strategy", "Tags", "Campaign Is Using L3 Schedule", "Campaign Start Time", "Campaign Stop Time",
        "Ad Set ID", "Ad Set Run Status", "Ad Set Name", "Ad Set Time Start", "Ad Set Time Stop",
        "Ad Set Daily Budget", "Ad Set Lifetime Budget", "Link Object ID", "Link", "Application ID",
        "Countries", "Global Regions", "Excluded Global Regions", "Cities", "Regions",
        "Zip", "Gender", "Age Min", "Age Max", "Education Status",
        "College Start Year", "College End Year", "Interested In", "Relationship", "Connections",
        "Excluded Connections", "Friends of Connections", "Locales", "Broad Category Clusters", "Custom Audiences",
        "Excluded Custom Audiences", "Location Cluster IDs", "Excluded Location Cluster IDs", "Publisher Platforms", "Device Platforms",
        "Facebook Positions", "Instagram Positions", "Messenger Positions", "Oculus Positions", "Audience Network Positions",
        "Optimization Goal", "Billing Event", "Bid Amount", "Ad Set Bid Strategy", "Beneficiary (financial ads in Taiwan)",
        "Payer (financial ads in Taiwan)", "Beneficiary (Taiwan)", "Payer (Taiwan)", "Beneficiary (financial ads in Australia)", "Payer (financial ads in Australia)",
        "Beneficiary (Singapore)", "Payer (Singapore)", "Minimum ROAS", "Ad Set Minimum Spend Limit", "Ad Set Maximum Spend Limit",
        "Beneficiary (securities ads in India)", "Payer (securities ads in India)", "Beneficiary (selected locations)", "Payer (selected locations)", "Large Geo Areas",
        "Excluded Large Geo Areas", "Medium Geo Areas", "Excluded Medium Geo Areas", "Small Geo Areas", "Excluded Small Geo Areas",
        "Metro Areas", "Excluded Metro Areas", "Subcities", "Excluded Subcities", "Neighborhoods",
        "Excluded Neighborhoods", "Subneighborhoods", "Excluded Subneighborhoods", "Ad ID", "Ad Status",
        "Ad Name", "Title", "Body", "Link Description", "Display Link",
        "Image Hash", "Creative Type", "URL Tags", "Image File Name", "Creative Optimization",
        "Product 1 - Link", "Product 1 - Name", "Product 1 - Description", "Product 1 - Image Hash", "Product 2 - Link",
        "Product 2 - Name", "Product 2 - Description", "Product 2 - Image Hash", "Product 3 - Link", "Product 3 - Name",
        "Product 3 - Description", "Product 3 - Image Hash", "Call to Action", "Story ID"
    ];

    // Helper to escape CSV values
    const escape = (val: string | number | null | undefined) => {
        if (val === null || val === undefined) return '';
        const s = String(val);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };

    // Helper to map CTA to Meta Enum
    const mapCTA = (cta: string | null | undefined): string => {
        const c = String(cta || '').toUpperCase().replace(/\s+/g, '_');
        if (c.includes('LEARN_MORE')) return 'LEARN_MORE';
        if (c.includes('SHOP_NOW')) return 'SHOP_NOW';
        if (c.includes('BOOK_NOW')) return 'BOOK_NOW';
        if (c.includes('SIGN_UP')) return 'SIGN_UP';
        if (c.includes('CONTACT_US')) return 'CONTACT_US';
        if (c.includes('GET_QUOTE')) return 'GET_QUOTE';
        if (c.includes('DOWNLOAD')) return 'DOWNLOAD';
        if (c.includes('ORDER_NOW')) return 'SHOP_NOW'; // Common alias
        if (c.includes('GET_OFFER')) return 'GET_OFFER';
        return 'LEARN_MORE'; // Default fallback
    };

    const rows = [headers.join(',')];

    adVariations.forEach((ad, index) => {
        // We only map Meta-related ads or if platform is not strictly specified
        const platformLower = (ad.platform || '').toLowerCase();
        if (platformLower !== 'facebook' && platformLower !== 'instagram' && platformLower !== 'meta' && platformLower !== '') {
            return;
        }

        const campaignName = `${businessName} - ${ad.angle} Campaign`;
        const adSetName = `${ad.platform} - ${ad.angle} Set`;
        const adName = `${ad.angle} Var ${index + 1}`;

        // Data mapping strictly avoiding placeholders (if unknown, keep blank)
        const data: Record<string, string> = {
            "Campaign Name": campaignName,
            "Campaign Status": "PAUSED",
            "Ad Set Name": adSetName,
            "Ad Set Run Status": "PAUSED", // Note: This field name changed in the full schema
            "Ad Name": adName,
            "Ad Status": "PAUSED",
            "Title": ad.headline,
            "Body": ad.body,
            "Call to Action": mapCTA(ad.cta)
        };

        // Create the row by iterating through headers sequentially
        const row = headers.map(h => escape(data[h] || ''));
        rows.push(row.join(','));
    });

    return rows.join('\n');
}
