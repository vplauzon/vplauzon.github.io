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

```
.show tables
```

Now, let's go to our Kusto database and create those two [stored functions](https://docs.microsoft.com/en-us/azure/kusto/query/schema-entities/stored-functions):

```
// Let's store the name of the App Insight Cluster in a function
.create-or-alter function aiCluster() {
   // See https://docs.microsoft.com/en-us/azure/data-explorer/query-monitor-data#connect-to-the-proxy
   // Url should start with https://ade.applicationinsights.io or https://ade.loganalytics.io/
   h'<URL to App Insight (AI) cluster>'
}

// Let's store the name of the App Insight backup-database in a function
.create-or-alter function aiDatabase() {
   // Name of the Azure Monitor database:  that is the name of the Log Analytics workspace or
   // the Application Insights service
   h'<database name>'
}
```

This is the Kusto way of storing a constant.  This allows no to pollute the entire script with hard coded URLs.

And now, another function:

```
// Returns the App Insights maximum ingestion time
.create-or-alter function aiMaxIngestionTime() {
   let maxIngestionTime = (cluster(aiCluster()).database(aiDatabase()).availabilityResults | extend ingestionTime=ingestion_time())
   | union (cluster(aiCluster()).database(aiDatabase()).browserTimings | extend ingestionTime=ingestion_time())
   | union (cluster(aiCluster()).database(aiDatabase()).customEvents | extend ingestionTime=ingestion_time())
   | union (cluster(aiCluster()).database(aiDatabase()).customMetrics | extend ingestionTime=ingestion_time())
   | union (cluster(aiCluster()).database(aiDatabase()).dependencies | extend ingestionTime=ingestion_time())
   | union (cluster(aiCluster()).database(aiDatabase()).exceptions | extend ingestionTime=ingestion_time())
   | union (cluster(aiCluster()).database(aiDatabase()).pageViews | extend ingestionTime=ingestion_time())
   | union (cluster(aiCluster()).database(aiDatabase()).performanceCounters | extend ingestionTime=ingestion_time())
   | union (cluster(aiCluster()).database(aiDatabase()).requests | extend ingestionTime=ingestion_time())
   | union (cluster(aiCluster()).database(aiDatabase()).traces | extend ingestionTime=ingestion_time())
   | summarize maxIngestionTime=max(ingestionTime);
   toscalar(maxIngestionTime)
}
```

We are going to use this in the bookmark logic.

Now, let's create the bookmark table:

```
// Create a bookmark table to track where we're at in Azure Monitor cluster
// and be able to roll back in cases where the ingestion fails midway
.create table Bookmark(
   monitorMaxIngestionTime:datetime,
   startIngestionTime:datetime,
   isCompleted:bool)
```

`isCompleted` flag is to differentiate from a permanent bookmark and a temporary one.

`monitorMaxIngestionTime` tracks where we are in Azure Monitor while `startIngestionTime` remembers
when we started ingesting data in Kusto so we can rollback.

Now, let's create functions used in the ingestion process:

```
// Returns the "startIngestionTime" if an incomplete bookmark exists
.create-or-alter function incompleteStartIngestionTime() {
   toscalar(
      Bookmark
      | where not(isCompleted)
      | project startIngestionTime)
}

// Returns the "monitorMaxIngestionTime" for the incomplete bookmark
.create-or-alter function incompleteMonitorMaxIngestionTime() {
   toscalar(
      Bookmark
      | where not(isCompleted)
      | project monitorMaxIngestionTime)
}

// Returns the last archived monitor max ingestion time, i.e. where we're starting from
.create-or-alter function lastArchivedMonitorIngestionTime() {
   toscalar(
      Bookmark
      | where isCompleted
      | project monitorMaxIngestionTime)
}

// Returns a new temporary bookmark row
.create-or-alter function newTemporaryBookmark() {
   print monitorMaxIngestionTime=aiMaxIngestionTime(),
      startIngestionTime=now(),
      isCompleted=false
}

// Returns a new permanent bookmark row
.create-or-alter function newPermanentBookmark() {
   Bookmark
   | where not(isCompleted)
   | extend isCompleted=true
}
```

Finally, let's create the tables mirroring the ones in Application Insights:

