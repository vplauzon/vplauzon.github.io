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

Is that the ultimate process?  Of course not.  It's clickbait.  It's a process that worked great for me in a given context though and it should make all this architecture discussion from the previous article more concrete.

The scenario I was working with:

* 18 months worth of Wikipedia data, about 400 GB
*   Data is stored in Parquet format file in a hourly partitioned folder structure (i.e. yyyy/mm/dd/hh)
*   Each blob is about 20 Mb (this isn't optimal as [recommendation is between 100 Mb and 1 Gb](https://docs.microsoft.com/en-us/azure/data-explorer/ingest-data-overview#comparing-ingestion-methods-and-tools))
*   Data has the same shape as real time ingestion and hence requires the same transformation
*   The only transformation required is to rename the pesky *datetime* column into *timestamp* (*datetime* is a reserved keyword in Kusto and needs to be escaped which is annoying)

Here is the approach:

* Create an 