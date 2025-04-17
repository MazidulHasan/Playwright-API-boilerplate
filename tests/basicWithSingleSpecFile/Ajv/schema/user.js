const ajvInstance = require('./ajv-instance');

const userSchema = {
    type: 'object',
    properties: {
        firstName: { type: 'string' },
        email: { type: 'string', format: 'email' },
        dob:{ type: 'string', format: 'date' },
        countryCode:{
            type: 'string',
            enum:['US','CA']
        }
    },
    required: ['firstName', 'email', 'dob', 'countryCode'],
    additionalProperties: false
};

module.exports = ajvInstance.compile(userSchema);