```
// First time around, we'll create every table with the correct schema but empty
.set-or-replace availabilityResults with (folder=@"ai") <|
cluster(aiCluster()).database(aiDatabase()).availabilityResults
| limit 0

.set-or-replace browserTimings with (folder=@"ai") <|
cluster(aiCluster()).database(aiDatabase()).browserTimings
| limit 0

.set-or-replace customEvents with (folder=@"ai") <|
cluster(aiCluster()).database(aiDatabase()).customEvents
| limit 0

.set-or-replace customMetrics with (folder=@"ai") <|
cluster(aiCluster()).database(aiDatabase()).customMetrics
| limit 0

.set-or-replace dependencies with (folder=@"ai") <|
cluster(aiCluster()).database(aiDatabase()).dependencies
| limit 0

.set-or-replace exceptions with (folder=@"ai") <|
cluster(aiCluster()).database(aiDatabase()).exceptions
| limit 0

.set-or-replace pageViews with (folder=@"ai") <|
cluster(aiCluster()).database(aiDatabase()).pageViews
| limit 0

.set-or-replace performanceCounters with (folder=@"ai") <|
cluster(aiCluster()).database(aiDatabase()).performanceCounters
| limit 0

.set-or-replace requests with (folder=@"ai") <|
cluster(aiCluster()).database(aiDatabase()).requests
| limit 0

.set-or-replace traces with (folder=@"ai") <|
cluster(aiCluster()).database(aiDatabase()).traces
| limit 0
```

## Ingestion process (happy path)

Let's ingest data from Application Insights.  We'll do it manually here but as mentionned in the introduction,
we'll automate it in a future article.  The [full script is available on GitHub](https://github.com/vplauzon/kusto/blob/master/archive-monitor/ingest-process.kql).

We'll simply follow the activities in the diagram we showed above.

### Disable Merge Policy

This one is quite simple:

```
// Suspend merge policy in the database
.alter database <Kusto database name> policy merge '{"AllowRebuild":false,"AllowMerge":false}'
```

(There are two ways to merge extents, we disable both)

### Incomplete previous record?

Here we simply call upon a function we defined earlier:

```
// Check if an incomplete bookmark exists
print incompleteStartIngestionTime()
```

We use store functions a lot as it makes things easier with automation where we don't want to store detailed logic in the orchestrator.

In the happy path we should have a *NULL* value returned from that function which means we do not have any failed previous attempt to recover from.

### Persist temporary bookmark

`newTemporaryBookmark` will find the latest Azure Monitor ingestion time.

```
// Persist a temporary bookmark
.append Bookmark <| newTemporaryBookmark()
```

If we would execute the `print incompleteStartIngestionTime()` query again, we would get a value.
This is because we haven't completed the ingestion.

### For each table in Azure Monitor, ingest the data since last ingestion

Here we'll show the logic only for `pageViews`, but we need to do that for each table:

```
.append pageViews <|
   let lastArchivedIngestionTime = lastArchivedMonitorIngestionTime();
   let latestIngestionTime = incompleteMonitorMaxIngestionTime();
   cluster(aiCluster()).database(aiDatabase()).pageViews
   | extend ingestionTime = ingestion_time()
   | where isnull(lastArchivedIngestionTime) or ingestionTime > lastArchivedIngestionTime
   | where ingestionTime <= latestIngestionTime
   | project-away ingestionTime
```

We basically append the content of Azure Monitor table between two values of ingestion time:  the previous watermark and the new one.

The reason we bracket "until" `latestIngestionTime` is in the unlikely case that data gets
ingested in Azure Monitor while we copy it.  The last table would have have all the data, while
we wouldn't have caught the data in the first table.  To avoid that, we fix the
latest ingested time at the beginning and leave the rest for next time.

We test for `NULL` to cover the case where the `Bookmark` table is empty, i.e.
the first time we run the process.

### Make the temporary bookmark permanent

Here we need to "update" the bookmark to mark it as permanent.
Although Kusto doesn't allow updates, it's easy to simulate one
on a small table by replacing its content in one operation:

```
// Update in-place bookmark table
.set-or-replace Bookmark <|
   newPermanentBookmark()
```

To better understand what happend here:

* We create a new extent containing the permanent bookmark
* We swap that extent as the only extent for the table

### Enable Merge Policy

This will apply the *default* Merge Policy to the database.

```
// Resume merge policy in the database
.alter database <Kusto database name> policy merge '{}'
```

## Recovering from failures

Now the script to recover from a failure (available on
[GitHub](https://github.com/vplauzon/kusto/blob/master/archive-monitor/failure-recovery.kql)).
Here we are in the scenario where

```
// Check if an incomplete bookmark exists
print incompleteStartIngestionTime()
```

Does return a datetime.

We will roll back everything done after this time:

```
// Let's drop everything created after the bookmark "start time"
// This will include the actual bookmark itself
.drop extents <|
.show database ailogs extents
| where MinCreatedOn>=incompleteStartIngestionTime()
```

Because of the way we create the bookmark, i.e. picking the `now`
time before insert it in the `Bookmark` table, it means the
`Bookmark` extent will have a `MinCreatedOn` value slightly
higher than `incompleteStartIngestionTime()`.  It will therefore
be deleted in the rollback, leaving the Database in the previous
state before the failed process started.

## Summary

We built a robust archiving mechanism from Azure Monitor to
Kusto.

On the way we learned of a couple of concepts such as:

*   Extents
*   Merge Policy
*   Ingestion time
*   Cursors (although we didn't use them)

We used all those concepts to simulate transaction in an append-only database.