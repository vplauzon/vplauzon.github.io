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

Queued ingestion is available [in the SDK](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/api/netfx/kusto-ingest-queued-ingest-sample) and can be [performed using REST API](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/api/netfx/kusto-ingest-queued-ingest-sample).  The problem is that **it isn't one REST API**.  It is an orchestration of several (three to be exact) REST APIs that are encapsulated in the SDK.

I find it convenient to have a REST API for ingestion so I made one using a Logic App.  This article explains how it is build and how to use it.

As usual, [code is in GitHub](https://github.com/vplauzon/kusto/tree/master/rest-ingest-api).

## Queued Ingestion

Let's give a little more context about queued ingestion.

Queued ingestion is the mechanism used under the hood by Kusto when doing [Event Grid subscription ingestion](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/data-ingestion/eventgrid).  Kusto hence queues blobs as they come in near real time.

The key word here is **queued**.  Most ingestion methods in Kusto unqueued (e.g. [.ingest](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/data-ingestion/ingest-from-storage), [.ingest inline](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/data-ingestion/ingest-inline), [from query](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/data-ingestion/ingest-from-query), etc.).  The `async` keyword doesn't mean queued ; it only means the query returns to the client (with the *operation ID* to monitor progress).  But if the ingestion fails or if the cluster goes down, the ingestion fails forever.

Queued ingestion is different.  Queued blob will eventually be processed and retried a few times before Kusto give up on them.  It has many advantages:

* Reliability
* Managing load:  We can queued petabytes of blob without overloading our cluster
* Maximize cluster usage:  the ingestion (once queued) is managed by Kusto as opposed to an external agent, hence it can maximize resource usage

## Deploying the Logic App

Let's get right into it and deploy the Logic App:

[![Deploy button](http://azuredeploy.net/deploybutton.png)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fdata-explorer%2Fmaster%2Frest-ingest-api%2Fdeploy.json)

This ARM template doesn't take any parameter and deploys only one Logic App:

![resources](/assets/posts/2020/3/kusto-ingestion-rest-api/resources.png")

The Logic App has an HTTP trigger so we can use it by doing a simple HTTP-POST (like any REST API) as we'll do when we try it.

## Giving permissions to the Logic App

## Preparing Kusto for ingestion

## Looking at the Logic App Inputs

## Trying the Logic App on a sample file

## Summary