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

In this article I want to talk about a typical problem in real time analytics:  synchronizing two streams of data.  This happens all the time when sensor data are produced by different devices.

![2 streams](/assets/posts/2020/1/synchronizing-two-streams-with-kusto/streams.png)
