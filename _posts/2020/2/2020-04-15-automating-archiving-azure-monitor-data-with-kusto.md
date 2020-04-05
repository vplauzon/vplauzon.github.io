---
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

## Deploying the solution

The solution is available in the form of an ARM Template:

[![Deploy button](http://azuredeploy.net/deploybutton.png)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fdata-explorer%2Fmaster%2Farchive-monitor%2Fdeploy.json)

There are two parameters:

Parameter|Value
-|-
Cluster Id|This should be the Azure Resource Id of the ADX cluster we are going to use:  `/subscriptions/XYZ/resourceGroups/ABC/providers/Microsoft.Kusto/clusters/DEF`
Db|The name of the database in the cluster where we are going to archive Azure Monitor data

The ARM Template deploys two Logic App:

*  archive-app
* kusto-app

## Pre-requisite

In order for the solution to work, the designated database must have been setup with tables & functions.  See [last article](/2020/04/08/archiving-azure-monitor-data-with-kusto)'s.

The kusto cluster must also be running (i.e. not be *stopped*).

## Kusto App

Azure Logic App has a connector for Kusto.  It works well.

It follows the connector convention of requiring a user authentication.  This is typically done in the portal by opening the connection and clicking the *authenticating* button.

That means the *current user* is authenticated for the connection and basically the user does the cluster's action.

We prefer having service principal to perform action on behalf of a system (e.g. a Logic App).

Also we had issue with the `.alter table` statement...

For all those reasons, we authored a separate Logic App doing Kusto actions (either query or command) and leveraging the [Kusto REST API](https://docs.microsoft.com/en-us/azure/kusto/api/rest/) and Logic App [Managed Service Identity](https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview) (MSI).  Kusto REST API is really straight forward to use.

Since we were wrapping Kusto call in a different Logic App, we took the opportunity to tidy up the output.  The REST API is quite verbose and requires at least one Logic App action to find the actual query result.  So we do that work in the *kusto-app*.  We also return the original REST API response.

## Permissions

The *kusto-app* has an identity.  We can see that by choosing the *Identity* pane:

![MSI](/assets/posts/2020/2/automating-archiving-azure-monitor-data-with-kusto/msi.png)

That identity must be given access on the Kusto database so it can perform queries and command on it.

In order to give access to Logic App, we'll follow [this procedure](https://docs.microsoft.com/en-us/azure/data-explorer/manage-database-permissions#manage-permissions-in-the-azure-portal) for the database we selected.  We will select *kusto-app* as the principal and give it [Database admin](https://docs.microsoft.com/en-us/azure/data-explorer/manage-database-permissions#roles-and-permissions) role.  This the highest permission we can give, but it is required since we will do `.alter database` to modify the merge policy.

## Archive app

We can open the *archive app*.  We'll notice it mimics pretty closely the process we laid out.

Part 1:

![archive app Part 1](/assets/posts/2020/2/automating-archiving-azure-monitor-data-with-kusto/archive-app-part-1.png)

Part 2:

![archive app Part 2](/assets/posts/2020/2/automating-archiving-azure-monitor-data-with-kusto/archive-app-part-2.png)

We listed Application Insights tables in the *for-each-table* action.  Changing that list for Log Analytics would be the only change necessary to adapt the app for Log Analytics.

## Summary

We automated the process of archiving Azure Monitor data with Kusto.

This could be run recurrently.  In theory it could be run every 90 days to pickup data before the retention on Azure Monitor delete data.

In practice, large data fails on `.append`.  We noticed on Azure Application Insights for instance that the `PerformanceCounters` table was failing with 90 days worth of data.  We had to split the ingestion manually.

The ingestion could be split in the automated process, but an easier option is to perform the ingestion more often.