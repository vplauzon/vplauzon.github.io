---
title:  Impersonating user with Data Explorer & Azure Storage
permalink: /2020/03/11/impersonating-user-with-data-explorer-azurestorage
categories:
- Solution
tags:
    - Data
    - Security
date: 2020-02-08
---
<img style="float:right;padding-left:20px;" title="From pexels.com" src="/assets/posts/2020/1/impersonating-user-with-data-explorer-azurestorage/airplane-blur-close-up-desk-346793.jpg" />

We discussed Azure Data Explorer (ADX) in a <span style="background-color:yellow">Past article</span>.

In this article I wanted to show how to access an Azure Storage Account using user impersonation, i.e. using the identity of the user running the queries to access the storage.

It would be all trivial and boring if it wouldn't be for a peculiar aspect of RBAC around Storage Account.  After all the [online doc](https://docs.microsoft.com/en-us/azure/kusto/api/connection-strings/storage#azure-data-lake-store-gen-2) states how to that by simply appending ;impersonate to a URI...  My surprise when I tried that was that I didn't have access!

How can I be contributor on the resource group and not have access?  We'll see how.

As usual, the [code is in GitHub](https://github.com/vplauzon/data-explorer/tree/master/impersonation-storage).

## The Sample

In order to easily reproduce the issue, let's deploy the ARM Template:

[![Deploy button](http://azuredeploy.net/deploybutton.png)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Faks%2Fmaster%2Faks-kubenet%2Fdeploy.json)

The template has no parameters and will deploy two resources:  a storage account and an ADX cluster:

![resources](/assets/posts/2020/1/impersonating-user-with-data-explorer-azurestorage/resources.png)