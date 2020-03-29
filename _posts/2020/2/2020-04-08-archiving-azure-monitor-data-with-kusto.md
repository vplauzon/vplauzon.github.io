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

Around the turn of the year, [I moved my blog to GitHub pages](https://vincentlauzon.com/2020/01/20/i-moved-my-blog-to-github-pages/).  GitHub pages really does only the static content serving part.  I complemented it with a bunch of Azure services.

One of those is [Azure Application Insights](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview) for web analytics.  App Insights [keeps the data for 93 days](https://docs.microsoft.com/en-us/azure/azure-monitor/faq#is-there-a-maximum-amount-of-data-that-i-can-collect-in-azure-monitor).  Although it is plenty to troubleshoot problems, I am after the Data Lake scenario:  *keep all the data and one day you might find a way to exploit it better than when you collected it*.

To a lesser extent, I would like to do the same thing with [Azure Log Analytics](https://docs.microsoft.com/en-us/azure/azure-monitor/log-query/log-query-overview), which I'm also using.

I have been looking for a way to archive that data.  It is exposed by REST API, so I was first planning to write some scheduled Azure Function to pump the data out and to persist in Azure Data Lake storage in the form of parquet files.  That would have worked but would have been a bit of work.

[Kusto](https://vincentlauzon.com/2020/02/19/azure-data-explorer-kusto) / ADX could then have ingested those parquet files as [external tables](https://docs.microsoft.com/en-us/azure/kusto/query/schema-entities/externaltables).

I since found a much simpler way.  [ADX integrates with Azure Monitor](https://docs.microsoft.com/en-us/azure/data-explorer/query-monitor-data).  It's therefore easy to load data from Azure Monitor into an ADX cluster.  When the cluster is turned off, we only pay for the data stored in Standard Azure Storage.  I could export it to files one day if I need to analyse the data outside of Kusto, but it's quite ok there for now.

Archiving the data periodically (more often than every 93 days), I'll be able to get a hold of all the telemetry data since I move the blog to GitHub pages.

In this article, I'll show how to do a periodic import in a robust manner, not reading data twice and taking care of failure scenarios.  This will allow us to **explore a couple of Kusto concepts**.

In a future article, I'll show how to automate the process.

As usual, the [code is in GitHub](https://github.com/vplauzon/kusto/tree/master/archive-monitor).

## Requirements

There is really just one requirement, i.e. tracking where we are at.  But if we think this through a little more, that requirement declines into two:

1.   Remember where we stopped last time
1.   In case we failed in the middle of an archive cycle, be able to roll back the data

For the first requirement, the natural

https://docs.microsoft.com/en-us/azure/kusto/management/databasecursor

https://docs.microsoft.com/en-us/azure/kusto/management/ingestiontime-policy

Get schema for one table:

pageViews
| getschema
| extend param= strcat(ColumnName, ':', ColumnType)
| summarize params = make_list(param)
| project strcat_array(params, ', ')

https://docs.microsoft.com/en-us/azure/kusto/management/externaltables
https://docs.microsoft.com/en-us/azure/kusto/management/data-export/export-data-to-an-external-table