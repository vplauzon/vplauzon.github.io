---
title:  Kusto Ingestion REST API
permalink: /2020/07/02/kusto-ingestion-rest-api
image:  /assets/posts/2020/3/kusto-ingestion-rest-api/kitty.jpg
categories:
- Solution
tags:
- API
- Data
---
<img style="float:left;padding-right:20px;" title="From pexels.com" src="/assets/posts/2020/3/kusto-ingestion-rest-api/kitty.jpg" />

Yes, this week we have Kusto & a Kitty.  Can't get better than that ;)

We discussed ingestion in Azure Data Explorer / Kusto at length in [past articles](/2020/06/03/ingesting-histocical-data-at-scale-with-kusto).  We mentioned *queued ingestion* along the ride without diving much into it.  Let's do that now.

Queued ingestion is available [in the SDK](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/api/netfx/kusto-ingest-queued-ingest-sample) and can be [performed using REST API](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/api/netfx/kusto-ingest-queued-ingest-sample).  The problem is that **it isn't one REST API**.  It is an orchestration of several (three to be exact) REST APIs that are encapsulated in the SDK.

I find it convenient to have a REST API for ingestion, so I made one using a Logic App.  This article explains how it is built and how to use it.

As usual, [code is in GitHub](https://github.com/vplauzon/kusto/tree/master/rest-ingest-api).

## Queued Ingestion

Let's give a little more context about queued ingestion.

Queued ingestion is the mechanism used under the hood by Kusto when doing [Event Grid subscription ingestion](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/data-ingestion/eventgrid).  Kusto hence queues blobs as they come in near real time.

The key word here is **queued**.  Most ingestion methods in Kusto unqueued (e.g. [.ingest](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/data-ingestion/ingest-from-storage), [.ingest inline](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/data-ingestion/ingest-inline), [from query](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/data-ingestion/ingest-from-query), etc.).  The `async` keyword doesn't mean queued ; it only means the query returns to the client (with the *operation ID* to monitor progress).  But if the ingestion fails or if the cluster goes down, the ingestion fails forever.

Queued ingestion is different.  Queued blob will eventually be processed and retried a few times before Kusto give up on them.  It has many advantages:

* Reliability
* Managing load:  we can queue petabytes of blobs without overloading our cluster
* Maximize cluster usage:  the ingestion (once queued) is managed by Kusto as opposed to an external agent, hence it can maximize resource usage

## Deploying the Logic App

Let's get right into it and deploy the Logic App:

[![Deploy button](http://azuredeploy.net/deploybutton.png)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fdata-explorer%2Fmaster%2Frest-ingest-api%2Fdeploy.json)

This ARM template doesn't take any parameter and deploys only one Logic App:

![resources](/assets/posts/2020/3/kusto-ingestion-rest-api/resources.png)

The Logic App has an HTTP trigger so we can use it by doing a simple HTTP-POST (like any REST API) as we'll do when we try it.

## Looking at the Logic App

Let's look at the Logic App:

![Logic App](/assets/posts/2020/3/kusto-ingestion-rest-api/orchestration.png)

The orchestration basically replicates what the [online code sample](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/api/netfx/kusto-ingest-client-rest) do:

* Do a call to Data Management to get the "Ingestion Resources" (including the storage queue URI)
* Do another call to Data Management to get a token
* Push messages by calling the Storage Queue API

Since there are 2 calls to do to the Data Management API, we decided to allow queuing more than one blob.  This way, if we queue N blobs, we will do only N+2 REST APIs call instead of 3 x N.  This makes massive ingestion much more efficient.

The loop task loops on the blobs, construct a message and then post the message:

![Loop within Logic App](/assets/posts/2020/3/kusto-ingestion-rest-api/loop.png)

## Looking at the Logic App API Signature

A quick look at the HTTP trigger request body JSON schema reveals the expected inputs.  Most are lifted directly from the expected queue message already [documented online](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/api/netfx/kusto-ingest-client-rest#ingestion-messages---json-document-formats), others are specific to the Logic App API.

Parameter|Type|Mandatory|Description
-|-|-|-
dataManagementUri|string|No|Data Management URI of the cluster where to ingest the data
database|string|Yes|Name of the database where to ingest the data
table|string|Yes|Name of the table where to ingest the data
flushImmediately|boolean|No|See [ingestion message internal structure](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/api/netfx/kusto-ingest-client-rest#ingestion-messages---json-document-formats)
blobs|array|yes|List of blobs to ingest (described below)

In turns the blobs array is expected to be:

Parameter|Type|Mandatory|Description
-|-|-|-
blobUri|string|Yes|URI pointing to the blob to ingest ; this requires to be a public URI (e.g. a blob + SAS token) or to contain the access key of the storage account (less secure approach)
rawDataSize|integer|No|See [ingestion message internal structure](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/api/netfx/kusto-ingest-client-rest#ingestion-messages---json-document-formats)
additionalProperties|object|No|Any [ingestion properties](https://docs.microsoft.com/en-us/azure/data-explorer/ingestion-properties)

We chose the path of not enforcing a schema for the additional properties.

## Default Data Management URI

As we've just seen, we can pass the data management URI of the cluster in parameter.  The parameter is optional because we can set a default in the Logic App.

To set a default, we need to open the Logic App's designer:

![Parameters in Logic App](/assets/posts/2020/3/kusto-ingestion-rest-api/logic-app-parameters-menu.png)

And then replace the default value of the `defaultDataManagementUri` (and only) parameter:

![Default Value](/assets/posts/2020/3/kusto-ingestion-rest-api/default-value.png)

When the parameter is specified in the API payload, it overrides this default value.

## Giving permissions to the Logic App

The next thing we need to do is to give Logic App access to our cluster.  The Logic App has a [Managed Service Identity](https://vincentlauzon.com/2019/11/19/accessing-azure-key-vault-from-within-azure-api-management/) which we leverage when we do REST calls to Kusto.

For that, we need to go in our cluster and select the *Permissions* pane:

![Permission pane](/assets/posts/2020/3/kusto-ingestion-rest-api/permission-pane.png)

We then need to add a role assignment.  The role should be *AllDatabasesAdmin* (the default).  We then need to find our Logic App.  Its name should start with `ingest-blobs-`:

![New Principals](/assets/posts/2020/3/kusto-ingestion-rest-api/new-principals.png)

This will give our Logic App's Identity access to the ingestion APIs.

## Preparing Kusto for ingestion

Finally, we need to create a table for ingestion.

In the examples below we will use a very short [CSV file sample file](https://github.com/vplauzon/kusto/blob/master/rest-ingest-api/sample.csv).

We suggest creating a database dedicated to trying the Logic App.  It is then easier to delete the entire database once the tests have ran instead of chasing the different artifacts.

First, we need to create a table to ingest data into:

```sql
//  Create a table matching the schema of the CSV file
.create table employees(name: string, age: int) 
```

We then create a mapping:

```sql
//  Create an ingestion mapping to map CSV columns to table's column
.create table employees ingestion csv mapping 'employeeCsvMapping'
'['
    '{"Name":"name","DataType":"string","Ordinal":"0","ConstValue":null},'
    '{"Name":"age","DataType":"int","Ordinal":"1","ConstValue":null}'
']'
```

Finally, we change the [ingestion batching policy](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/batchingpolicy) of the table so that data gets ingested quickly after being queued:

```sql
//  Alter ingestion policy to ingest often in 'demo mode' (i.e. get results quickly at expanse of the cluster working harder)
.alter table employees policy ingestionbatching "{'MaximumBatchingTimeSpan': '0:0:10', 'MaximumNumberOfItems': 10000}"
```

We're now ready to run some tests.

## Trying the Logic App on a sample file

To run the rests, we need to do an HTTP-post to the Logic App.  We are using the [Postman tool](https://www.postman.com/) but we could have used [curl](https://www.maketecheasier.com/use-curl-commands-linux/) or any other tools.

To find the URL to post to, we can simply open the Logic App designer, then open the HTTP trigger (the first box at the top) and copy it from there:

![Post URL](/assets/posts/2020/3/kusto-ingestion-rest-api/post-url.png)

For each HTTP-request we do, it is important to set two headers:

Header|Value
-|-
Content-Type|application/json
Accept|application/json

### First test

First let's try a straightforward ingest with the follow HTTP body:

```javascript
{
  "blobs": [
    {
      "additionalProperties": {
        "format": "csv",
        "ingestionMappingReference": "employeeCsvMapping"
      },
      "blobUri": "https://raw.githubusercontent.com/vplauzon/kusto/master/rest-ingest-api/sample.csv"
    }
  ],
  "database": "myingest",
  "table": "employees"
}
```

We only ingest a public blob, reference the database & table but also specify it is a CSV and the mapping to use at ingestion.

We notice the return payload from the HTTP post is a lengthy JSON document.  This is because this Logic App is asynchronous and hence returns immediately with a call-back URL we can find in the `location` header of the response.

We need to wait a few seconds before we'll see data in the `employees` table:

![Data](/assets/posts/2020/3/kusto-ingestion-rest-api/test1.png)

We notice we ingested the data but also ingested the headers with the first row having "name" in the name column.

### Removing CSV headers

First, let's clean our table:

```sql
.drop extents <| .show table employees extents 
```

To remove the CSV headers, we'll need to turn to [ingestion properties](https://docs.microsoft.com/en-us/azure/data-explorer/ingestion-properties).  One of them is named `ignoreFirstRecord` which seems convenient.

So, if we try again with a slightly modified payload:

```javascript
{
  "blobs": [
    {
      "additionalProperties": {
        "format": "csv",
        "ingestionMappingReference": "employeeCsvMapping",
        "ignoreFirstRecord": "true"
      },
      "blobUri": "https://raw.githubusercontent.com/vplauzon/kusto/master/rest-ingest-api/sample.csv"
    }
  ],
  "database": "myingest",
  "table": "employees"
}
```

We should now have our data without the headers.

### Historical data

A point we [discussed about ingestion](https://vincentlauzon.com/2020/06/03/ingesting-histocical-data-at-scale-with-kusto) was the [cache policy](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/cache-policy) privileging *new* data for caching.

For this to work, we need the data being tagged with the time of creation of the data, not the time of ingestion when ingesting historical data.

For this purpose, the ingestion property `creationTime` can be used.  For instance, we could ingest the same data with `creationTime` property setting the creation time in 2017:

```javascript
{
  "blobs": [
    {
      "additionalProperties": {
        "format": "csv",
        "ingestionMappingReference": "employeeCsvMapping",
        "ignoreFirstRecord": "true",
        "creationTime": "2017-02-13T11:09:36.7992775Z"
      },
      "blobUri": "https://raw.githubusercontent.com/vplauzon/kusto/master/rest-ingest-api/sample.csv"
    }
  ],
  "database": "myingest",
  "table": "employees"
}
```

Now if we look at the table, we'll just see twice the same data:  the one we ingested in the previous sub section and the one we just ingested.

But if we look at the extents:

```sql
.show table employees extents
```

We'll see something interesting:

![Extents date](/assets/posts/2020/3/kusto-ingestion-rest-api/extents-date.png)

The first extent is dated with the current date while the second one was dated with the 2017 date.

This would enable the cache policy to evict the 2017 data first if it came to it.

### Other usage

There are many other ways to use that REST API.

We could insert [constant columns in the mapping](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/create-ingestion-mapping-command).  This is often used to insert the name of the file as a column.  To do that, instead of using `ingestionMappingReference`, we would use `ingestionMapping` and pass the actual mapping in with whatever constant we want to pass for a specific blob.

We can add tags.

We can conditionally ingest data if some tags do not exist in the data (see [ingestIfNotExists](https://docs.microsoft.com/en-us/azure/data-explorer/ingestion-properties)).  This gives us a safeguard against re-ingesting the same data.

## Summary

Now we have a REST API for queued ingestion.  We can use it to easily orchestrate ingestion of multiple files.

**A little word about security**.  We built a REST API but didn't secure it.  It is secured by SAS token, i.e. complicated URL.  There is no authentication on that API.  So, we basically have an unsecure REST API giving access to a secure Kusto Cluster.  This is for Proof of Concept (POC) purposes.  In production, we recommend to secure the REST API, for instance, by using [Active Directory OAuth](https://docs.microsoft.com/en-us/azure/logic-apps/logic-apps-securing-a-logic-app#enable-azure-active-directory-oauth).

Queued ingestion is a powerful tool in Kusto as it allows to ingest data at scale and have Kusto worry about it.