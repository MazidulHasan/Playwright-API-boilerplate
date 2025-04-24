// tests/integration/medications.spec.js
import { test, expect } from '../../support/customFixtures/apiFixtures.js'; // Use custom fixtures
import {
  medicationRequestSchema, // Import schema object for introspection
  validateMedicationRequestSchema, // Request validator
  validateMedicationResponseSchema // Response validator
} from '../../resources/API/mh_data_schema/MedicationSchema.js';
import { generateValidMedicationData } from '../../support/APIUtils/fakerUtils.js'; // Faker data generator
import { validateResponseSchema, expectStatus } from '../../support/APIUtils/responseUtils.js'; // Response validation utility
import { ApiRequestError, ValidationError } from '../../resources/API/core/ApiError.js'; // Custom errors
import { readExcelData } from '../../support/APIUtils/excelUtils.js'; // Excel reader
import { config } from '../../support/APIUtils/settings.js'; // Config for file paths etc.
import { logger } from '../../support/commonUtility/API/logger.js'; // Logger
import { faker } from '@faker-js/faker'; // Import faker for specific validation data

// --- Determine Test Data Source ---
// Default to 'faker' if environment variable is not set or not 'excel'
const useExcelData = (process.env.TEST_DATA_SOURCE || 'faker').toLowerCase() === 'excel';
logger.info(`Using test data source: ${useExcelData ? 'Excel' : 'Faker'}`);

// --- Load Excel Data (only if using Excel) ---
let medicationExcelTestData = [];
if (useExcelData) {
  const medicationDataFilePath = config.filePaths.medicationPayloads;
  const medicationDataSheetName = 'Payloads'; // Adjust sheet name if needed
  try {
    medicationExcelTestData = readExcelData(medicationDataFilePath, medicationDataSheetName);
    if (medicationExcelTestData.length === 0) {
      logger.warn(`Excel data source selected, but no test data found in ${medicationDataFilePath}, Sheet: ${medicationDataSheetName}.`);
      // Consider failing or forcing fallback to faker if Excel is expected but empty
    } else {
      logger.info(`Successfully loaded ${medicationExcelTestData.length} rows from ${medicationDataFilePath}, Sheet: ${medicationDataSheetName}.`);
    }
  } catch (error) {
    logger.error(`FATAL: Could not load medication test data from Excel (${medicationDataFilePath}). ${error.message}`);
    // Decide if tests should stop if data loading fails
    // throw error;
  }
}

