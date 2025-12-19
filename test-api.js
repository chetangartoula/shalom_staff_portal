// Test script to verify API endpoints are working
async function testAPI() {
  try {
    console.log('Testing API endpoints...\n');
    
    // Test permits endpoint
    console.log('1. Testing permits endpoint for trek ID 32:');
    const permitsRes = await fetch('http://localhost:3001/api/permits/32');
    const permitsData = await permitsRes.json();
    console.log('Permits data:', JSON.stringify(permitsData, null, 2));
    
    // Test services endpoint
    console.log('\n2. Testing services endpoint:');
    const servicesRes = await fetch('http://localhost:3001/api/services');
    const servicesData = await servicesRes.json();
    console.log('Services data:', JSON.stringify(servicesData, null, 2));
    
    // Test extra services endpoint
    console.log('\n3. Testing extra services endpoint:');
    const extraServicesRes = await fetch('http://localhost:3001/api/extra-services');
    const extraServicesData = await extraServicesRes.json();
    console.log('Extra services data:', JSON.stringify(extraServicesData, null, 2));
    
    console.log('\n✅ All API tests completed successfully!');
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testAPI();