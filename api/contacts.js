'use strict';
const uuid = require('uuid');
const AWS = require('aws-sdk');

AWS.config.setPromisesDependency(require('bluebird'));

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.import = async (event) => {
    const importBody = JSON.parse(event.body);
    const contacts = importBody.contacts;
    const userId = importBody.user_id;
    const result =  []
    for (const contact of contacts) {
        var contactInfoObj = contactInfo(contact.contactId, userId,contact.profilePhotoPath,contact.fullName,contact.contactWalletId,contact.status,contact.phone,contact.email,contact.addresses)
        var validationErrors = validateContact(contactInfoObj);
        if(validationErrors)
        {
            result.push(validationErrors)
        }
        else
        {
            result.push(await persistContact(contactInfoObj));
        }
    }
    return {
        statusCode: 200,
        body: JSON.stringify(result),
    };
};

async function persistContact(contact) {
    console.log('Saving contact');
    const contactInfo = {
        TableName: process.env.CONTACT_TABLE,
        Item: contact,
    };
    try
    {
        await dynamoDb.put(contactInfo).promise();
        return 'contact Imported successfully with Id:'+ contact.contactId;
    }
    catch(err)
    {
        console.error(err.message);
        return err.message;
    }
};

function contactInfo(contactId, userId, profilePhotoPath, fullName, contactWalletId, status, phoneNumbers, emailAddresses,address) {
    const timestamp = new Date().getTime();
    if(!contactId)
    {
        contactId= uuid.v1();
    }
    return {
      contactId:contactId,
        userId: userId,
        profilePhotoPath: profilePhotoPath,
        fullName: fullName,
        contactWalletId: contactWalletId,
        status: status,
        phoneNumbers: phoneNumbers,
        emails: emailAddresses,
        addresses: address,
        createdAt: timestamp
    };
}

function validateContact(contact){
    var errors=[];
    if(isEmpty(contact.fullName))
    {
        errors.push("fullName is missing.")
    }
    if(isEmpty(contact.userId))
    {
        errors.push("UserId is missing.")
    }
    if(isEmpty(contact.status))
    {
        errors.push("status is missing.")
    }
    if(typeof contact.emails==="undefined" || contact.emails.length<1)
    {
        errors.push("Email(s) is missing.")
    }
    if(typeof contact.phoneNumbers==="undefined" || contact.phoneNumbers.length<1)
    {
        errors.push("Phone Number is missing.")
    }

    if(typeof contact.addresses==="undefined" || contact.addresses.length<1)
    {
        errors.push("Address(es) is missing.")
    }
}
function isEmpty(value){
    return (value == null || value.length === 0);
}

