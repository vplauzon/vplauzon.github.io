---
title:  Ingesting historical data at scale with Kusto
permalink: /2020/06/03/ingesting-histocical-data-at-scale-with-kusto.md
categories:
- Solution
tags:
- Data
- Operation
date: 2020-05-30
---
<img style="float:right;padding-left:20px;" title="From pexels.com" src="/assets/posts/2020/2/ingesting-histocical-data-at-scale-with-kusto/conifer-daylight-evergreen-forest-572937.jpg" />

There are many ways to [ingest data](https://docs.microsoft.com/en-us/azure/data-explorer/ingest-data-overview) in [Kusto](/2020/02/19/azure-data-explorer-kusto).

There is batching vs streaming, queued vs command, plugins, SDK, etc.  .

In this article I want to look at the specific scenario of ingestion large amount of historical data.  Maybe we just want to ingest historical data and analyse it or maybe we also want to stream new data in.

This is an architecture discussion where I want to focus on the following aspects:

* Long running ingestion
* Resiliency
* Caching for old data

## Long running ingestion

## Resiliency

## Caching for old data

## Summary