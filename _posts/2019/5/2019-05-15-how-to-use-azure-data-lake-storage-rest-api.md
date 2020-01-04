---
title: How to use Azure Data Lake Storage REST API
date: 2019-05-15 06:30:31 -04:00
permalink: /2019/05/15/how-to-use-azure-data-lake-storage-rest-api/
categories:
- Solution
tags:
- API
- Data
---
<a href="https://www.pexels.com/photo/photo-of-boat-under-cloudy-sky-2123573/"><img style="float:left;padding-right:5px;" title="From pexels.com" src="/assets/2019/5/how-to-use-azure-data-lake-storage-rest-api/boat-canoe-clouds-2123573.jpg" /></a>

<a href="https://docs.microsoft.com/en-ca/azure/storage/blobs/data-lake-storage-introduction">Azure Data Lake Storage (ADLS) Generation 2</a> has been around for a few months now.

That new generation of Azure Data Lake Storage integrates with Azure Storage.  This makes it a service available in every Azure region.  It also makes it easier to access as it is built on foundation well known to Azure users.

Unfortunately, there are no SDK yet (at the time of this writing, mid-May 2019).  To add insult to injury, in its current form, the Blob API isn't compatible with ADLS API.  For instance, we can't simply create a container using the Blob API and expect to see a <em>file system</em> within the account.  This would actually fail.

Until this gets easier and / or APIs get compatible, we need to use the REST API in order to automate / programmatically access an account.

Azure Storage Explorer and AzCopy are also ADLS gen 2 aware.

In this article, we'll show how to use the ADLS gen 2 REST API.  We will use a Logic Apps with Managed System Identity (MSI) for simplicity.  We are going to explore the fine-grained access control using Azure AD RBAC as well.

The same could be done using other compute (e.g. Function, AKS, VMs).  We definitely recommend using MSI (or <a href="https://vincentlauzon.com/2019/02/19/azure-ad-pod-identity-in-aks/">Pod Identity</a> for AKS).  MSI allows the acquisition of bearer token without the need to store Service Principal secrets anywhere.  Of course, the same could be done with a Service Principal.

As usual, <a href="https://github.com/vplauzon/storage/tree/master/adls-api">code is in GitHub</a>.

<h2>Deploying demo</h2>

Let's deploy our demo:

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fstorage%2Fmaster%2Fadls-api%2Fdeploy.json"><img src="http://azuredeploy.net/deploybutton.png" alt="Deploy button" /></a>

There is one parameter:  the storage account name.  This must be unique as storage account name always must be.

There should be three deployed resources:

<img src="/assets/2019/5/how-to-use-azure-data-lake-storage-rest-api/resources.png" alt="Resources" />

The storage account is what the two logic apps are going to target.

Both Logic Apps have Managed System Identity (MSI) associated to them.

There is <a href="https://github.com/vplauzon/storage/blob/master/adls-api/deploy.json#L119">another resource deployed with those 3 is a role assignment</a>.  Straight from the ARM template, we give the role <em>Storage Blob Data Contributor</em> to the MSI of <em>create-file-systems-adls-api-app</em>.  This will allow the Logic App to create file systems.

<h2>Create File Systems</h2>

Let's then start by create file systems using <em>create-file-systems-adls-api-app</em>.

Let's open the logic app in edit mode.  We have two http calls:  create-blue and create-red.  Like <a href="https://en.wikipedia.org/wiki/Red_pill_and_blue_pill#The_Matrix_(1999)">Neo, we're going to choose between the red pill and the blue pill</a>.

Let's look at one of them:

<img src="/assets/2019/5/how-to-use-azure-data-lake-storage-rest-api/create-blue.png" alt="create-blue" />

Here we are using the <a href="https://docs.microsoft.com/en-ca/rest/api/storageservices/datalakestoragegen2/filesystem/create">File System / Create</a> API.

This requires an HTTP PUT.  We pass the storage account name as a Logic App parameter.  We pass <em>blue</em> as a parameter in the URL.  We pass the API version as HTTP header.  We also use the Manage Identity to fetch a token for the https://storage.azure.com audience (or scope, or resource, depending on the oauth lexicon you look at).

The create-red is virtually identical, except passing <em>red</em> in parameter.

We can run this Logic App.  We can see each HTTP tasks has an HTTP code of 201 (created) returned to them from the API.

We can validate in Azure Storage Explorer that two file systems were created.

<h2>List path</h2>

Now if we turn to the <em>list-adls-api-app</em> Logic App, we can see two HTTP tasks again:  list-blue &amp; list-red:

<img src="/assets/2019/5/how-to-use-azure-data-lake-storage-rest-api/list.png" alt="List" />

Those are using the <a href="https://docs.microsoft.com/en-ca/rest/api/storageservices/datalakestoragegen2/path/list">Path / List</a> API.

Focussing on <em>list-blue</em>, an HTTP Get method is used.  We passed the <em>blue</em> file system in the URL.  We also pass the URL "/" (root, url encoded to %2F).  We pass the <em>recursive=false</em> parameter.  We again use the managed identity.

Since this is another Logic App, it has a different managed identity.  That identity didn't have any role assignment.

If we run that logic app, we'll see both HTTP call failing with a code 403 and the following payload:

```JavaScript
{
  "error": {
    "code": "AuthorizationPermissionMismatch",
    "message": "This request is not authorized to perform this operation using this permission.\nRequestId:XYZ\nTime:XYZ"
  }
}
```

This is because the Logic App managed identity doesn't have any role or access permission.

<h2>Give access permission</h2>

Instead of assigning a role to the storage account resource, we'll give permission at the file system level.

For that we'll turn to Azure Storage Explorer.  We'll right-click on the blue file system (we choose the <a href="//en.wikipedia.org/wiki/Red_pill_and_blue_pill#The_Matrix_(1999))">blue pill</a>) and select "Manage Access...".

First, we'll need the Object ID of our managed identity.  We could get it from the output of the ARM template deployment but an easy way to get it is to go to the <em>Identity</em> pane of the Logic App and pick the Object ID right there.

<img src="/assets/2019/5/how-to-use-azure-data-lake-storage-rest-api/object-id.png" alt="object-id" />

We are going to input this ID in the "Add user or group" text box of Azure Storage Explorer and press <em>Add</em>.

We are then going to add the following permissions:

<img src="/assets/2019/5/how-to-use-azure-data-lake-storage-rest-api/permissions.png" alt="permissions" />

We need the MSI to be able to read a folder and traverse it (execute).

We need to save those permissions in Azure Storage Explorer.

We can then run Logic App again and see the blue file system is now accessible while red remains inaccessible.

<img src="/assets/2019/5/how-to-use-azure-data-lake-storage-rest-api/partial-success.png" alt="partial success" />

This is inline with our configuration:  we gave access to the blue file system but not the red.

ADLS gen 2 allows us to define access control at a granular level (even blob level).

<h2>Summary</h2>

We were able to invoke two different APIs from the ADLS gen 2 APIs.

We used Azure Managed System Identity (MSI) on Logic Apps.

All APIs can be accessed similarly.

Using a Service Principal instead would be slightly different.  We would first need to do an authentication call and then use the bearer token for the authorization header of the ADLS gen 2 API call.

Hopefully this can be useful until an SDK for ADLS gen 2 becomes available.