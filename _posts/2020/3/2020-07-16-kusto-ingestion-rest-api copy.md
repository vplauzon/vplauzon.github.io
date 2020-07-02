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

I often use it with little security on.  Hence I had to learn again some quirks about the security model this week.  Some of the quirks are due to misplaced expectation & comparing it to an on-prem / single server technology (which it definitely isn't).  Some quirks are there because it's an evolution of Azure Storage which wasn't built with folders in mind.

I thought I would do an article to list those gotcha.  Here it is.

