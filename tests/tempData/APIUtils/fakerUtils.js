// src/utilities/fakerUtils.js
import { faker } from '@faker-js/faker';
// Import the REQUEST schema validator to check generated data
import { validateMedicationRequestSchema } from '../../resources/API/mh_data_schema/MedicationSchema.js';
import { logger } from './logger.js';

/**
 * Generates valid-looking medication data using Faker.js, attempting to conform
 * to the medicationRequestSchema, including dependencies.
 * It validates the generated data against the request schema before returning.
 *
 * @returns {object} A medication data object likely conforming to medicationRequestSchema.
 * @throws {Error} If valid data cannot be generated after multiple attempts.
 */
export function generateValidMedicationData() {
  let attempts = 0;
  const maxAttempts = 5; // Prevent infinite loops

  while (attempts < maxAttempts) {
    attempts++;
    const isControlled = faker.datatype.boolean(0.3); // 30% chance
    const hasAttachment = faker.datatype.boolean(0.6); // 60% chance
    const hasStrength = faker.datatype.boolean(0.7); // 70% chance
    const hasSummary = faker.datatype.boolean(0.8); // 80% chance
    const hasPrescriber = faker.datatype.boolean(0.9); // 90% chance (even if not controlled)

    // Base structure, allowing nulls based on schema
    const baseData = {
      medName: faker.lorem.words(faker.number.int({ min: 1, max: 4 })).substring(0, 99), // Ensure within maxLength
      medSummary: null,
      strength: null,
      attachment: null,
      controlledSubstance: isControlled,
      prescriber: null,
    };

    // --- Handle Dependencies and Optional Fields ---

    if (hasSummary) {
        baseData.medSummary = faker.lorem.sentence(faker.number.int({ min: 5, max: 20 })).substring(0, 499);
    }

    if (hasAttachment) {
      // Attachment requires summary
      baseData.medSummary = baseData.medSummary ?? faker.lorem.sentence(5).substring(0, 499); // Ensure summary exists
      baseData.attachment = faker.internet.url();
    }

    if (hasStrength) {
      baseData.strength = `${faker.number.int({ min: 1, max: 500 })}mg`.substring(0, 49); // Example format
    }

    if (hasPrescriber) {
       baseData.prescriber = {
          name: faker.person.fullName().substring(0, 99),
          licenseNumber: null // Set conditionally below
       };
    }

    // --- Handle controlledSubstance dependency ---
    if (isControlled) {
      // If controlled, prescriber object MUST exist and have a license number
      if (!baseData.prescriber) { // Ensure prescriber object exists
          baseData.prescriber = { name: faker.person.fullName().substring(0, 99) };
      }
      baseData.prescriber.licenseNumber = faker.string.alphanumeric({ length: 10, casing: 'upper' }).substring(0, 19); // Generate required license
    } else {
       // If not controlled, license number is not required (can be null or absent)
       if (baseData.prescriber) {
           // Optionally remove license number or leave it null if object exists
            if (faker.datatype.boolean(0.5)) { // 50% chance to explicitly nullify
                 baseData.prescriber.licenseNumber = null;
            } else {
                 delete baseData.prescriber.licenseNumber; // Or just omit it
            }
       }
       // Prescriber object itself can also be null if not controlled
       if (!hasPrescriber) { // If we decided earlier not to have a prescriber
           baseData.prescriber = null;
       }
    }

    // --- Final Validation Step ---
    // Use the compiled REQUEST schema validator
    const isValid = validateMedicationRequestSchema(baseData);

    if (isValid) {
      logger.debug(`Generated valid medication request data (Attempt ${attempts}):`, baseData);
      // Return a deep copy to prevent modification issues if object is reused
      return JSON.parse(JSON.stringify(baseData));
    } else {
      // Log detailed errors if generation fails validation
      logger.warn(`Generated medication data failed REQUEST schema check (Attempt ${attempts}):`, {
          data: baseData,
          errors: validateMedicationRequestSchema.errors
      });
    }
  }

  // If max attempts reached
  logger.error(`Failed to generate valid medication request data after ${maxAttempts} attempts.`);
  throw new Error(`Failed to generate data conforming to medicationRequestSchema after ${maxAttempts} attempts.`);
}