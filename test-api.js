import 'dotenv/config';

async function testDataGovApi() {
  const apiKey = process.env.DATA_GOV_API_KEY;
  const resourceId = '9ef84268-d588-465a-a308-a864a43d0070';
  const baseUrl = `https://api.data.gov.in/resource/${resourceId}`;

  console.log('=== data.gov.in Mandi Price API Test ===');
  console.log(`Resource ID: ${resourceId}`);
  console.log(`API Key status: ${apiKey ? `Present (${apiKey.slice(0, 4)}...${apiKey.slice(-4)})` : 'Missing in environment'}\n`);

  const url = new URL(baseUrl);
  url.searchParams.append('api-key', apiKey || '');
  url.searchParams.append('format', 'json');
  url.searchParams.append('limit', '5');

  console.log(`Sending GET request to: ${url.origin}${url.pathname}?format=json&limit=5&api-key=***\n`);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KisanSetu-DataGov-Tester/1.0'
      }
    });

    console.log(`HTTP Status Code: ${response.status} ${response.statusText}`);
    console.log('\n--- Response Headers ---');
    const headersObj = {};
    response.headers.forEach((value, key) => {
      headersObj[key] = value;
      console.log(`${key}: ${value}`);
    });

    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error('\n--- Response Body (Non-JSON or Raw Format) ---');
      console.error(rawText);
      if (!response.ok) {
        throw new Error(`Request failed with HTTP status ${response.status}: ${rawText}`);
      }
      return;
    }

    if (!response.ok) {
      console.error('\n--- API Error Response Body ---');
      console.error(JSON.stringify(data, null, 2));
      throw new Error(`API returned error status ${response.status}: ${data.message || data.error_message || JSON.stringify(data)}`);
    }

    console.log('\n--- API Response Metadata ---');
    console.log(`Status: ${data.status || 'OK'}`);
    console.log(`Total Records in Catalog: ${data.total || data.count || 'N/A'}`);
    console.log(`Title: ${data.title || data.desc || 'Current Daily Price of Various Commodities from Various Markets (Mandi)'}`);

    const records = data.records || data.data || [];
    console.log(`Records retrieved in this batch: ${records.length}`);

    if (records.length === 0) {
      console.log('\nNo records returned. Full payload:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('\n--- First 3 Records ---');
      const first3 = records.slice(0, 3);
      first3.forEach((rec, idx) => {
        console.log(`\n[Record #${idx + 1}]`);
        console.log(JSON.stringify(rec, null, 2));
      });
    }

    console.log('\n=== Test Completed Successfully ===');
  } catch (error) {
    console.error('\n--- Detailed Error Message ---');
    console.error(`Error: ${error.message}`);
    if (error.cause) {
      console.error(`Cause: ${JSON.stringify(error.cause)}`);
    }
    if (error.stack) {
      console.error(`Stack trace:\n${error.stack}`);
    }
  }
}

testDataGovApi();
