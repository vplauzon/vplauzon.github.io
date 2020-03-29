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
<img style="float:left;padding-right:20px;" title="From pixabay.com" src="/assets/posts/2020/2/archiving-application-insights-data/archive.jpg" />

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