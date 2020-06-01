---
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

The solution is quite simple, so we are going to review a few Logic App techniques along the way.

As usual, the [code is in GitHub](https://github.com/vplauzon/kusto/tree/master/start-stop-cluster).

## Solution

The solution is quite simple and can be deployed in a click:

[![Deploy button](http://azuredeploy.net/deploybutton.png)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fkusto%2Fmaster%2Fstart-stop-cluster%2Fdeploy.json)

The ARM template has one parameter, `clusterId`, which should be the Azure Resource Id of the ADX cluster we are going to use:  `/subscriptions/XYZ/resourceGroups/ABC/providers/Microsoft.Kusto/clusters/DEF`.

The solution deploys three Logic Apps:

![apps](/assets/posts/2020/2/starting-stopping-kusto-cluster-with-logic-app/apps.png)

The last two apps, as their *prefixes* suggest, exists only to test the first one, *kusto-cluster-app*.

## REST API

The whole solution is based on [Azure Data Explorer (Kusto) REST API](https://docs.microsoft.com/en-us/rest/api/azurerekusto/clusters).

There are over 10 API operations, but we are using only 2:

* [Start](https://docs.microsoft.com/en-us/rest/api/azurerekusto/clusters/start) to start the cluster
* [Stop](https://docs.microsoft.com/en-us/rest/api/azurerekusto/clusters/stop) to stop the cluster

Those two APIs require authentication so we are going to use [Managed Service Identity](https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview) (MSI).  MSIs are quite easy to use with REST APIs in Logic App.

## Access Control

Before running any test, we need to give the *kusto-cluster-app* Logic App the *contributor* role on the cluster Azure Resource.  This isn't a cluster permission but an Azure RBAC role assignment.

## Logic App

The Logic App is quite straightforward:

![apps](/assets/posts/2020/2/starting-stopping-kusto-cluster-with-logic-app/process.png)

*execute-command* executes the start or stop command while *response* returns.

## Asynchronous Request-Reply pattern

It is important to note this Logic App implements the [Asynchronous Request-Reply pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/async-request-reply).  That means it doesn't hang until the cluster is started / stopped, it returns a 202 (accepted) with a status endpoint.  The caller can then query that status endpoint to find out when the Logic App is done.  This is a typical pattern used to circumvent time outs on HTTP calls.

In Logic Apps, this is simply implemented by enabling asynchronous response in the *settings* of the response action:

![async](/assets/posts/2020/2/starting-stopping-kusto-cluster-with-logic-app/async.png)

Moreover, when another Logic is the client, this 202 / status endpoint logic is automatically implemented, as in our case with our two *test* Logic Apps.

The *start* / *stop* REST API implements the same pattern and hence *kusto-cluster-app* is awaiting its resolution.  Therefore, the Logic App runs until the cluster is stopped / started.

## Summary

A simple way to automate kusto cluster operations is to wrap them in a Logic App and expose them as an HTTPS endpoint.

This could then be embedded in another Logic App to perform some orchestration.  For instance, we could start a cluster, archive Azure Monitor data and then stop the cluster.