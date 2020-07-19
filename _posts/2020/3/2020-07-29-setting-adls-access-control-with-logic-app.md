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

A few weeks ago, [we discussed access control in Azure Data Lake Storage (ADLS)](/2020/07/16/access-control-in-azure-data-lake-storage).  Those intricacies are useful when accessing ADLS using Azure AD authentication.

[Last time](/2020/07/22/azure-data-lake-storage-logic-app-with-managed-identities), we showed how to use Azure's Managed Service Identities (MSI) & Logic App to invoke ADLS REST APIs using AAD identities.

This time I wanted to combine both by showing how to set access control lists using Logic App.  The underlying storage API isn't widely advertise and I would like to give a shout out to [Moim Hossain's article](https://moimhossain.com/2019/09/20/access-control-management-via-rest-api-azure-data-lake-gen-2/) that pointed me in the right direction.

One of the annoyance of ACL in ADLS [we discussed](/2020/07/16/access-control-in-azure-data-lake-storage) was the lack of inheritance of ACL.  Intuitively we tend to assumed that ACLs set at a root folder would trickle down, but they don't.  The API we develop with Logic App allows us to do that:  to push ACLs recursively down.  This is quite useful when dealing with ADLS.

As usual, [code is in GitHub](https://github.com/vplauzon/storage/tree/master/adls-acl-api).

