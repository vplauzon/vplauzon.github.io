---
title:  Exploring a data set with Kusto
permalink: /2020/03/11/exploring-a-data-set-with-kusto
categories:
- Solution
tags:
    - Data
date:  2020-2-25
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

The output gives us a glimpse into the schema of the file:

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

We quickly notice a few things:

* The general format is CSV (with actual comma)
* The year of the movie is embedded in the title
* The genres are an array using a pipes to delimit each entry

CSV format is supported out of the box.  To extract the year, we'll need to use a *regular expression* (regex).  Finally, to extract the genres, we'll simply need to split on pipes.  We will store the genres as an array.

```sql
.set-or-replace movies <| externaldata (
movieId:int,
compositeTitle:string,
genresArray:string)
[@"abfss://<container name>@<account name>.dfs.core.windows.net/movie-lens/movies.csv;impersonate"]
with (format='csv', ignoreFirstRecord=true)
//  Make the genres an array, splitting by pipes
| extend genres = split(genresArray, '|')
//  Extract movie title using a reg-ex
| extend movieTitle = extract(@"(.*)\s*\((\d+)\)", 1, compositeTitle)
//  Extract movie year using a reg-ex
| extend year = toint(extract(@"(.*)\s*\((\d+)\)", 2, compositeTitle))
//  Take only relevant columns
| project movieId, movieTitle, genres, year
```

Here we do it in one go but typically, that process is iterative which is quite natural in Kusto.

## Ingesting ratings

Now that we have our movies, let's ingest the ratings.

We'll first look at the file:

```sql
externaldata (text:string)
[@"abfss://<container name>@<account name>.dfs.core.windows.net/movie-lens/ratings.csv;impersonate"]
with (format='txt')
| limit 20
```

Again, the schema is made obvious by looking at a few rows:

```
userId,movieId,rating,timestamp
1,2,3.5,1112486027
1,29,3.5,1112484676
1,32,3.5,1112484819
1,47,3.5,1112484727
1,50,3.5,1112484580
1,112,3.5,1094785740
1,151,4.0,1094785734
1,223,4.0,1112485573
1,253,4.0,1112484940
```

This is more a trivial CSV so we can easily ingest it:

```sql
.set-or-replace ratings <| externaldata (
userId:int,
movieId:int,
rating:real,
timeStamp:int)
[@"abfss://<container name>@<account name>.dfs.core.windows.net/movie-lens/ratings.csv;impersonate"]
with (format='csv', ignoreFirstRecord=true)
```

This ingestion query takes around a minute to execute.

## Explore the data

Now that we have some data cached in Kusto, let's do some exploration.

Let's look at the movie distribution in time:

```sql
movies
| where isnotnull(year)
| summarize count() by year
| render columnchart 
```

This returns us the following chart:

![Movie Distribution](/assets/posts/2020/1/exploring-a-data-set-with-kusto/movie-dist.png)

That is a good example of quickly getting to know the data.  Kusto let us (very) quickly aggregate data and visualize it in one command.

Now let's look at the movie distribution across genres.  Since the genres are stored as an array, we'll need to expand that array on multiple rows using *mv-expand*:

```sql
movies
//  Expend the genres into multiple rows
| mv-expand genres to typeof(string)
| summarize size=count() by genres
//  Sort to make the pie chart look nicer
| sort by size
| render piechart
```

We can see that drama and comedy take the lion share of genres.

![Genre Distribution](/assets/posts/2020/1/exploring-a-data-set-with-kusto/genre-dist.png)

We can then look at both movies and ratings to ask deeper questions.  For instance, what movies got the most ratings?

```sql
movies
| join ratings on movieId
| summarize size=count() by movieTitle
| top 5 by size
| render columnchart 
```

![Most Ratings](/assets/posts/2020/1/exploring-a-data-set-with-kusto/most-ratings.png)

Or what movies got the best ratings?

```sql
movies
| join ratings on movieId
| summarize size=count(), rating=avg(rating) by movieTitle
| top 5 by rating
```

The result is a bit odd:

movieTitle|size|rating
-|-|-
Into the Middle of Nowhere| 	1|	5
Prom Queen: The Marc Hall Story| 	1|	5
Inquire Within| 	1|	5
Ella Lola, a la Trilby| 	1|	5
The Floating Castle| 	1|	5

It happens that those movies just received one rating that happened to be very high.  This is just noise in the data set.  Instead, let's look at the movie which sums the best rating or has the best "weight" of ratings:

```sql
movies
| join ratings on movieId
| summarize rating=sum(rating) by movieTitle
| top 5 by rating
| render columnchart
```

![Best Ratings](/assets/posts/2020/1/exploring-a-data-set-with-kusto/best-ratings.png)

This gives us a better answer.  We can see the ratings by hovering on the columns.

## Summary

We went around a quick data exploration scenario.

We looked at the raw data:  the text in the CSV file.  Quickly we built a schema and ingested the files.

From there we were able to dive into the data set, asking questions and quickly getting answer.

Some of the queries were iterations on our side.  For instance, summarizing on size when looking at the best ratings was done after we looked at the result and didn't recognize any of the movie.  Adding the size, or the number of ratings, quickly told us that there was only one rating for each and therefore that was only noise.

One of Kusto's strength lies in this ad hoc / interactive query mode.  It is very easy to iteratively improve on queries as we learn from the data.