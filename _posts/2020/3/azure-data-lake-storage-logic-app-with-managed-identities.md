---
title:  Azure Data Lake Storage Logic App with Managed Identities
permalink: /2020/07/22/azure-data-lake-storage-logic-app-with-managed-identities
categories:
- Solution
tags:
- Data
- Identity
- Security
date: 2020-07-03
---
<img style="float:left;padding-right:20px;" title="From pexels.com" src="/assets/posts/2020/3/adls-logic-app-with-managed-identities/lake.jpg" />

[Last time](/2020/07/16/access-control-in-azure-data-lake-storage) we discussed some gotcha with Azure Data Lake Storage (ADLS) and access control.  Those intricacies are useful when accessing ADLS using Azure AD authentication.

Unfortunately, Azure AD authentication is a little more than one year old so a lot of tools are still using the good old storage account access keys.  Those have major inconvenience, chief of those being they give access to everything and they do not allow traceability.

I'm a big Azure Logic App fan and use it for many tasks.  One of the great feature of Azure Logic App is Managed Service Identity where the Logic App is given an identity, a Service Principal, which we can use within the App.  Unfortunatelly, we can't use that identity with ADLS connector.

So today, I'm going to show you how to do that using the ADLS REST API within Logic App.  This is a little like the [sample app I've done a year ago](https://vincentlauzon.com/2019/05/15/how-to-use-azure-data-lake-storage-rest-api/) but this time the app is reusable as a blob list app.

To change things a bit we're going to use a [*user assigned* instead of a *system assigned* identity](https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview#managed-identity-types).  I find user assigned useful Logic Apps since multiple apps can share the same identity if they require the same type of access control.  In this case we are deploying a list-blob app, but a read-blob app could share the same identity.

As usual, [code is in GitHub](https://github.com/vplauzon/storage/tree/master/adls-list-blobs-api).

## Deploy the App

Let's start by deploying the Logic App:

[![Deploy button](http://azuredeploy.net/deploybutton.png)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fstorage%2Fmaster%2Fadls-list-blobs-api%2Fdeploy.json)

The ARM template doesn't take any parameter and deploys two resources:
