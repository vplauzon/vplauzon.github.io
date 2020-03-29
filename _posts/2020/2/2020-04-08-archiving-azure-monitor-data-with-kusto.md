---
date: 2020-03-27
title:  Archiving Azure Monitor Data with Kusto
permalink: /2020/04/08/archiving-azure-monitor-data-with-kusto
categories:
- Solution
tags:
- Data
- Operation
---
<img style="float:left;padding-right:20px;" title="From pixabay.com" src="/assets/posts/2020/2/archiving-azure-monitor-data-with-kusto/archive.jpg" />
Around the turn of the year, [I moved my blog to GitHub pages](https://vincentlauzon.com/2020/01/20/i-moved-my-blog-to-github-pages/).  GitHub pages does only the static content serving part.  I surrounded it with different Azure services to have a complete blogging solution.

One of those services is [Azure Application Insights](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview) for web analytics.

App Insights [keeps the data for 93 days](https://docs.microsoft.com/en-us/azure/azure-monitor/faq#is-there-a-maximum-amount-of-data-that-i-can-collect-in-azure-monitor).  Although it is plenty to troubleshoot problems, I am after the Data Lake scenario:  *keep all the data and one day you might find a way to exploit it better than when you collected it*.

To a lesser extent, I would like to do the same thing with [Azure Log Analytics](https://docs.microsoft.com/en-us/azure/azure-monitor/log-query/log-query-overview), which I'm also using.

I have been looking for a way to archive that data.  As it is exposed by REST API, I was first planning to write some scheduled Azure Function to pump the data out and persist it in Azure Data Lake storage in the form of [Parquet files](https://en.wikipedia.org/wiki/Apache_Parquet).  [Kusto](https://vincentlauzon.com/2020/02/19/azure-data-explorer-kusto) / ADX could then have ingested those parquet files as [external tables](https://docs.microsoft.com/en-us/azure/kusto/management/data-export/export-data-to-an-external-table).  That approach would have worked but was laborious.

I since found a much simpler way.  [ADX integrates with Azure Monitor](https://docs.microsoft.com/en-us/azure/data-explorer/query-monitor-data) via what is called *ADX proxy*.  It makes it easy to load data from Azure Monitor into an ADX cluster.  When the cluster is turned off, we only pay for the data stored in Standard Azure Storage.  I could export it to blobs one day if I need to analyse the data outside of Kusto.

Archiving the data periodically (more often than every 93 days), I'll be able to get a hold of all the telemetry data since I move the blog to GitHub pages.

In this article, I'll show how to do a periodic import in a robust manner, not reading data twice and taking care of failure scenarios.  This will allow us to **explore a couple of Kusto concepts and techniques**.

In a future article, I'll show how to automate the process.

As usual, the [code is in GitHub](https://github.com/vplauzon/kusto/tree/master/archive-monitor).

## Requirements

There is really just one requirement, i.e. tracking where we are at.  But if we think this through a little more, that requirement declines into two:

1.   Remember where we stopped last time
1.   In case we failed in the middle of an archive cycle, be able to roll back the data

For the first requirement, we first think of [Kusto Database Cursor](https://docs.microsoft.com/en-us/azure/kusto/management/databasecursor).  They allow us to query data "since last time".

Unfortunately, cursors are not implemented in ADX proxy.

We though about looking at *timestamp* in Azure Monitor tables, but this would be a little dangerous.  Data come to Azure Monitor in an asynchronous way and it isn't impossible that earlier data comes later.  Using the timestamp we would expose ourselves to *missing data* sometimes.

We opted for the [ingestion_time](https://docs.microsoft.com/en-us/azure/kusto/query/ingestiontimefunction?pivots=azuredataexplorer) operator.  It returns, for every row, the time at which the data was ingested.  It depends on the [Ingestion Policy](https://docs.microsoft.com/en-us/azure/kusto/management/ingestiontime-policy) being active on table.  It is for Azure Monitor.

We will use that time track where we left off.

For the second requirement, we have to think about it as Kusto is an append-only (or mostly) database.  It doesn't implement transaction nor rollback.

### Rollbacking in Kusto

Data can be deleted in Kusto.  The primary ways are:

*   With [retention policy](https://docs.microsoft.com/en-us/azure/kusto/management/retentionpolicy)
*   With [Data Purge](https://docs.microsoft.com/en-us/azure/kusto/concepts/data-purge)
*   By [dropping extents](https://docs.microsoft.com/en-us/azure/kusto/management/extents-commands#drop-extents)

We are going to use the last mechanism.

Kusto stores its data in shards, or [extents](https://docs.microsoft.com/en-us/azure/kusto/management/extents-overview).  Those are readonly.  In order to "delete" a record in an extent, we need to recreate the entire extent (this is what a data purge does selectively).  But we can drop extents altogether with the [.drop extents](https://docs.microsoft.com/en-us/azure/kusto/management/extents-commands#drop-extents) command.

So to rollback, we could simply drop the extents we created during the last archiving cycle.  Table extents expose a [MinCreatedOn](https://docs.microsoft.com/en-us/azure/kusto/management/extents-commands#show-extents) proprerty that tracks when was the earliest record (row) ingested in it.  If we track when we started, we can simply drop the extents with a *MinCreatedOn* property being "after" the start of the archiving process.

The only problem with this approach is that although extents are readonly, they can get merged.  Having a lot of tiny extents isn't efficient so Kusto merges small extents into bigger ones in the background.  This is governed by the [Merge Policy](https://docs.microsoft.com/en-us/azure/kusto/management/mergepolicy).

This means that the data from a failed archiving process could get merged with the data from past successful process.  This appends in the background and it would be a [race](https://en.wikipedia.org/wiki/Race_condition) to rollback before it happends.

In order to avoid that [racing condition](https://en.wikipedia.org/wiki/Race_condition), we will disable the Merge Policy, at the database level, at the beginning of the archiving process and re-enable it after.

## The process

Here is the complete process:

![Archiving Process](/assets/posts/2020/2/archiving-azure-monitor-data-with-kusto/archiving-process.png)

## Setup a database

In this section, we'll go through the scripts to setup the database.  We recommend using a separate database for this.  We are going to use Azure Application Insights in the scripts, but if we would like to do both App Insights & Log Analytics, we would recommend doing that on two different target databases, since we use database-wide Merge Policy and extents-rollback.

The [complete script is available on GitHub](https://github.com/vplauzon/kusto/blob/master/archive-monitor/setup-db.kql).

We first need to connect to the Azure Monitor cluster (in this case Azure Application Insights).  The [online documentation](https://docs.microsoft.com/en-us/azure/data-explorer/query-monitor-data#connect-to-the-proxy) describes that process well so we won't repeat it here.  We will need the URL.

We will give the table names in the script, but just to show "how we did it", we simply did, within the App Insights database (through ADX proxy):

```sql
.show tables
```

```kusto
.show tables
```