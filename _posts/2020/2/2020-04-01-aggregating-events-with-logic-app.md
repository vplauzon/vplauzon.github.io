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

Here is the basic flow:

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

This only needs a resource group and 

![Start resources](/assets/posts/2020/2/aggregating-events-with-logic-app/start-resources.png)

