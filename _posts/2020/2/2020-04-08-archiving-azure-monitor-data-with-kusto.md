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

https://docs.microsoft.com/en-us/azure/data-explorer/query-monitor-data

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