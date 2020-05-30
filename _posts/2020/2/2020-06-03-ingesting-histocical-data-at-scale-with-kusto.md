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

In this article I want to look at the specific scenario of ingestion large amount of historical data.  Maybe we just want to ingest historical data and analyse it or maybe we also want to stream new data in.

This is an architecture discussion where I want to focus on the following aspects:

* Long running & Resiliency
* Caching of old data

## Long running & Resiliency

Assuming we have a large body of data, let's say multiple Gbs, we can assume that any [ingestion from query command](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/data-ingestion/ingest-from-query) (i.e. .set, .append, .set-or-append, .set-or-replace) or [.ingest into](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/data-ingestion/ingest-from-storage) would timeout.

Those command can all be made *async*.  But async here simply means the command returns immediately.  It is still bound to [request execution timeout](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/concepts/querylimits#limit-on-request-execution-time-timeout).

Also, a long-running command can fail because of intermitent failures (e.g. a VM failing).

Therefore this type of ingestion is innerently ill-suited to ingest large amount of data.

[Queued ingestion](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/api/netfx/kusto-ingest-queued-ingest-sample) is a reliable ingestion mean.  It relies on an internal Azure Queue.

Different tools leverage queued ingestion (e.g. [LightIngest](https://docs.microsoft.com/en-us/azure/data-explorer/lightingest)).

Alternatively, we can leverage the "unreliable" ingestion commands to ingest small batches and orchestrate the batches using a reliable tool such as Azure Data Factory, Azure Logic Apps, etc.  .

## Caching of old data

Kusto is designed on the premise that we ingest data in a *temporal* fashion and that recent data is more interesting than old data.

This is why there is the concept of retention and hot cache.  Old data is eliminated (retention) while young data is cached and accessed with better performance.

This is configurable:  [Retention Policy](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/retentionpolicy) and [Cache Policy](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/cachepolicy).  But beyond the retention and cache thresholds, those mechanics rely on the time of ingestion.  This makes sense when we ingest data in a continous way, either through Event Hub, IoT Hub, Event Grid or some other periodic process.

But when we ingest a lot of historical data in one go, the data would appear as if it was just ingested and would look "fresher" than data that would have been streamed the day before.

This is problematic because of the two policies we discussed.  That historical data would have preseance over potentially some more recent data for caching.  It would also mean that historical data would have better retention than some other data.

![timeline](/assets/posts/2020/2/ingesting-histocical-data-at-scale-with-kusto/ingestion-timeline.png)

## Summary