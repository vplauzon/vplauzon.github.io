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

## Ingesting movies

We will reuse the user impersonation technique we've discussed in a <span style="background-color:yellow">Past article</span>.  This allows us to use the credentials of the logged in user to access the storage account.  Remember:  we need to add the [Storage Blob Data Reader](https://docs.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#storage-blob-data-reader) role for the user on the storage account.

To perform query in Kusto, the easiest way is to go to the query pane of a Query Cluster in the Azure Portal.  A more comfortable UI can be reached from there by clicking the *Open in Web UI" link.

We will also need a database to ingest data.  We recommend using a newly create database that can be destroyed when those experimentations are done.

Let's start by looking at the files:

```sql
externaldata (text:string)
[@"abfss://<container name>@<account name>.dfs.core.windows.net/movie-lens/movies.csv;impersonate"]
with (format='txt')
| limit 20
```

We need to replace `<account name>` by the name of our  storage account.  We also need to replace `<container name>` by the name of the container where we copied the files.

The output gives us a glimpse into the CSV schema of the file:

```
movieId,title,genres
1,Toy Story (1995),Adventure|Animation|Children|Comedy|Fantasy
2,Jumanji (1995),Adventure|Children|Fantasy
3,Grumpier Old Men (1995),Comedy|Romance
4,Waiting to Exhale (1995),Comedy|Drama|Romance
5,Father of the Bride Part II (1995),Comedy
6,Heat (1995),Action|Crime|Thriller
7,Sabrina (1995),Comedy|Romance
8,Tom and Huck (1995),Adventure|Children
```

## Ingesting ratings

## Explore the data

## Summary