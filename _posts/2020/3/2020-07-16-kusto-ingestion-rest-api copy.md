---
title:  Access Control in Azure Data Lake Storage
permalink: /2020/07/16/access-control-in-azure-data-lake-storage
categories:
- Solution
tags:
- Data
- Security
date:  2020-07-02
---
<img style="float:right;padding-left:20px;" title="From pexels.com" src="/assets/posts/2020/3/access-control-in-azure-data-lake-storage/fence.jpg" />

About a year ago I did an [article about Azure Data Lake Storage (ADLS) gen 2 and how to use its REST API](https://vincentlauzon.com/2019/05/15/how-to-use-azure-data-lake-storage-rest-api/).

ADLS gen 2 unlocked a bunch of scenarios.  It is present in every region, it enables analytics operations (e.g. renaming folders), it supports HDFS protocol, it scales, etc.  .

In my experience, it is becoming the de facto standard for data lake raw storage in Azure.

A key feature it added was Access Control List (ACL) at the folder / file level.  That gives us a better granularity for access control which is quite necessary in something as vast as a Data Lake.

I often use it with little security on.  Maybe you do too.  Hence I had to learn again some quirks about the security model this week.  Some of the quirks are due to misplaced expectation & comparing it to an on-prem / single server technology (which it definitely isn't).  Some quirks are there because it's an evolution of Azure Storage which wasn't built with folders in mind.

I thought I would do an article to list those gotcha.  Hopefully that will speed up anyone doing some security modelling on ADLS for the first time or first time in a while.  Here it is.

## Admins can't read it

This one we usually hit even in a low-security context.

We just provisionned an ADLS account.  We are admin of the subscription.  And...  we can't write or even read the data lake.  What's going on?

We actually spent quite a bit of time explaining it in [this article](/2020/02/27/impersonating-user-in-adls-with-kusto) under the section *Why didn’t it work?*.  We recommend reading that section to get a deeper understanding.

In summary:  being owner or contributor sounds like we have all the rights in a subscription.  The thing is that is for the control plane.  This doesn't give us permissions on the data plane.  That being said, as contributor, we can give ourselves data plane roles.  It's just that we don't have them by default.

## Data Reader is a blunt instrument

One of the pre-defined roles in the Data Plane is [Storage Blob Data Reader](https://docs.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#storage-blob-data-reader) (along )

## ACL vs Data Reader

## ACL and inheritance

## What is "execute"?

## What is "default"?

## ACL and "others"

## Summary