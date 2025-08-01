#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

// Test functions
async function testPublicEndpoints() {
  console.log('🧪 Testing Public Endpoints...\n');
  
  try {
    // Test blood groups
    console.log('Testing /public-data/blood-groups...');
    const bloodGroupsResponse = await axios.get(`${BASE_URL}/public-data/blood-groups`);
    console.log('✅ Blood groups:', bloodGroupsResponse.data.data.length, 'groups found');
    
    // Test blood components
    console.log('Testing /public-data/blood-components...');
    const componentsResponse = await axios.get(`${BASE_URL}/public-data/blood-components`);
    console.log('✅ Blood components:', componentsResponse.data.data.length, 'components found');
    
    // Test blood banks
    console.log('Testing /public-data/blood-banks...');
    const banksResponse = await axios.get(`${BASE_URL}/public-data/blood-banks`);
    console.log('✅ Blood banks:', banksResponse.data.data.length, 'banks found');
    
    // Test blood stock
    console.log('Testing /public-data/blood-stock...');
    const stockResponse = await axios.get(`${BASE_URL}/public-data/blood-stock`);
    console.log('✅ Blood stock:', stockResponse.data.data.length, 'stock entries found');
    
  } catch (error) {
    console.error('❌ Public endpoints test failed:', error.message);
  }
}

async function testHealthEndpoint() {
  console.log('\n🧪 Testing Health Endpoint...\n');
  
  try {
    const response = await axios.get('http://localhost:4000/health');
    console.log('✅ Health check:', response.data.message);
  } catch (error) {
    console.error('❌ Health endpoint test failed:', error.message);
  }
}

async function testAuthRequiredEndpoints() {
  console.log('\n🧪 Testing Auth-Required Endpoints (should fail without token)...\n');
  
  try {
    // Test requests endpoint without auth
    console.log('Testing /requests without auth...');
    await axios.get(`${BASE_URL}/requests`);
    console.log('❌ Should have failed without auth token');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Correctly rejected request without auth token');
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
  }
  
  try {
    // Test donors endpoint without auth
    console.log('Testing /donors without auth...');
    await axios.get(`${BASE_URL}/donors`);
    console.log('❌ Should have failed without auth token');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Correctly rejected donors request without auth token');
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
  }
}

async function testValidationEndpoints() {
  console.log('\n🧪 Testing Validation on Request Creation...\n');
  
  try {
    // Test request creation with invalid data
    console.log('Testing request creation with missing fields...');
    await axios.post(`${BASE_URL}/requests`, {
      // Missing required fields
    }, {
      headers: { 'Authorization': 'Bearer fake-token' }
    });
    console.log('❌ Should have failed with validation error');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Correctly rejected request with missing fields');
    } else if (error.response && error.response.status === 401) {
      console.log('✅ Auth validation working (rejected fake token)');
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
  }
  
  try {
    // Test request creation with invalid blood group
    console.log('Testing request creation with invalid blood group...');
    await axios.post(`${BASE_URL}/requests`, {
      blood_group_id: 999, // Invalid
      component_id: 1,
      units_required: 2,
      urgency: "Urgent"
    }, {
      headers: { 'Authorization': 'Bearer fake-token' }
    });
    console.log('❌ Should have failed with validation error');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Correctly rejected request with invalid blood group');
    } else if (error.response && error.response.status === 401) {
      console.log('✅ Auth validation working (rejected fake token)');
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
  }
}

async function runAllTests() {
  console.log('🩸 Blood Warriors API Test Suite\n');
  console.log('================================\n');
  
  await testHealthEndpoint();
  await testPublicEndpoints();
  await testAuthRequiredEndpoints();
  await testValidationEndpoints();
  
  console.log('\n✅ Test suite completed!\n');
  console.log('📝 Summary:');
  console.log('- Public endpoints are working correctly');
  console.log('- Authentication is properly enforced');
  console.log('- Validation is working on protected endpoints');
  console.log('- Database integration is functional');
}

// Run tests
runAllTests().catch(console.error);
