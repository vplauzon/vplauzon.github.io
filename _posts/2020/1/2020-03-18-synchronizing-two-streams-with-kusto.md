---
title:  Synchronizing two streams with Kusto
permalink: /2020/03/18/synchronizing-two-streams-with-kusto
categories:
- Solution
tags:
    - Data
    - Streaming
date:  2020-02-14
---
<img style="float:left;padding-right:20px;" title="From pexels.com" src="/assets/posts/2020/1/synchronizing-two-streams-with-kusto/landscape-photography-of-waterfalls-surrounded-by-green-931007.jpg" />

We discussed Azure Data Explorer (ADX) and its query language Kusto in a <span style="background-color:yellow">Past article</span>.

In this article I want to talk about a typical problem in real time analytics:  synchronizing two streams of data.

This happens all the time when sensor data are produced by different devices.  Different devices may record measurements at different times and different frequency.  In order to reason about measurements from different devices, we need to synchronize those events.

We'll first explain what the problem is.  We'll then give a naïve solution which we'll show doesn't scale.  We'll then give a solution that can scale to milion of records.

As usual, the [code is in GitHub](https://github.com/vplauzon/kusto/tree/master/sync-2-streams).

## 2 streams problem

Let's look at two streams of events from two devices:

![2 streams](/assets/posts/2020/1/synchronizing-two-streams-with-kusto/streams.png)

The events from stream 1 are letters while the events from stream 2 are numbers.

We can make a number of observations:

* No event in one stream occur at the same time than an event in the other stream
* Events aren't necessarily happening at regular pace
* Both streams don't perfectly interlace events
* Event A occur before any event in Stream 2 occur

There are multiple things we might want to do with those streams.  For this article, we'll focus on one problem:

> We want to look at measurements done in both streams, so we want measurements in stream 2 to be correlated to measurements in stream 1.

Also, we'll define the correlation further:

> The correlation should work in a way that for a measurement (event) in stream 1, we're going to take the value of the measurement in stream 2 that happend "just before" (i.e. as close as possible AND before).

We could frame the problem differently, but we found that solving this problem provides a lot of techniques that can be reused to solve similar problems.

For the example we gave we should have the following result:

|Event in Stream 1|Event in Stream 2 (correlated)
|-|-
|A|*NULL / Missing* (no event in stream 2 occured before event A)
|B|1
|C|3
|D|3
|E|5

## Naïve solution

