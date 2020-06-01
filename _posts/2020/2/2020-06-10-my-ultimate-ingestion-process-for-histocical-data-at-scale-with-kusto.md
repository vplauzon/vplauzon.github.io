---
title:  My ultimate ingestion process for historical data at scale with Kusto
permalink: /2020/06/03/my-ultimate-ingestion-process-for-histocical-data-at-scale-with-kusto
categories:
- Solution
tags:
- Data
- Operation
date:  2020-05-31
---
<img style="float:left;padding-right:20px;" title="From pexels.com" src="/assets/posts/2020/2/my-ultimate-ingestion-process-for-histocical-data-at-scale-with-kusto/body-of-water-between-green-leaf-trees-709552.jpg" />

In my [last article](/2020/06/03/ingesting-histocical-data-at-scale-with-kusto), we discussed different architecture aspects of large historical data ingestion.

In this article, I want to be more prescriptif and share an approach that works well for me.

Is that the ultimate process?  Of course not, that is clickbait.  As we discussed at length in the previous article, different scenario will call for different choices.  But it's a process that worked great for me in a given context though and it should make all this architecture discussion from the previous article more concrete.

It also contains a lot of personnal choices.  For instance, I find using external table more intuitive than ingesting blobs directly.  Logic App, one of my favorite Azure services, also make an appearance.  

The scenario I was working with:

* 18 months worth of Wikipedia data, about 400 GB
*   Data is stored in Parquet format file in a hourly partitioned folder structure (i.e. yyyy/mm/dd/hh)
*   Each blob is about 20 Mb (this isn't optimal as [recommendation is between 100 Mb and 1 Gb](https://docs.microsoft.com/en-us/azure/data-explorer/ingest-data-overview#comparing-ingestion-methods-and-tools))
*   Data has the same shape as real time ingestion and hence requires the same transformation
*   The only transformation required is to rename the pesky *datetime* column into *timestamp* (*datetime* is a reserved keyword in Kusto and needs to be escaped which is annoying)

Here is the approach:

![approach / process](/assets/posts/2020/2/my-ultimate-ingestion-process-for-histocical-data-at-scale-with-kusto/process.png)

1. Create an [external table](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/query/schema-entities/externaltables) pointing to parquet files
1. Create an ingestion table with the same schema as the target table
1. Author a Kusto Stored Function selecting a slice of time from the external data table just after the latest time in the ingestion table but never going further than when the data started in the target table (real time ingestion)
1. Author a Logic App iteratively ingesting data using the Stored Function from the last point until there is no more data
1. Run the Logic App through the entire historical data
1. Validate ingestion
1. Move the data from ingestion table to target table (along with the real time ingested data)

For the remainder of this article, we'll discuss and justify each step.

## Create External Table (1)

We are going to base the ingestion on an [external table](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/query/schema-entities/externaltables) pointing to blobs in the Azure Data Lake as opposed to ingesting from those blobs directly.

As discussed in the previous article, this has the following advantages:

* We can query time windows specifically so we do not "over ingest" (i.e. ingest data we already ingested in real time)
* We can transform the data as we ingest it

We also find it is more intuitive to deal with an external table than a stack of blobs.

In our case the real time ingestion is based on the same blobs.  We are using [Event Grid](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/data-ingestion/eventgrid) to trigger ingestion every time a new blob is added to Azure Data Lake.  Since both real time and historical data are based on the same folders, we need to cutoff the historical ingestion where the real time ingestion started.

As for the transformation, we only had minimal needs.  As mentionned, we simply renamed a column.

## Create Ingestion Table (2)

This is optional although quite convenient.

Instead of ingesting the historical data in the same table where we ingest data in real time, we separate it during the ingestion.

This buys us the flexibility of being much easier to delete the historical data and start over again.

If we ingest in the same table, we could run into historical extents being merged with "real time" extents, which would make it much more complicated to delete historical data.  Also, if by mistake we would re-ingest the data ingested in real time, it would be hard to clean it up.

## Author Kusto Stored Function (3)

As with many database technology, we find it easier to manage data logic when it is closer to the data.  Hence we use Kusto stored function here.

The function's logic is returning the "next slice" of data.  It looks at where the ingestion table is and fetches a slice after that.

The advantage of this approach is that if an ingestion fails, the query will automatically start over since the ingestion table won't have changed.

## Author Logic App (4)

Logic App gives us the reliability / long running capability here.

Nothing fancy:  it is basically a while 

## Run Logic App (5)

## Validate Ingestion (6)

## Move data (7)

## Summary