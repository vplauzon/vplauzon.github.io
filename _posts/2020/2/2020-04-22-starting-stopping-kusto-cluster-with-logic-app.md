---
date:  2020-4-1
title:  Starting / Stopping Kusto cluster with Logic App
permalink: /2020/04/22/starting-stopping-kusto-cluster-with-logic-app
categories:
- Solution
tags:
- Data
- Operation
- Automation
---
<img style="float:left;padding-right:20px;" title="From pixabay.com" src="/assets/posts/2020/2/starting-stopping-kusto-cluster-with-logic-app/yellow-and-red-stop-button.jpg" />

In past articles, we looked at [how to archive Azure Monitor data using Kusto (ADX)](/2020/04/08/archiving-azure-monitor-data-with-kusto) & [how to automate that process using Azure Logic Apps](/2020/04/15/automating-archiving-azure-monitor-data-with-kusto).

If the sole purpose of that specific Kusto Cluster is to archive Azure Monitor Data (as it is in my case for my blog), there is no point keeping it open 24/7.

In this article, we'll see how we can easily craft a Logic app to start and stop a Kusto (ADX) cluster.

As usual, the [code is in GitHub](https://github.com/vplauzon/kusto/tree/master/start-stop-cluster).

## Solution

The solution is quite simple and can be deployed in a click:

[![Deploy button](http://azuredeploy.net/deploybutton.png)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fdata-explorer%2Fmaster%2Farchive-monitor%2Fdeploy.json)

The ARM template has one parameter, `clusterId`, which should be the Azure Resource Id of the ADX cluster we are going to use:  `/subscriptions/XYZ/resourceGroups/ABC/providers/Microsoft.Kusto/clusters/DEF`.

The solution deploys three Logic Apps:

![apps](/assets/posts/2020/2/starting-stopping-kusto-cluster-with-logic-app/apps.png)

The last two apps, as their *prefixes* suggest, exists only to test the first one, *kusto-cluster-app*.

## REST API

The whole solution is based on [Azure Data Explorer (Kusto) REST API](https://docs.microsoft.com/en-us/rest/api/azurerekusto/clusters).

There are over 10 API operations but we are using only 3:

* [Get](https://docs.microsoft.com/en-us/rest/api/azurerekusto/clusters/get) to determine in which [state](https://docs.microsoft.com/en-us/rest/api/azurerekusto/clusters/get#state) the cluster is
* [Start](https://docs.microsoft.com/en-us/rest/api/azurerekusto/clusters/start) to start the cluster
* [Stop](https://docs.microsoft.com/en-us/rest/api/azurerekusto/clusters/stop) to stop the cluster

Those three APIs require authentication so we are going to use [Managed Service Identity](https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview) (MSI).  MSIs are really easy to use with REST APIs in Logic App.

## Access Control

