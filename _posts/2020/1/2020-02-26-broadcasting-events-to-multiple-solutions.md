---
title: Broadcasting events to multiple solutions
permalink: /2020/02/26/broadcasting-events-to-multiple-solutions
categories:
- Solution
tags:
    - Integration
date:  2020-2-4
---
<img style="float:right;padding-left:20px;" title="From pexels.com" src="/assets/posts/2020/1/broadcasting-events-to-multiple-solutions/broadcast.jpg" />

I sat down with a customer who had an interesting integration problem the other day.

They are building a system that creates data useful for the entire enterprise.  They want to push that data to different solutions.  They also expose APIs, but they want to support the push-model where their system pushes the data to the different solutions.

Security came to mind.  Some of that data is sensitive and shouldn't be pushed to anyone requesting it.

Also, they do not want to become a bottleneck for the entire organization.  They do not want to have to hand out access keys and revoke them.

In this article, we'll dive into that problem and the solution we came up with, including a working proof of concept (POC).

As usual, [code is in GitHub](https://github.com/vplauzon/messaging/tree/master/event-grid-broadcast-2-event-hubs).

## Possible solutions

At first we thought about [Azure Event Grid](https://docs.microsoft.com/en-us/azure/event-grid/overview).

![Broadcast many topics](/assets/posts/2020/1/broadcasting-events-to-multiple-solutions/broadcast-many-topics.png)

![Broadcast to many solutions](/assets/posts/2020/1/broadcasting-events-to-multiple-solutions/broadcast-to-many.png)