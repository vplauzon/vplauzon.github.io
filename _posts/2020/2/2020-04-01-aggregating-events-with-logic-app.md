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

Event-base processing is getting more and more popular.  It's a great way to loosely couple processes together.

An example in the data realm would be to have one ELT / ETL process finishing by publishing an event so another process (or processes) can start.

Now, how would we implement a process that requires the output of 3 other processes before it can start?

This is what we're going to explore in this article.

Basically, we are going to implement the following solution:

![data-flow](/assets/posts/2020/2/aggregating-events-with-logic-app/data-flow.png)

