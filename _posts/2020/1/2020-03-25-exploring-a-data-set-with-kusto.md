---
title:  Exploring a data set with Kusto
permalink: /2020/03/25/exploring-a-data-set-with-kusto
categories:
- Solution
tags:
    - Data
date:  2020-02-15
---
<img style="float:right;padding-left:20px;" title="From pexels.com" src="/assets/posts/2020/1/exploring-a-data-set-with-kusto/photo-of-person-swimming-underwater-3369578.jpg" />

We discussed Azure Data Explorer (ADX) and its query language Kusto in a <span style="background-color:yellow">Past article</span>.

In this article, I would like to look at a simple exploration scenario.

We'll download csv files from the web, put them in an Azure Storage Account and from there, we'll do everything in Azure Data Explorer and Kusto.

We'll ingest the data, transform it, then do some slicing and dicing and visualizing to better understand the data.

This is quite a typical scenario when dealing with new data and as we'll see, it is very natural in Kusto.

As usual, [code is in GitHub](https://github.com/vplauzon/kusto/tree/master/imdb).

## Download the data

We'll first download some data.

There are plenty of public (free) data sets on the Internet these days.  For this article, we choose, the Internet Movie Database (IMDB) data set from [IMDB Extractor](http://www.wandora.org/wandora/wiki/index.php?title=IMDB_extractor).

We will only look at *movies.csv* & *ratings.csv* so no need to download all the files.

We will unzip them and put them in an ADLS gen 2 storage account.

## Explore files

We will reuse the user impersonation technique we've discussed in a <span style="background-color:yellow">Past article</span>.  This allows us to use the credentials of the logged in user to access the storage account.  Remember:  we need to add the [Storage Blob Data Reader](https://docs.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#storage-blob-data-reader) role for the user on the storage account.



## Ingest files

## Explore the data

## Summary