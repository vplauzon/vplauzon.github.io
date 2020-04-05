---
date: 2020-04-2
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

## Permissions

The *kusto-app* has an identity.  We can see that by choosing the *Identity* pane:

![MSI](/assets/posts/2020/2/msi.png)