// --- Test Suite ---
test.describe(`Medication API Tests @medications @integration (Source: ${useExcelData ? 'Excel' : 'Faker'})`, () => {

  // ====================================================================
  // == DATA-DRIVEN TESTS (Run only if TEST_DATA_SOURCE=excel) ==
  // ====================================================================
  if (useExcelData && medicationExcelTestData.length > 0) {
    test.describe('Data-Driven Tests from Excel', () => {
      for (const [index, testDataRow] of medicationExcelTestData.entries()) {
        const httpMethod = (testDataRow.httpMethod || '').toUpperCase();
        const testCaseName = testDataRow.testCaseName || `Excel Row ${index + 2} (${httpMethod})`;
        const medicationId = testDataRow.medicationId || null;
        const expectedStatus = parseInt(testDataRow.expectedStatus, 10);

        // Skip row checks (same as before)
        if (!httpMethod || isNaN(expectedStatus)) { /* ... skip ... */ continue; }
        if (['GET', 'PUT', 'DELETE'].includes(httpMethod) && !medicationId) { /* ... skip ... */ continue; }

        // --- Define Test Case ---
        test(`${testCaseName} (Expect Status: ${expectedStatus})`, async ({ authenticatedMedicationClient }) => {
           const client = authenticatedMedicationClient;
           let response;
           let payload = null;
           logger.info(`[${testCaseName}] Executing ${httpMethod} request from Excel.`);

           // --- Prepare Payload (POST/PUT) ---
           if (['POST', 'PUT'].includes(httpMethod)) {
               payload = { /* ... construct payload from testDataRow ... */ };
               // logger.debug(`[${testCaseName}] Request Payload:`, JSON.stringify(payload));
               // Optional Request Validation:
               // const isRequestValid = validateMedicationRequestSchema(payload);
               // expect(isRequestValid, `Request payload invalid`).toBe(true);
           }

           // --- Execute API Call ---
           try {
               switch (httpMethod) {
                   case 'POST': response = await client.getMedicationCreateResponse(payload); break;
                   case 'GET': response = await client.getMedicationResponse(medicationId); break;
                   case 'PUT': response = await client.request.put(`${client.baseUrl}/${medicationId}`, { data: payload }); break;
                   case 'DELETE': response = await client.request.delete(`${client.baseUrl}/${medicationId}`); break;
                   default: throw new Error(`Unsupported httpMethod: ${httpMethod}`);
               }
           } catch (error) { /* ... handle execution errors ... */ }

           // --- Assert Status ---
           await expectStatus(response, expectedStatus, `[${testCaseName}]`);

           // --- Validate Response Schema (Success cases) ---
           if ([200, 201].includes(expectedStatus)) {
               if (expectedStatus !== 204) { // No body for 204
                   try {
                       const validatedData = await validateResponseSchema(response, validateMedicationResponseSchema, `[${testCaseName}]`);
                       // --- Additional Assertions ---
                       expect(validatedData.formId).toBeDefined();
                       if (httpMethod === 'GET' && testDataRow.expectedMedName !== undefined) {
                           expect(validatedData.medName).toBe(testDataRow.expectedMedName);
                       }
                       // ... other assertions ...
                   } catch (validationError) { /* ... handle validation errors ... */ }
               }
           } else { /* ... handle expected error responses ... */ }
        }); // End individual test
      } // End loop
    }); // End describe (Excel Data-Driven)
  } else if (useExcelData && medicationExcelTestData.length === 0) {
      test('Skipping Excel tests - No data loaded', () => {
          test.skip(true, 'TEST_DATA_SOURCE=excel but no data loaded.');
      });
  }


  // ====================================================================
  // == FAKER-DRIVEN CRUD TESTS (Run if TEST_DATA_SOURCE is not 'excel') ==
  // ====================================================================
  if (!useExcelData) {
    test.describe('Faker-Driven CRUD Flow', () => {
      let createdMedId = null; // Store ID created in this flow
      let createdPayload = null; // Store payload used for creation

      test('POST /medications - should create medication successfully', async ({ authenticatedMedicationClient }) => {
        const client = authenticatedMedicationClient;
        createdPayload = generateValidMedicationData(); // Generate valid data
        logger.info('[Faker POST] Attempting create with payload:', JSON.stringify(createdPayload));

        const response = await client.getMedicationCreateResponse(createdPayload);
        await expectStatus(response, 201, '[Faker POST]');
        const validatedData = await validateResponseSchema(response, validateMedicationResponseSchema, '[Faker POST]');

        expect(validatedData.formId).toBeDefined();
        expect(validatedData.medName).toBe(createdPayload.medName);
        // Store ID for subsequent tests in this block
        createdMedId = validatedData.formId;
      });

      test('GET /medications/{id} - should retrieve the created medication', async ({ authenticatedMedicationClient }) => {
        const client = authenticatedMedicationClient;
        test.skip(!createdMedId, "Cannot run GET test without ID from successful POST");

        logger.info(`[Faker GET] Attempting to retrieve medication ID: ${createdMedId}`);
        const response = await client.getMedicationResponse(createdMedId);
        await expectStatus(response, 200, '[Faker GET]');
        const validatedData = await validateResponseSchema(response, validateMedicationResponseSchema, '[Faker GET]');

        expect(validatedData.formId).toBe(createdMedId);
        expect(validatedData.medName).toBe(createdPayload.medName); // Compare against stored payload
      });

      test('PUT /medications/{id} - should update the created medication', async ({ authenticatedMedicationClient }) => {
         const client = authenticatedMedicationClient;
         test.skip(!createdMedId, "Cannot run PUT test without ID from successful POST");

         const updatePayload = {
             ...createdPayload, // Start with original data
             medSummary: faker.lorem.sentence(10).substring(0, 499), // Update summary
             strength: `${faker.number.int({min: 600, max: 900})}mcg` // Update strength
         };
         // Remove fields that shouldn't be in PUT if API requires it
         // delete updatePayload.formId; delete updatePayload.createdAt; ...

         logger.info(`[Faker PUT] Attempting update for ID: ${createdMedId} with payload:`, JSON.stringify(updatePayload));
         const response = await client.request.put(`${client.baseUrl}/${createdMedId}`, { data: updatePayload }); // Using raw request for example
         await expectStatus(response, 200, '[Faker PUT]');
         const validatedData = await validateResponseSchema(response, validateMedicationResponseSchema, '[Faker PUT]');

         expect(validatedData.formId).toBe(createdMedId);
         expect(validatedData.medSummary).toBe(updatePayload.medSummary); // Verify updated field
         expect(validatedData.strength).toBe(updatePayload.strength); // Verify updated field
         expect(validatedData.medName).toBe(createdPayload.medName); // Verify unchanged field
      });

      test('DELETE /medications/{id} - should delete the created medication', async ({ authenticatedMedicationClient }) => {
         const client = authenticatedMedicationClient;
         test.skip(!createdMedId, "Cannot run DELETE test without ID from successful POST");

         logger.info(`[Faker DELETE] Attempting delete for ID: ${createdMedId}`);
         const response = await client.request.delete(`${client.baseUrl}/${createdMedId}`); // Using raw request
         await expectStatus(response, 204, '[Faker DELETE]');

         // --- Verification Step ---
         logger.info(`[Faker DELETE] Verifying medication ${createdMedId} is deleted (expecting 404).`);
         await expect(client.getMedicationById(createdMedId))
               .rejects.toThrow(ApiRequestError); // Expect failure
         try { await client.getMedicationById(createdMedId); test.fail(); }
         catch(error){ expect(error.statusCode).toBe(404); }

         createdMedId = null; // Nullify ID after successful delete
      });

    }); // End describe (Faker-Driven CRUD)
  } // End if (!useExcelData)


  // ====================================================================
  // == SCHEMA RULE VALIDATION TESTS (Run always, use Faker base) ==
  // ====================================================================
  test.describe('Schema Rule Validation (Faker Base) @validation', () => {
    // Helper function to run validation tests
    async function runSchemaViolationTest(violationDescription, modificationFn, checkErrorDetailsFn) {
        test(`should return 400 if ${violationDescription}`, async ({ authenticatedMedicationClient }) => {
            const client = authenticatedMedicationClient;
            // 1. Generate base valid data
            const basePayload = generateValidMedicationData();

            // 2. Modify data to violate a specific rule
            const invalidPayload = modificationFn(basePayload);
            logger.info(`[Schema Test: ${violationDescription}] Testing payload:`, JSON.stringify(invalidPayload));

            // 3. Assert API call fails with 400
            await expect(client.createMedication(invalidPayload))
                  .rejects.toThrow(ApiRequestError);
            try {
                await client.createMedication(invalidPayload);
                test.fail(`API should reject payload violating: ${violationDescription}`);
            } catch (error) {
                expect(error.statusCode, `Status code should be 400 for: ${violationDescription}`).toBe(400);
                // 4. Optional: Check Ajv errors if needed (requires manual validation or specific API error format)
                if (checkErrorDetailsFn) {
                    const isValid = validateMedicationRequestSchema(invalidPayload); // Manual check
                    expect(isValid).toBe(false);
                    checkErrorDetailsFn(validateMedicationRequestSchema.errors);
                }
            }
        });
    }

    // --- Define specific schema violation tests ---

    // Type Violations
    runSchemaViolationTest("medName is not a string",
        (p) => ({ ...p, medName: 12345 }),
        (errors) => expect(errors).toEqual(expect.arrayContaining([expect.objectContaining({ instancePath: '/medName', keyword: 'type' })]))
    );
    runSchemaViolationTest("controlledSubstance is not boolean",
        (p) => ({ ...p, controlledSubstance: "yes" })
        // Ajv might coerce 'yes' depending on config, test might need refinement
    );
     runSchemaViolationTest("prescriber is not object or null",
        (p) => ({ ...p, prescriber: "Dr. Who" })
    );

    // Format Violations
    runSchemaViolationTest("attachment is not a valid URI",
        (p) => ({ ...p, attachment: "not a url", medSummary:"Summary required for attachment" }), // Ensure dependency met
        (errors) => expect(errors).toEqual(expect.arrayContaining([expect.objectContaining({ instancePath: '/attachment', keyword: 'format' })]))
    );

    // Required Field Violations
    runSchemaViolationTest("required field 'medName' is missing",
        (p) => { delete p.medName; return p; }, // Remove medName
        (errors) => expect(errors).toEqual(expect.arrayContaining([expect.objectContaining({ keyword: 'required', params: expect.objectContaining({ missingProperty: 'medName' }) })]))
    );
    runSchemaViolationTest("required field 'controlledSubstance' is missing",
        (p) => { delete p.controlledSubstance; return p; }
    );

    // Dependency Violations
    runSchemaViolationTest("attachment present but medSummary is null/missing",
        (p) => ({ ...p, attachment: faker.internet.url(), medSummary: null }), // Set attachment, nullify summary
        (errors) => expect(errors).toEqual(expect.arrayContaining([expect.objectContaining({ keyword: 'required', instancePath: '' })])) // Dependency check might show top-level required error
    );
    runSchemaViolationTest("controlledSubstance=true but prescriber object missing",
        (p) => ({ ...p, controlledSubstance: true, prescriber: null }), // Set controlled, nullify prescriber
        (errors) => expect(errors).toEqual(expect.arrayContaining([expect.objectContaining({ keyword: 'required', params: expect.objectContaining({ missingProperty: 'prescriber' }) })]))
    );
    runSchemaViolationTest("controlledSubstance=true but prescriber.licenseNumber missing",
        (p) => ({ ...p, controlledSubstance: true, prescriber: { name: faker.person.fullName(), licenseNumber: null } }), // Controlled, prescriber exists, license null
        (errors) => expect(errors).toEqual(expect.arrayContaining([expect.objectContaining({ keyword: 'required', instancePath: '/prescriber' })])) // Required within prescriber
    );

     // Additional Properties Violation
     runSchemaViolationTest("extra unexpected field provided",
        (p) => ({ ...p, unexpectedField: "should not be here" }),
        (errors) => expect(errors).toEqual(expect.arrayContaining([expect.objectContaining({ keyword: 'additionalProperties' })]))
    );


  }); // End describe (Schema Rule Validation)


  // ====================================================================
  // == MAXLENGTH VALIDATION TESTS (Run always, use Faker base) ==
  // ====================================================================
  test.describe('MaxLength Validation (Faker Base) @validation', () => {
      // Helper to run MaxLength tests
      async function runMaxLengthTest(fieldPath, maxLength) {
         test(`should return 400 if '${fieldPath}' exceeds maxLength (${maxLength})`, async ({ authenticatedMedicationClient }) => {
            const client = authenticatedMedicationClient;
            const basePayload = generateValidMedicationData();
            const invalidPayload = JSON.parse(JSON.stringify(basePayload)); // Deep copy

            // Generate string exceeding max length
            const longString = faker.string.alpha(maxLength + 1);

            // Set the long string on the target field (handle nesting)
            if (fieldPath.includes('.')) {
                const [parent, child] = fieldPath.split('.');
                 // Ensure parent exists and is object
                 if (!invalidPayload[parent] || typeof invalidPayload[parent] !== 'object') {
                     // Need valid parent structure based on schema if creating from scratch
                     // For simplicity, assume basePayload generated a valid structure if parent exists
                     if (!invalidPayload[parent]) {
                          logger.warn(`Cannot test nested maxLength for ${fieldPath} as parent object doesn't exist in base payload.`);
                          test.skip(true, `Base payload structure issue for ${fieldPath}`);
                          return;
                     }
                 }
                invalidPayload[parent][child] = longString;
            } else {
                invalidPayload[fieldPath] = longString;
            }

            logger.info(`[MaxLength Test: ${fieldPath}] Testing payload:`, JSON.stringify(invalidPayload));

            // Assert API call fails with 400
            await expect(client.createMedication(invalidPayload))
                  .rejects.toThrow(ApiRequestError);
            try {
                await client.createMedication(invalidPayload);
                test.fail(`API should reject payload where '${fieldPath}' exceeds maxLength`);
            } catch (error) {
                expect(error.statusCode).toBe(400);
                 // Optional: Check Ajv errors
                 const isValid = validateMedicationRequestSchema(invalidPayload);
                 expect(isValid).toBe(false);
                 expect(validateMedicationRequestSchema.errors).toEqual(expect.arrayContaining([
                     expect.objectContaining({ instancePath: `/${fieldPath.replace('.', '/')}`, keyword: 'maxLength' })
                 ]));
            }
         });
      }

      // --- Define MaxLength tests based on schema ---
      // Find fields with maxLength in medicationRequestSchema.properties
      const fieldsWithMaxLength = {};
      function findMaxLength(obj, pathPrefix = '') {
          for (const key in obj) {
              const currentPath = pathPrefix ? `${pathPrefix}.${key}` : key;
              if (typeof obj[key] === 'object' && obj[key] !== null) {
                  if (obj[key].maxLength && typeof obj[key].maxLength === 'number') {
                      fieldsWithMaxLength[currentPath] = obj[key].maxLength;
                  }
                  // Recurse for nested properties like 'prescriber'
                  if (obj[key].properties) {
                      findMaxLength(obj[key].properties, currentPath);
                  }
              }
          }
      }
      findMaxLength(medicationRequestSchema.properties); // Start recursion

      logger.info("Fields with MaxLength found in schema:", fieldsWithMaxLength);

      // Generate tests for each field found
      for (const fieldPath in fieldsWithMaxLength) {
          runMaxLengthTest(fieldPath, fieldsWithMaxLength[fieldPath]);
      }

  }); // End describe (MaxLength Validation)

}); // End main describe block