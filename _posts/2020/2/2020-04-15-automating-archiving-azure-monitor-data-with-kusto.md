---
date: 2020-03-28
title:  Automating archiving Azure Monitor Data with Kusto
permalink: /2020/04/15/automating-archiving-azure-monitor-data-with-kusto
categories:
- Solution
tags:
- Data
- Operation
- Automation
---
<img style="float:right;padding-left:20px;" title="From pixabay.com" src="/assets/posts/2020/2/automating-archiving-azure-monitor-data-with-kusto/colorful-toothed-wheels-171198.jpg" />

In [our last article](/2020/04/08/archiving-azure-monitor-data-with-kusto), we laid down a method on how to archive Azure Monitor Data using Kusto (Azure Data Explorer).  This allows us to later analyse that data on a much longer period than the Azure Monitor retention period.

![Archiving Process](/assets/posts/2020/2/archiving-azure-monitor-data-with-kusto/archiving-process.png)

In this article, we will automate that archiving method using [Azure Logic Apps](https://docs.microsoft.com/en-us/azure/logic-apps/logic-apps-overview).

As usual, the [code is in GitHub](https://github.com/vplauzon/kusto/tree/master/archive-monitor).