---
title:  Recursive ADLS Access Control
permalink: /2020/07/29/recursive-adls-access-control
image:  /assets/posts/2020/3/recursive-adls-access-control/door.jpg
categories:
- Solution
tags:
- Data
- Identity
- Security
date: 2020-07-19
---
<img style="float:right;padding-left:20px;" title="From pexels.com" src="/assets/posts/2020/3/recursive-adls-access-control/door.jpg" />

[Last time](/2020/07/22/azure-data-lake-storage-logic-app-with-managed-identities) we showed how to use Logic App to invoke ADLS REST APIs (list blobs specifically) using AAD identities (in this case, Azure's Managed Service Identities, MSI).

In the past, [we discussed access control in Azure Data Lake Storage (ADLS)](/2020/07/16/access-control-in-azure-data-lake-storage).  Those intricacies are useful when accessing ADLS using Azure AD authentication.

This time I wanted to combine both concepts together by showing how to get & set access control lists using Logic App.  By combining a list-blob, we are able to set Access Control Lists (ACLs) recursively.  Because this is in a Logic App using an MSI, it can be invoked in automation or CI/CD.

Also, the native storage APIs from ADLS offer a somewhat crud interface, dealing with a single semi-colon & comma delimited string to represent an ACL.  Our API offers a richer JSON signature which makes it easier to do changes.

The underlying storage API isn't widely advertised and I would like to give a shout out to [Moim Hossain](https://moimhossain.com/) for [his article on ACL management](https://moimhossain.com/2019/09/20/access-control-management-via-rest-api-azure-data-lake-gen-2/).  That pointed me in the right direction.

As usual, [code is in GitHub](https://github.com/vplauzon/storage/tree/master/adls-acl-api).

## ADLS API

Basically, we are wrapping two APIS from ADLS:

* Our `get ACL API` is based on ADLS [get properties / HEAD](https://docs.microsoft.com/en-us/rest/api/storageservices/datalakestoragegen2/path/getproperties)
* Our `patch ACL API` is based on ADLS [set properties / PATCH](https://docs.microsoft.com/en-us/rest/api/storageservices/datalakestoragegen2/path/update)

The `patch ACL API` also reuse the `list blobs` we developped [in a past article](/2020/07/22/azure-data-lake-storage-logic-app-with-managed-identities).

## Deploying the Logic Apps

To deploy the solution, we can start here:

[![Deploy button](http://azuredeploy.net/deploybutton.png)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fstorage%2Fmaster%2Fadls-acl-api%2Fdeploy-acl.json)

The [ARM Template](https://github.com/vplauzon/storage/blob/master/adls-acl-api/deploy-acl.json) doesn't have parameters.

The deployment should result in 4 resources:

![resources](/assets/posts/2020/3/recursive-adls-access-control/resources.png)

This is one Managed Identity used by 3 Logic Apps.  Sharing the same identity with the three apps allows us to set permission for that identity only once.

The three APIs are:

Logic App Name|Description
-|-
list-blobs-api-\*|List blobs recursively from a given folder ; this is the exact same one [we developped in a past article](/2020/07/22/azure-data-lake-storage-logic-app-with-managed-identities)
get-acl-api-\*|Returns the ACLs for a given blob or folder
patch-acl-api-\*|Assign Access Control Entry (ACE) to a blob or folder (or recursively from a folder) ; also allows to flush the ACLs from a folder hierarchy

## Setting permissions

Why do we need to set the permissions for an API used to set permissions?  Because a principal (either a user or a service principal) must be [Storage Blob Data Owner](https://docs.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#storage-blob-data-owner) to be able to alter the ACLs of an object (blob or folder).

The managed identity we just deployed, *data-lake-identity-\**, is the principal that will authenticate to the storage API.

So the first thing to do is to link two things:

1. The storage account we want to test the API on (or a least the storage container)
1. The managed identity we just deployed, *data-lake-identity-\**

We do this by going to the *Access Control (IAM)* section of the Storage Account:

![iam](/assets/posts/2020/3/recursive-adls-access-control/iam.png)

From there we need to create a role assignment:

![role assignment](/assets/posts/2020/3/recursive-adls-access-control/role-assignment.png)



## Using get-acl

## Using patch-acl

One of the annoyance of Access Control Lists (ACLs) in ADLS [we discussed](/2020/07/16/access-control-in-azure-data-lake-storage) is the lack of inheritance of ACLs.  Intuitively, we tend to assume that ACLs set at a root folder would be applied to blobs and folders underneath, but they don't.

The API we're going to show here allows us to do that:  push ACLs recursively down.  This is quite useful when dealing with ADLS.



## Flusing ACLs

## How does it work?

```javascript
{
    "storageAccount":"vpldemo",
    "container":"lake",
    "path":"",
    "isRecursive":true,
    "upn":true,
    "isDefault2":true,
    "ace":{
        "type":"user",
        "id":"vilauzon@microsoft.com",
        "blobPermissions":"r--",
        "directoryPermissions":"r-x"
    }
}
```