---
title:  Ingesting historical data at scale with Kusto
permalink: /2020/06/03/ingesting-histocical-data-at-scale-with-kusto
categories:
- Solution
tags:
- Data
- Operation
date: 2020-05-30
---
<img style="float:right;padding-left:20px;" title="From pexels.com" src="/assets/posts/2020/2/ingesting-histocical-data-at-scale-with-kusto/conifer-daylight-evergreen-forest-572937.png" />

There are many ways to [ingest data](https://docs.microsoft.com/en-us/azure/data-explorer/ingest-data-overview) in [Kusto](/2020/02/19/azure-data-explorer-kusto).

There is batching vs streaming, queued vs command, plugins, SDK, etc.  .  There is also a pletora of tools / techniques to achieve this, e.g. [Azure Data Factory](https://docs.microsoft.com/en-us/azure/data-explorer/data-factory-integration), [LightIngest](https://docs.microsoft.com/en-us/azure/data-explorer/lightingest), [.ingest into](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/data-ingestion/ingest-from-storage), etc.  .

In this article I want to look at the specific scenario of ingestion large amount of historical data.  This can be done in conjonction with streaming real-time data or not.

This is an architecture discussion where I want to focus on the following aspects:

* Long running & Resiliency
* Caching of old data
* Real time & historical ingestion alignment

## Long running & Resiliency

Assuming we have a large body of data, let's say multiple Gbs, we can assume that any [ingestion from query command](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/data-ingestion/ingest-from-query) (i.e. .set, .append, .set-or-append, .set-or-replace) or [.ingest into](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/data-ingestion/ingest-from-storage) would timeout.  That is, a query such as

```sql
.set MyTable <| <query returning Gbs of data>
```

(especially if the said query is done over standard blobs) would timeout.

Those command can all be made *async*.  But async here is a client concept.  It simply means the command returns immediately.  It is still bound to [request execution timeout](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/concepts/querylimits#limit-on-request-execution-time-timeout).

Also, a long-running command can fail because of intermitent failures (e.g. a VM failing) and won't be retryed automatically.

Therefore this type of ingestion is innerently ill-suited to ingest large amount of data.

[Queued ingestion](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/api/netfx/kusto-ingest-queued-ingest-sample) is a reliable ingestion mean.  It relies on an internal Azure Queue and implements retries in case of failures.  Different tools leverage queued ingestion (e.g. [LightIngest](https://docs.microsoft.com/en-us/azure/data-explorer/lightingest)).

Alternatively, we can leverage the "unreliable" ingestion commands to ingest small batches and orchestrate the batches using a reliable tool such as Azure Data Factory, Azure Logic Apps, etc.  .

## Caching of old data

Kusto is designed on the assumption that we ingest data in a *temporal* fashion and that recent data is more interesting than old data.

This is why there is the concept of retention and hot cache.  Old data is eliminated (retention) while young data is cached and accessed with better performance.

This is configurable:  [Retention Policy](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/retentionpolicy) and [Cache Policy](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/cachepolicy).  But beyond the retention and cache thresholds, those mechanics rely on the time the data was ingested.  This makes sense when we ingest data in a continous way, either through Event Hub, IoT Hub, Event Grid or some other periodic process.

But when we ingest a lot of historical data in one go, the data would appear as if it was just ingested and would look "fresher" than data that would have been streamed the day before in real time.

In order to avoid that, we need to mark the data with a *fake* ingestion time.  This is possible in Kusto.  Actually it is done at the [extent (data shard)](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/extents-overview) level:
* *LightIngest* with the [creationTimePattern](https://docs.microsoft.com/en-us/azure/data-explorer/lightingest#general-command-line-arguments) argument
* [Ingestion from query command](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/data-ingestion/ingest-from-query) (i.e. .set, .append, .set-or-append, .set-or-replace) and [.ingest into](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/data-ingestion/ingest-from-storage) via the *creationTime* ingestion property

## Real time & historical ingestion alignment

The typical projects we see start by exploring some data.  This is sample data exported to blob and ingested manually.  Once proof of value is done and the team want to scale up, they often move to ingesting data in real time, i.e. streaming.  Once this is stabilized, the team want to move (or migrate) the entire historical data set in.

Sometimes teams doing the other way around, i.e. they ingest historical data, then setup real time ingestion, then ingest the historical data they missed in between.

In any case, the point of this section is not to overlap data ingestion and end up with the same data twice.

To make those consideration clear, let's consider the following timeline:

![timeline](/assets/posts/2020/2/ingesting-histocical-data-at-scale-with-kusto/ingestion-timeline.png)

The time on the time axis are as follow:

Time|Description
-|-
t<sub>0</sub>|Time at which recording of historical data started
t<sub>s</sub>|Time at which we started *streaming* data into Kusto
t<sub>i</sub>|Time at which we started the ingestion of historical data

The point here is we don't want to reingest data between t<sub>s</sub> and t<sub>i</sub>.

This can be hard to do if we do not control the historical data export.  For instance, if that data is exported by a legacy system into Parquet files, it will unlikely cut at t<sub>s</sub>.  Typially those process cut at fixed time internal and / or file size.

This is a minor point and could be addressed with a [purge of data](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/concepts/data-purge).  We find it more efficient (and elegant) to ingest the data *up to t<sub>s</sub>*.

The best way we found to address that is to use an [external table](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/query/schema-entities/externaltables) as a source instead of blob directly.  This allows use to where-clause the external data table to avoid overlapping data.

This discards tools such as *LightIngest*.  This is a shame as it leverages queued ingestion (coming back to the reliability point at the beginning).

## Summary

We have looked at different aspects of large scale historical data ingestion in Kusto.

It is a balancing act and depending on the scenario we might favor different approach / tools.

In a future article, we'll detail an approach we like to use that balance those different factors.