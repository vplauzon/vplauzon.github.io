---
title: Azure Data Explorer (Kusto)
permalink: /2020/03/04/azure-data-explorer-kusto
categories:
- Solution
tags:
    - BigData
    - Data
date:  2020-02-05
---
<img style="float:left;padding-right:20px;" title="From pexels.com" src="/assets/posts/2020/1/azure-data-explorer-kusto/silhouette-of-person-holding-glass-mason-jar-1274260.jpg" />

Let's talk about [Azure Data Explorer](https://docs.microsoft.com/en-us/azure/data-explorer/data-explorer-overview) (ADX ![ADX](/assets/posts/2020/1/azure-data-explorer-kusto/logo-analytics-145-Azure-Data-Explorer-Clusters.svg)).

If you ask me that is the best kept secret in Azure.

Well, it isn't exactly a secret but most people do not know about it or if they do just think of it as the back-end engine behind [Azure Monitor](https://docs.microsoft.com/en-us/azure/azure-monitor/overview).

ADX is an Azure Data Service.  It is ideal to analyze large volume of data.

Isn't that what [Azure Datawarehouse](https://vincentlauzon.com/2016/07/31/how-does-azure-data-warehouse-scale/) is supposed to do?  Or [Azure Databricks](https://vincentlauzon.com/2017/12/18/azure-databricks-getting-started/)?  Actually, there is an entire [category of Analytics Services](https://azure.microsoft.com/en-us/services/#analytics) ADX is part of.

In this article, I'll go around characteristics of the Service:  what its strenght are and where it is complemented by other services.

ADX does a lot of things and is kind of in a category of its own, so it often is a little difficult to describe since we can't simply name drop its category.  I tried to group the caracteristics together.

## Scale & Performance

![Scale](/assets/posts/2020/1/azure-data-explorer-kusto/photo-of-clay-jars-3692053.jpg)

### Scale

The [online documentation](https://docs.microsoft.com/en-us/azure/data-explorer/data-explorer-overview#what-makes-azure-data-explorer-unique) says it scales to terabytes of data in minutes.

That is true but it is also true of many distribute data services.

The uniqueness comes in the next characteristics, i.e. what it can do at that scale.

At heart Azure Data Explorer (ADX) is about...  Data Exploration.  It is a real challenge to explore data at the Terabyte scale.  If we aggregate too much we lose the signal, if we don't we have too much noise.

### Ad Hoc Queries - Fast

In a Data Exploration scenario, we do not know in advance what we are looking for.  We do not have an idea of what to index and how to partition the data.

ADX can perform aggregations on high volume of data in a few seconds, often in less than a second.  This is a truely interactive experience where each query teaches you something about the data and leads you to the next question.

Many big data platform can go through unprocessed (e.g. non-indexed) data sets, but the performance here is where it shines.

### Big Data Analytics - Fast

At first we think of big data analytics as performing aggregations (e.g. sum, average, etc.) on huge data sets.  That is useful but often not sufficient.

As mentionned above, if we aggregate too much, we lose the signal.  It is akin to looking at a forest and be told it is made of wood.  Accurate but not insightful.

One of ADX' strenght is [https://en.wikipedia.org/wiki/Time_series] analysis.  This allows us to take a use data set and split it in multiple series and analyse those series as a whole.  For instance, we could look at the web traffic of a site.  We see ups and downs...  If we split the traffic by users, each user will have a traffic curve.  There might be tens of thousands or more of those curves.  We can then do statistical analysis on those curves, e.g. which one had an abrubt increase or decrease.  We can then pick different curves and look at them.

This is where the service really shines.

### Structured, Semi-Structured & Unstructured - Fast

### Visualisation

### Near real time ingestion

## Data Transformation

## Integration

## What ADX doesn't do

## Summary

Building blocks for other Azure Services

[Azure Monitor logs](https://docs.microsoft.com/en-us/azure/azure-monitor/overview), [Application Insights](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview), [Time Series Insights](https://docs.microsoft.com/en-us/azure/time-series-insights/time-series-insights-update-overview), and [Windows Defender Advanced Threat Protection](https://docs.microsoft.com/en-us/windows/security/threat-protection/microsoft-defender-atp/microsoft-defender-advanced-threat-protection).
