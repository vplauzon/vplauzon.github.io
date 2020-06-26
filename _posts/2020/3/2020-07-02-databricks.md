---
title:  Kusto Ingestion REST API
permalink: /2020/07/02/kusto-ingestion-rest-api
categories:
- Solution
tags:
- Data
date: 2020-06-25
---
<img style="float:left;padding-right:20px;" title="From pexels.com" src="/assets/posts/2020/3/kusto-ingestion-rest-api/kitty.jpg" />

Yes this week we have Kusto & a Kitty.  Can't get better than that ;)

We discussed ingestion in Azure Data Explorer / Kusto at length in [past articles](/2020/06/03/ingesting-histocical-data-at-scale-with-kusto).  We mentionned *queued ingestion* along the ride without diving much into it.  Let's do that now.

Queued ingestion is the mechanism used by Kusto when doing [Event Grid subscription ingestion](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/data-ingestion/eventgrid).  Kusto queues blobs as they come in near real time.

The key word here is **queued**.  All other ingestion mode in Kusto are synchronous (e.g. [.ingest](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/data-ingestion/ingest-from-storage), [.ingest inline](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/data-ingestion/ingest-inline), [from query](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/data-ingestion/ingest-from-query), etc.).  The `async` keyword doesn't mean queued ; it only means the query returns to the client (with the *operation ID* to monitor progress).  But if the ingestion fails or if the cluster goes down, the ingestion fails forever.

Queued ingestion is different.