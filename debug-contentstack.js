const contentstack = require('@contentstack/delivery-sdk');
require('dotenv').config();

// Read environment variables
const apiKey = process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY;
const deliveryToken = process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN;
const environment = process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT;
const regionString = process.env.NEXT_PUBLIC_CONTENTSTACK_REGION;

console.log('🔍 Debug Contentstack Connection');
console.log('================================');
console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');
console.log('Delivery Token:', deliveryToken ? `${deliveryToken.substring(0, 10)}...` : 'NOT SET');
console.log('Environment:', environment);
console.log('Region:', regionString);
console.log('');

// Set region manually based on string
const region = regionString === 'NA' ? contentstack.Region.US : contentstack.Region.EU;

console.log('📡 Using region:', regionString, '(', region === contentstack.Region.EU ? 'EU' : 'US', ')');
console.log('');

// Test both EU and NA regions to see which one works
async function testRegion(regionToTest, regionName) {
  console.log(`🧪 Testing ${regionName} region...`);
  
  const stack = contentstack.stack({
    apiKey: apiKey,
    deliveryToken: deliveryToken,
    environment: environment,
    region: regionToTest,
  });

  try {
    const contentTypes = await stack.getContentTypes();
    console.log(`✅ ${regionName} Success! Found`, contentTypes.content_types?.length || 0, 'content types');
    return { success: true, contentTypes: contentTypes.content_types };
  } catch (error) {
    console.log(`❌ ${regionName} failed:`, error.error_message || error.message);
    return { success: false, error };
  }
}

async function testConnection() {
  try {
    console.log('🧪 Testing basic connection...');
    
    // Test 1: Try to get content types
    console.log('1️⃣ Fetching content types...');
    const contentTypes = await stack.getContentTypes();
    console.log('✅ Success! Found', contentTypes.content_types?.length || 0, 'content types');
    
    if (contentTypes.content_types) {
      contentTypes.content_types.forEach(ct => {
        console.log(`   - ${ct.uid}: ${ct.title}`);
      });
    }
    console.log('');
    
    // Test 2: Check if 'page' content type exists
    const hasPageContentType = contentTypes.content_types?.some(ct => ct.uid === 'page');
    console.log('2️⃣ Checking for "page" content type...');
    if (hasPageContentType) {
      console.log('✅ "page" content type found!');
      
      // Test 3: Try to fetch page entries
      console.log('3️⃣ Fetching page entries...');
      const pageEntries = await stack.contentType('page').entry().query().find();
      console.log('✅ Found', pageEntries.entries?.length || 0, 'page entries');
      
      if (pageEntries.entries) {
        pageEntries.entries.forEach(entry => {
          console.log(`   - ${entry.uid}: ${entry.title || 'No title'} (URL: ${entry.url || 'No URL'})`);
        });
      }
    } else {
      console.log('❌ "page" content type not found!');
      console.log('💡 Available content types listed above');
    }
    
  } catch (error) {
    console.log('❌ Connection failed:');
    console.log('Error:', error.message);
    if (error.error_message) {
      console.log('Contentstack Error:', error.error_message);
    }
    if (error.errors) {
      console.log('Validation Errors:', JSON.stringify(error.errors, null, 2));
    }
  }
}

testConnection();