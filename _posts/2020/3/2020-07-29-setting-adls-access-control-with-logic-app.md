---
title:  Setting ADLS Access Control with Logic App
permalink: /2020/07/29/setting-adls-access-control-with-logic-app
image:  /assets/posts/2020/3/setting-adls-access-control-with-logic-app/door.jpg
categories:
- Solution
tags:
- Data
- Identity
- Security
date: 2020-07-19
---
<img style="float:right;padding-left:20px;" title="From pexels.com" src="/assets/posts/2020/3/setting-adls-access-control-with-logic-app/door.jpg" />

In the past, [we discussed access control in Azure Data Lake Storage (ADLS)](/2020/07/16/access-control-in-azure-data-lake-storage).  Those intricacies are useful when accessing ADLS using Azure AD authentication.

[Last time](/2020/07/22/azure-data-lake-storage-logic-app-with-managed-identities), we showed how to use Logic App to invoke ADLS REST APIs using AAD identities (in this case, Azure's Managed Service Identities, MSI).

This time I wanted to combine both by showing how to get & set access control lists using Logic App.  The underlying storage API isn't widely advertised and I would like to give a shout out to [Moim Hossain's article](https://moimhossain.com/2019/09/20/access-control-management-via-rest-api-azure-data-lake-gen-2/) that pointed me in the right direction.

Basically, the `get ACL API` is based on ADLS [get properties / HEAD](https://docs.microsoft.com/en-us/rest/api/storageservices/datalakestoragegen2/path/getproperties) while the `set ACL API` is based on ADLS [set properties / PATCH](https://docs.microsoft.com/en-us/rest/api/storageservices/datalakestoragegen2/path/update).  The `set ACL API` also reuse the `list blobs` we developped [in a past article](/2020/07/22/azure-data-lake-storage-logic-app-with-managed-identities).

One of the annoyance of ACL in ADLS [we discussed](/2020/07/16/access-control-in-azure-data-lake-storage) was the lack of inheritance of ACL.  Intuitively we tend to assumed that ACLs set at a root folder would trickle down, but they don't.  The API we develop with Logic App allows us to do that:  to push ACLs recursively down.  This is quite useful when dealing with ADLS.

Also, the HEAD / PATCH APIs from ADLS offer a somewhat crud interface, dealing with a single semi-colon & comma delimited string to represent an ACL.  We break down that string into a richer JSON which makes it easier to do changes.

As usual, [code is in GitHub](https://github.com/vplauzon/storage/tree/master/adls-acl-api).

