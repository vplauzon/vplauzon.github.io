---
date:  2020-03-25
title:  Aggregating events with Logic App
permalink: /2020/04/01/aggregating-events-with-logic-app
categories:
- Solution
tags:
- Data
---
<img style="float:right;padding-left:20px;" title="From pixabay.com" src="/assets/posts/2020/2/aggregating-events-with-logic-app/merging.jpg" />

Event-based processing is getting more and more popular.  It's a great way to loosely couple processes together.

An example in the data realm would be to have one ELT / ETL process finishing by publishing an event so another process (or processes) can start.

Now, how would we implement a process that requires the output of 3 other processes before it can start?

This is what we're going to explore in this article.

As usual the [code is in GitHub](https://github.com/vplauzon/messaging/tree/master/aggregating-event-grid-logic-app).

## Target solution

Basically, we are going to implement the following solution:

![data-flow](/assets/posts/2020/2/aggregating-events-with-logic-app/data-flow.png)

* We are going to drop three (3) files in a storage account:  a.txt, b.txt & c.txt
* Each file triggers an [Azure Event Grid](https://docs.microsoft.com/en-us/azure/event-grid/overview) event ; this is automatic (i.e. build-in Azure Infrastructure)
* Each event will act as a trigger to different instances of *Blob App* Logic App
* Each Logic App will send a "message" to a **single instance** of *Aggregation App* Logic App
* *Aggregation App* will publish an Event Grid custom topic event
* A last Logic App, *Biz Process App*, will be triggered by this event

This demo is meant to represent a simplified version of a real process where multiple events must occur before a given process is started.

## Kick starting the solution

Let's start by deploying the begining of the application:

[![Deploy button](http://azuredeploy.net/deploybutton.png)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fmessaging%2Fmaster%2Faggregating-event-grid-logic-app%2Fdeploy-start.json)

This only needs a resource group and no parameter.  It should deploy the following resources (names will vary):

![Start resources](/assets/posts/2020/2/aggregating-events-with-logic-app/start-resources.png)

So we already have our 3 Logic Apps (they are all empty), a storage account with a *drop-zone* container and a custom event-grid topic.

## Blob App

We are now going to build up the solution.  The completed solution can also be deployed using this:

[![Deploy button](http://azuredeploy.net/deploybutton.png)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fmessaging%2Fmaster%2Faggregating-event-grid-logic-app%2Fdeploy-final.json)

We could create the *Blob App* using the *Events* section of the storage account.  Since the Logic App already exists, we're going to go through the Logic App designer for that app instead.

Let's search for "grid" and select "When a resource event occurs":

![Event Grid Trigger](/assets/posts/2020/2/aggregating-events-with-logic-app/event-grid-trigger.png)

This will prompt us to authenticate.  We will enter the following values for the parameters of the trigger:

Parameter|Value
-|-
Subscription|Subscription where the storage account we just created is
Resource Type|Microsoft.Storage.StorageAccounts
Resource Name|Name of the storage account
Event Type Item-1|Microsoft.Storage.BlobCreated

![Blob Trigger Configuration](/assets/posts/2020/2/aggregating-events-with-logic-app/blob-trigger-config.png)

Let's save that Logic App and test it:  let's drop an empty file in the *drop-zone* container.  We can use the empty [a.txt](https://github.com/vplauzon/messaging/blob/master/aggregating-event-grid-logic-app/a.txt), [b.txt](https://github.com/vplauzon/messaging/blob/master/aggregating-event-grid-logic-app/b.txt) or [c.txt](https://github.com/vplauzon/messaging/blob/master/aggregating-event-grid-logic-app/c.txt) files.  Going back to the main screen for the Logic App and refreshing the history, we should see a successful run:

![Blob History](/assets/posts/2020/2/aggregating-events-with-logic-app/blob-history.png)

This actually allows us to look at what the Event Grid event looks like by looking at the run and the body of the trigger.

```json
{
  "topic": "/subscriptions/---/resourceGroups/---/providers/Microsoft.Storage/storageAccounts/storage6dtarjgsj6yvo",
  "subject": "/blobServices/default/containers/drop-zone/blobs/a.txt",
  "eventType": "Microsoft.Storage.BlobCreated",
  "eventTime": "2020-03-26T18:03:21.7880283Z",
  "id": "b0cbb9b3-a01e-008c-1698-03c0e106fab4",
  "data": {
    "api": "PutBlob",
    "clientRequestId": "213b87e0-9674-43cb-4ab7-228abd4e5b71",
    "requestId": "b0cbb9b3-a01e-008c-1698-03c0e1000000",
    "eTag": "0x8D7D1AFF8AE78DB",
    "contentType": "application/octet-stream",
    "contentLength": 0,
    "blobType": "BlockBlob",
    "url": "https://storage6dtarjgsj6yvo.blob.core.windows.net/drop-zone/a.txt",
    "sequencer": "00000000000000000000000000001ABC0000000000382cee",
    "storageDiagnostics": {
      "batchId": "c7647f7a-d006-0086-0098-036456000000"
    }
  },
  "dataVersion": "",
  "metadataVersion": "1"
}
```

We can see the subject container the path of the blob.  We will use that to validate the blob.

### Validate blob

The first thing we'll want to do is to validate the blob path.  This is quite useful in Data Lake situation where a container can have many folders while we are interested only in the activity of one such folder.

We'll add a *Compose* action with the following inputs:

```
split(triggerBody()?['subject'], '/')
```

We basically do a split of the *subject* trigger property.  This will return an array of path parts.

We can then test the array is of size 7 (if like us, we drop the files at the root of the container) and if for some equality.  For example, if the blob name is `a.txt`.

It is good practice to validate.  This avoids starting logic when irrelevant blobs are created.

The Logic App would still run though until the validation code.  This will add a lot of runs in the logs and would also incure some cost.  This is why it is also great to filter *at the source*.

### Filter at the source

Let's go to the storage account, select the *Events* pane.  We'll notice that a subscription exist at the bottom:

![Storage Subscription](/assets/posts/2020/2/aggregating-events-with-logic-app/storage-subscription.png)

This is our Logic App, registered as a *Web Hook*.  This means *Event Grid* actually call an HTTPS endpoint listened to by our Logic App when an event is fired.

We can customize that subscription by applying [subject filters](https://docs.microsoft.com/en-us/azure/event-grid/event-filtering#subject-filtering):

![Subject Filering](/assets/posts/2020/2/aggregating-events-with-logic-app/subject-filering.png)

If we test with a non `.txt` file, we'll see the Logic App doesn't get fired.

This is powerful as it filters the events at the source and reduces the traffic on our Logic App.

### Send message

Let's 