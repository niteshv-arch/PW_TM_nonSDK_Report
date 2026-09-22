const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// ==========================================
// 1. CONFIGURATION PARAMETERS
// ==========================================
const CONFIG = {
  username: process.env.BROWSERSTACK_USERNAME ,
  accessKey: process.env.BROWSERSTACK_ACCESS_KEY ,

  projectName: 'Demo_Adi',
  targetTestPlanId: 'TP-21', // Target Test Plan
  qualityGateProfile: process.env.QUALITY_GATE_PROFILE || null, // null = use overall result
  reportFilePath: path.resolve(process.cwd(), 'test-results', 'results-upload.zip'),

  buildName: `TRA_API_Upload_${getFormattedTimestamp()}`,
  buildIdentifier: `ID_${getFormattedTimestamp()}`,
  tags: 'junit_upload, regression',
  frameworkVersion: 'Playwright, 1.61.1',

  // Polling Settings
  initialDelayMs: 5000, 
  pollIntervalMs: 5000, 
  maxPollAttempts: 60,  
  maxTcmRetries: 10,
};

const authHeader = `Basic ${Buffer.from(
  `${CONFIG.username}:${CONFIG.accessKey}`
).toString('base64')}`;

function getFormattedTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(
    now.getHours()
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function formatDuration(startMs) {
  return `${((Date.now() - startMs) / 1000).toFixed(2)}s`;
}

// ==========================================
// STEP 1: UPLOAD JUNIT REPORT WITH TITLE MAPPING
// ==========================================
async function uploadJUnitReport() {
  const startTime = Date.now();
  console.log('--------------------------------------------------------------------------------');
  console.log('🚀 [Task 1/3] Uploading JUnit test results to BrowserStack...');
  console.log('--------------------------------------------------------------------------------');

  if (!fs.existsSync(CONFIG.reportFilePath)) {
    throw new Error(`File not found at path: ${CONFIG.reportFilePath}`);
  }

  const formData = new FormData();
  formData.append('data', fs.createReadStream(CONFIG.reportFilePath));
  formData.append('projectName', CONFIG.projectName);
  formData.append('buildName', CONFIG.buildName);
  formData.append('buildIdentifier', CONFIG.buildIdentifier);
  formData.append('tags', CONFIG.tags);
  formData.append('frameworkVersion', CONFIG.frameworkVersion);

  const response = await axios.post(
    'https://upload-automation.browserstack.com/upload',
    formData,
    {
      headers: {
        Authorization: authHeader,
        ...formData.getHeaders(),
      },
    }
  );

  console.log('\n📥 [API Response 1 - Upload JUnit Report]:');
  console.log(JSON.stringify(response.data, null, 2));

  const redirectUrl = response.data?.message;
  if (!redirectUrl) {
    throw new Error('Upload failed: Invalid response payload.');
  }

  const buildUdid = redirectUrl.split('/').pop();
  console.log(`\n✅ Upload completed. Extracted Build UDID: ${buildUdid}`);
  console.log(`⏱️ Task 1 Time Taken: ${formatDuration(startTime)}\n`);

  return buildUdid;
}

// ==========================================
// STEP 2: POLL BUILD STATUS & TCM IDENTIFIER
// ==========================================
async function pollBuildStatus(buildUdid) {
  const startTime = Date.now();
  console.log('--------------------------------------------------------------------------------');
  console.log('🔄 [Task 2/3] Polling build processing status...');
  console.log('--------------------------------------------------------------------------------');
  console.log(`⏳ Waiting ${CONFIG.initialDelayMs / 1000}s before first status check...`);
  await sleep(CONFIG.initialDelayMs);

  const statusUrl = `https://api-automation.browserstack.com/ext/v1/builds/${buildUdid}`;
  const activeStatuses = ['pending', 'running', 'in_progress', 'processing'];
  let finalResponseData = null;

  for (let attempt = 1; attempt <= CONFIG.maxPollAttempts; attempt++) {
    try {
      const response = await axios.get(statusUrl, {
        headers: { Authorization: authHeader },
      });

      finalResponseData = response.data;
      const currentStatus = String(finalResponseData.status || '').toLowerCase();

      console.log(
        `   [Attempt ${attempt}/${CONFIG.maxPollAttempts}] Current status: "${finalResponseData.status}"`
      );

      if (!activeStatuses.includes(currentStatus)) {
        console.log(`\n✅ Build finished processing with terminal status: "${finalResponseData.status}"`);

        let tcmRunId = getTcmIdentifier(finalResponseData);

        if (!tcmRunId) {
          console.log('⏳ Waiting for Test Management identifier to attach...');
          const tcmResult = await pollForTcmIdentifier(statusUrl);
          tcmRunId = tcmResult.tcmRunId;
          finalResponseData = tcmResult.latestData;
        }

        console.log('\n📥 [API Response 2 - Completed Build Status]:');
        console.log(JSON.stringify(finalResponseData, null, 2));

        // Extract actual Project ID dynamically (e.g., PR-200)
        const projectId = finalResponseData.project_id || 'PR-216';

        console.log(`\n🎯 Found TCM Test Run Identifier: ${tcmRunId} (Project: ${projectId})`);
        console.log(`⏱️ Task 2 Time Taken: ${formatDuration(startTime)}\n`);
        return { tcmRunId, projectId };
      }
    } catch (err) {
      if (err.response?.status === 404) {
        console.log(`   [Attempt ${attempt}/${CONFIG.maxPollAttempts}] Build ID not indexed yet (404)...`);
      } else {
        console.log(`   [Attempt ${attempt}/${CONFIG.maxPollAttempts}] Transient error: ${err.message}`);
      }
    }

    await sleep(CONFIG.pollIntervalMs);
  }

  throw new Error('⏱️ Timeout waiting for report processing to complete.');
}

function getTcmIdentifier(data) {
  return (
    data.tcmTestRunIdentifier ||
    data.tcm_test_run_identifier ||
    data.run_information?.[0]?.meta?.tcmTestRunIdentifier ||
    null
  );
}

async function pollForTcmIdentifier(statusUrl) {
  for (let retry = 1; retry <= CONFIG.maxTcmRetries; retry++) {
    await sleep(CONFIG.pollIntervalMs);
    const response = await axios.get(statusUrl, {
      headers: { Authorization: authHeader },
    });

    const tcmRunId = getTcmIdentifier(response.data);
    if (tcmRunId) return { tcmRunId, latestData: response.data };

    console.log(`   [TCM Retry ${retry}/${CONFIG.maxTcmRetries}] Waiting for tcmTestRunIdentifier...`);
  }

  throw new Error('Build finished, but BrowserStack did not attach "tcmTestRunIdentifier" in time.');
}



// ==========================================
// STEP 3: LINK TEST RUN TO TEST PLAN
// ==========================================
async function linkTestRunToTestPlan(tcmRunId, projectId) {
  const startTime = Date.now();
  console.log('--------------------------------------------------------------------------------');
  console.log(`🔗 [Task 3/4] Linking Test Run ${tcmRunId} to Test Plan ${CONFIG.targetTestPlanId}...`);
  console.log('--------------------------------------------------------------------------------');

  const linkUrl = `https://test-management.browserstack.com/api/v2/projects/${projectId}/test-runs/${tcmRunId}/update`;

  console.log(`   URL: ${linkUrl}`);
  const response = await axios.patch(
    linkUrl,
    { test_run: { test_plan_id: CONFIG.targetTestPlanId } },
    {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    }
  );

  console.log('\n📥 [API Response 3 - Link to Test Plan]:');
  console.log(JSON.stringify(response.data, null, 2));

  console.log(`\n✅ Test run linked to Test Plan ${CONFIG.targetTestPlanId}!`);
  console.log(`⏱️ Task 3 Time Taken: ${formatDuration(startTime)}\n`);
  return response.data;
}

// ==========================================
// STEP 4: CHECK QUALITY GATE
// ==========================================
async function checkQualityGate(buildUdid) {
  const startTime = Date.now();
  console.log('--------------------------------------------------------------------------------');
  console.log(`🔍 [Task 4/5] Checking Quality Gate for build ${buildUdid}...`);
  console.log('--------------------------------------------------------------------------------');

  const qgUrl = `https://api-automation.browserstack.com/ext/v1/quality-gates/${buildUdid}`;

  // Poll until quality gate analysis is complete
  let result;
  const maxQgAttempts = 20;
  for (let attempt = 1; attempt <= maxQgAttempts; attempt++) {
    const response = await axios.get(qgUrl, {
      headers: { Authorization: authHeader },
    });
    result = response.data;
    if (result.status !== 'running') break;
    console.log(`   [QG Attempt ${attempt}/${maxQgAttempts}] Quality gate still processing...`);
    await sleep(CONFIG.pollIntervalMs);
  }

  console.log('\n📥 [API Response - Quality Gate]:');
  console.log(JSON.stringify(result, null, 2));

  let passed;
  if (CONFIG.qualityGateProfile) {
    // Filter by specific profile name
    const profile = (result.quality_profiles || []).find(
      p => p.name === CONFIG.qualityGateProfile
    );
    if (!profile) {
      console.log(`\n⚠️  Quality Gate profile "${CONFIG.qualityGateProfile}" not found. Skipping close.`);
      passed = false;
    } else {
      passed = profile.result === 'passed';
      console.log(`\n${passed ? '✅' : '⚠️'} Quality Gate Profile "${profile.name}": ${profile.result}`);
    }
  } else {
    // Use overall result
    passed = result.quality_gate_result === 'passed';
    console.log(`\n${passed ? '✅' : '⚠️'} Overall Quality Gate Result: ${result.quality_gate_result}`);
  }

  console.log(`⏱️ Task 4 Time Taken: ${formatDuration(startTime)}\n`);
  return passed;
}

// ==========================================
// STEP 5: CLOSE TEST RUN IN TEST MANAGEMENT
// ==========================================
async function closeTestRun(tcmRunId, projectId) {
  const startTime = Date.now();
  console.log('--------------------------------------------------------------------------------');
  console.log(`🔒 [Task 3/3] Closing Test Run ${tcmRunId} in project ${projectId}...`);
  console.log('--------------------------------------------------------------------------------');

  const closeUrl = `https://test-management.browserstack.com/api/v2/projects/${projectId}/test-runs/${tcmRunId}/close`;

  const response = await axios.post(
    closeUrl,
    {},
    {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    }
  );

  console.log('\n📥 [API Response 4 - Close Test Run]:');
  console.log(JSON.stringify(response.data, null, 2));

  console.log(`\n🎉 Test run successfully closed!`);
  console.log(`⏱️ Task 4 Time Taken: ${formatDuration(startTime)}\n`);
  return response.data;
}

// ==========================================
// MAIN EXECUTION FLOW
// ==========================================
async function run() {
  const overallStartTime = Date.now();
  try {
    const buildUdid = await uploadJUnitReport();
    const { tcmRunId, projectId } = await pollBuildStatus(buildUdid);
    await linkTestRunToTestPlan(tcmRunId, projectId);
    const qualityGatePassed = await checkQualityGate(buildUdid);
    if (qualityGatePassed) {
      await closeTestRun(tcmRunId, projectId);
    } else {
      console.log('⚠️  Quality Gate FAILED — Test Run will NOT be closed.');
    }

    console.log('================================================================================');
    console.log(`🏆 PIPELINE EXECUTION COMPLETED SUCCESSFULLY IN ${formatDuration(overallStartTime)}`);
    console.log('================================================================================');
  } catch (error) {
    console.error(
      '\n❌ Execution failed:',
      error.response ? JSON.stringify(error.response.data, null, 2) : error.message
    );
    process.exit(1);
  }
}

run();