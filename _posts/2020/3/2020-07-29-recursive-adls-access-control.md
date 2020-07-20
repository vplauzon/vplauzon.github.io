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

The `patch ACL API` also reuse the `list blobs` we developed [in a past article](/2020/07/22/azure-data-lake-storage-logic-app-with-managed-identities).

One of the annoyance of Access Control Lists (ACLs) in ADLS [we discussed](/2020/07/16/access-control-in-azure-data-lake-storage) is the lack of inheritance of ACLs.  Intuitively, we tend to assume that ACLs set at a root folder would be applied to blobs and folders underneath, but they don't.

The API we're going to show here allows us to do that:  push ACLs recursively down.  This is quite useful when dealing with ADLS.

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
list-blobs-api-\*|List blobs recursively from a given folder ; this is the exact same one [we developed in a past article](/2020/07/22/azure-data-lake-storage-logic-app-with-managed-identities)
get-acl-api-\*|Returns the ACLs for a given blob or folder
patch-acl-api-\*|Assign Access Control Entry (ACE) to a blob or folder (or recursively from a folder) ; also allows to flush the ACLs from a folder hierarchy

## Setting permissions

Why do we need to set the permissions for an API used to set permissions?  Because a principal (either a user or a service principal) must be [Storage Blob Data Owner](https://docs.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#storage-blob-data-owner) to be able to alter the ACLs of an object (blob or folder).

The managed identity we just deployed, *data-lake-identity-\**, is the principal that will authenticate to the storage API.

So, the first thing to do is to link two things:

1. The storage account we want to test the API on (or a least the storage container)
1. The managed identity we just deployed, *data-lake-identity-\**

We do this by going to the *Access Control (IAM)* section of the Storage Account:

![iam](/assets/posts/2020/3/recursive-adls-access-control/iam.png)

From there we need to create a role assignment:

![role assignment](/assets/posts/2020/3/recursive-adls-access-control/role-assignment.png)

## Using get-acl

The assignment takes several minutes (usually between 5 and 10) to be effective.  We therefore need to wait a little bit before doing the first test.

First, we'll look at the get-acl Logic App and copy its http-trigger URL.  We find this by opening the logic app designer and opening the *trigger box*:

![get acl url](/assets/posts/2020/3/recursive-adls-access-control/get-acl-url.png)

We can then use that URL in any tool allowing us to do HTTPS-POST requests.  We are going to use [Postman](https://www.postman.com/).

For the request to be successful, we need to set the HTTP header `Content-Type` to `application/json`:

![Content Type](/assets/posts/2020/3/recursive-adls-access-control/content-type.png)

This tells Logic App to interpret the body as a JSON payload.  Logic App doesn't do this by default.

We then need to set the body.  Here is a body sample:

```javascript
{
    "storageAccount" : "vpldemo",
    "container" : "lake",
    "path" : "",
    "upn" : true
}
```

Here are the parameters for the payload:

Parameter|Type|Mandatory|Description
-|-|-|-
storageAccount|string|Yes|Name of the storage account
container|string|Yes|Name of the container within the storage account
path|string|Yes (can be empty)|Object (blob or folder) path (an empty string means the root of the container)
upn|boolean|No|Should the API return *User Principal Name* (UPN) ; default is no, in which case the API returns object IDs (GUIDs)

The first three parameters allow us to zero in on a specific object (blob or folder).  When we send the request, we receive something like:

```javascript
{
    "group": "$superuser",
    "owner": "$superuser",
    "permissions": "rwxrwx---+",
    "acl": {
        "raw": "user::rwx,user:bob@contoso.com:rwx,group::r-x,mask::rwx,other::---,default:user::rwx,default:group::r-x,default:mask::r-x,default:other::---",
        "structured": {
            "access": [
                {
                    "permissions": "rwx",
                    "id": "",
                    "type": "user"
                },
                {
                    "permissions": "rwx",
                    "id": "bob@contoso.com",
                    "type": "user"
                },
                {
                    "permissions": "r-x",
                    "id": "",
                    "type": "group"
                },
                {
                    "permissions": "rwx",
                    "id": "",
                    "type": "mask"
                },
                {
                    "permissions": "---",
                    "id": "",
                    "type": "other"
                }
            ],
            "default": [
                {
                    "permissions": "rwx",
                    "id": "",
                    "type": "user"
                },
                {
                    "permissions": "r-x",
                    "id": "",
                    "type": "group"
                },
                {
                    "permissions": "r-x",
                    "id": "",
                    "type": "mask"
                },
                {
                    "permissions": "---",
                    "id": "",
                    "type": "other"
                }
            ]
        }
    }
}
```

This is essentially what we see in [Azure Storage Explorer](https://azure.microsoft.com/en-us/features/storage-explorer/):

![Get ACL](/assets/posts/2020/3/recursive-adls-access-control/get-acl.png)

It is quite close to what the storage API returns.  We simply expend the *raw string* to make it easier to manipulate down the line.

## Using patch-acl

Using the `patch-acl` Logic App requires the same routine, i.e. capturing its URL and setting the *Content-Type* of the request.

Here is a sample of the payload we can send to the API:

```javascript
{
    "storageAccount":"vpldemo",
    "container":"lake",
    "path":"",
    "isRecursive":true,
    "upn":true,
    "isDefault":true,
    "ace":{
        "type":"user",
        "id":"jane@contoso.com",
        "blobPermissions":"r--",
        "directoryPermissions":"r-x"
    }
}
```

Here are the parameters for the payload:

Parameter|Type|Mandatory|Description
-|-|-|-
storageAccount|string|Yes|Name of the storage account
container|string|Yes|Name of the container within the storage account
path|string|Yes (can be empty)|Object (blob or folder) path (an empty string means the root of the container)
suffix|string|No|Suffix of the blob to impact (default is *none*)
isRecursive|boolean|No|Going recursively through the directory structure ; meaningful only if `path` points to a directory (not a blob) ; default is `false`
upn|boolean|No|Should the API return *User Principal Name* (UPN) ; default is no, in which case the API **deals with** object IDs (GUIDs)
isDefault|boolean|No|The ACE's scope is `default` or not (default of *isDefault* is `false`)
ace|object|No|Access Control Entry to add to the ACLs of the objects (blobs and / or folders)

[There are two kinds of access control entry](https://docs.microsoft.com/en-us/azure/storage/blobs/data-lake-storage-access-control#types-of-access-control-lists):  *default* & *access*.

The *default* corresponds to the default part of the [Azure Storage Explorer](https://azure.microsoft.com/en-us/features/storage-explorer/) UI:

![Default](/assets/posts/2020/3/recursive-adls-access-control/default.png)

The ace object has the following parameters:

Parameter|Type|Mandatory|Description
-|-|-|-
type|string|Yes|One of the four types of ACE:  *user*, *group*, *mask* or *other* (see `x-ms-acl` header [documentation online](https://docs.microsoft.com/en-us/rest/api/storageservices/datalakestoragegen2/path/update#request-headers) for details)
id|string|Yes|Id of the *user* or *group*.  Empty for *mask* or *other*.
blobPermissions|string|No|String of three characters:  `r` (read), `w` (write) & `x` (traverse, meaningful only for directories) ; `-` means none ; for instance, `r-x` means read / can't write / can traverse
directoryPermissions|string|No|Same for directories

We can omit *blobPermissions* or *directoryPermissions* (we can also omit both in which case the API call doesn't do anything).  *blobPermissions* is used on blobs while *directoryPermissions* is used on directories.  This is useful to implement the typical pattern of given read-access to directories but write-access to blobs (as done in the sample above).

### Asynchronous call

The `patch-acl` API can potentially call quite a few storage API.

For instance, if we go recursive on a huge hierarchy, there is going to be:

* A call to the `list-blob` API (Logic App)
* For each blob and directory, a call to `get-acl` then a call to `patch-acl`

The duration of the API call is therefore unbound.  For that reason, we made the API asynchronous, following the [Logic App asynchronous request-reply pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/async-request-reply).

### Flushing ACLs

A typical scenario we might want to do is to flush all the user & group permissions on a hierarchy to start afresh.

This is when we would omit the *ace* object altogether.  This is interpreted as a flush call.

## How does it work?

This is already quite a long article so we will not go into the details of the Logic App implementation.  We are happy to answer questions in the comment section.

## Summary

We develop those two APIs (`get-acl` & `patch-acl`) to facilitate automation around ACLs in Azure Data Lake Storage (ADLS).

A specific value `patch-acl` adds is the ability to perform ACE-adds on an entire hierarchy which is often useful in real-life projects.