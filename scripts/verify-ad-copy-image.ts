import { aiService } from '../lib/ai/agents'

async function testAdCopyImage() {
    console.log('--- Testing Ad Copy Image Generation ---')

    const userInput = 'Generate a high-converting ad for a luxury watch brand.'
    const context = {
        'Image Model': 'seedream-4-0-250828',
        'Aspect Ratio': 'Square',
        'Product/Service Name': 'Luminar Luxury Watch',
        'Main Features/Benefits': 'Elegant design, Swiss movement, Water resistant',
        'Target Audience': 'Successful professionals',
        'Ad Tone': 'Sophisticated'
    }

    try {
        console.log('Running runAgent for ad_copy...')
        const result = await aiService.runAgent('ad_copy', userInput, context)

        console.log('Result Summary:')
        console.log('- Response Length:', result.response.length)
        console.log('- Includes CSV Headers:', result.response.includes('Platform,Angle,Headline,Body,CTA'))
        console.log('- Includes IMAGE_URL:', result.response.includes('IMAGE_URL:'))

        if (result.response.includes('IMAGE_URL:')) {
            const url = result.response.split('IMAGE_URL:')[1].trim()
            console.log('- Extracted URL:', url)
            if (url.startsWith('http') || url.startsWith('data:image/')) {
                console.log('✅ Success: Valid Image URL found!')
            } else {
                console.log('❌ Failure: Invalid Image URL format.')
            }
        } else {
            console.log('⚠️ Warning: No IMAGE_URL found in response.')
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error)
    }
}

// Check if we have API keys
if (!process.env.GROQ_API_KEY || !process.env.BYTEPLUS_API_KEY) {
    console.warn('⚠️ Missing API keys. Mocking service for dry run...')
    // Mock implementation for demonstration if keys are missing
    const mockResult = {
        response: 'Platform,Angle,Headline,Body,CTA\nFacebook,Professional,Luminar,Elegant,Learn More\n\nIMAGE_URL: https://example.com/mock-image.png'
    }
    console.log('Mocked Result includes IMAGE_URL:', mockResult.response.includes('IMAGE_URL:'))
} else {
    testAdCopyImage()
}
