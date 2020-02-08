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

## First draft

At first we thought about [Azure Event Grid](https://docs.microsoft.com/en-us/azure/event-grid/overview).

Event Grid is great for that scenario as it is a push solutions:  it delivers the events to subscribers.

Now there was security concerns.  There are different delivery mechanisms (or [handlers](https://docs.microsoft.com/en-us/azure/event-grid/overview#event-handlers)).  The most obvious one, i.e. a web hook, would required the different solutions to expose a public endpoint for Event Grid to contact.  At the time of this writing, i.e. February 2020, Event Grid doesn't integrate with VNETs.

That was deamed unacceptable as it brought too much risks.  The endpoint could be attacked.  We can now [secure web hooks with AAD authentication](https://docs.microsoft.com/en-us/azure/event-grid/secure-webhook-delivery), but that remains a public endpoint.

## Securing publishing

Before we talk about the second draft, let's address the security concern:  how do we secure publications?

At first, it seems a little baffling.  An API seems so easy to secure:  you just lock the door.  But something that broadcast events...  how do you make sure some events aren't picked up by some actor.

![Secure APIs](/assets/posts/2020/1/broadcasting-events-to-multiple-solutions/secure-apis.png)

![Secure Events](/assets/posts/2020/1/broadcasting-events-to-multiple-solutions/secure-events.png)

## Second draft

![Broadcast many topics](/assets/posts/2020/1/broadcasting-events-to-multiple-solutions/broadcast-many-topics.png)

![Broadcast to many solutions](/assets/posts/2020/1/broadcasting-events-to-multiple-solutions/broadcast-to-many.png)

## Proof of concept