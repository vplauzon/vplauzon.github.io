---
title:  Impersonating user in ADLS with Data Explorer
permalink: /2020/03/11/impersonating-user-in-adls-with-data-explorer
categories:
- Solution
tags:
    - Data
    - Security
date: 2020-02-13
---
<img style="float:right;padding-left:20px;" title="From pexels.com" src="/assets/posts/2020/1/impersonating-user-in-adls-with-data-explorer/airplane-blur-close-up-desk-346793.jpg" />

We discussed Azure Data Explorer (ADX) in a <span style="background-color:yellow">Past article</span>.

In this article I wanted to show how to access an ADLS gen 2 using user impersonation, i.e. using the identity of the user running the queries to access the storage.

It would be all trivial and boring if it wouldn't be for a peculiar aspect of RBAC around Storage Account.  After all the [online doc](https://docs.microsoft.com/en-us/azure/kusto/api/connection-strings/storage#azure-data-lake-store-gen-2) states how to that by simply appending ;impersonate to a URI...  My surprise when I tried that was that I didn't have access!

How can I be contributor on the resource group and not have access?  We'll see how.

As usual, the [code is in GitHub](https://github.com/vplauzon/data-explorer/tree/master/impersonation-storage).

## Sample solution

In order to easily reproduce the issue, let's deploy the ARM Template:

[![Deploy button](http://azuredeploy.net/deploybutton.png)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fdata-explorer%2Fmaster%2Fimpersonation-storage%2Fdeploy.json)

The template has no parameters and will deploy two resources:  a storage account and an ADX cluster:

![resources](/assets/posts/2020/1/impersonating-user-in-adls-with-data-explorer/resources.png)

The cluster is a dev-cluster, the cheapest available option.

## Sample file

First thing we'll do is to copy a CSV file in the storage account.  This is the CSV file we'll be trying to read using ADX.

The storage account should have been deployed with a container named *data*.  We'll copy the [sample.csv](https://github.com/vplauzon/data-explorer/blob/master/impersonation-storage/sample.csv) file into the root of that container (sometimes called file system in ADLS gen 2).

## Trying to access the file

Let's jump to ADX.  The easiest way to do queries is to use the *query pane* in the ADX resource:

![query pane](/assets/posts/2020/1/impersonating-user-in-adls-with-data-explorer/query-pane.png)

We can also go to the ADX Web UI, which is an outside-of-portal Web UI experience, by clicking *Open in Web UI*.

We can then type the following query:

```sql
externaldata (text:string)
[@"abfss://data@<storage account name>.dfs.core.windows.net/sample.csv;impersonate"]
with (format='txt')
```

It is important to replace the storage account name by ours.

This should fail with the following error message:

![error message](/assets/posts/2020/1/impersonating-user-in-adls-with-data-explorer/failure.png)

Basically, we do not have access.  We'll explain why that is, but before, let's fix the problem.

## Role assignment

We need to add the role [Storage Blob Data Reader](https://docs.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#storage-blob-data-reader) to ourselves (or who ever access the data lake using ADX).

This is a [standard procedure](https://docs.microsoft.com/en-us/azure/role-based-access-control/role-assignments-portal) so we won't document it here.

## Trying again



## Why didn't it work?

https://github.com/vplauzon/azure-training/tree/master/rbac

## Summary